import React, { Component } from 'react';
import http from '../../../utils/Server';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { message, Modal, Input, Select, Card, Form, Tooltip, Button } from 'antd';
import { IconIOT } from '../../../utils/iconfont';
import './style.scss';
const Option = Select.Option;
@withRouter
@inject('store')
@observer
class NetworkConfig extends Component {
    state = {
        data: [],
        brlan_ip: undefined,
        netmask: '255.255.255.0',
        inst_name: undefined,
        loading: true,
        visible: false,
        default_gw: undefined,
        gw_interface: undefined,
        dns_servers: undefined,
        sn: this.props.match.params.sn,
        running_action: false,
        uploadOneShort: false,
        dataSanpshotEnable: true,
        dataFlushEnable: true,
        interface: ''
    }
    componentDidMount () {
       this.getInfo()
       this.getGateywayInfo()
       this.t1 = setInterval(() => {
        this.getInfo()
       }, 10000);
       this.setintervalGayewayInfo = setInterval(() => {
           this.getGateywayInfo()
       }, 5000);
    }
    UNSAFE_componentWillReceiveProps (nextProps){
        if (nextProps.match.params.sn !== this.props.match.params.sn) {
            this.setState({
                loading: true,
                data: [],
                sn: nextProps.match.params.sn
            }, ()=>{
                this.getInfo()
                clearInterval(this.setintervalGayewayInfo)
                if (this.one_short_timer) {
                    clearInterval(this.one_short_timer)
                }
                this.getGateywayInfo()
                this.setintervalGayewayInfo = setInterval(() => {
                    this.getGateywayInfo()
                }, 5000);
            })
        }
    }
    componentWillUnmount (){
        clearInterval(this.t1)
        clearInterval(this.one_short_timer)
        clearInterval(this.setintervalGayewayInfo)
    }
    getGateywayInfo = () => {
        http.get('/api/gateways_read?name=' + this.state.sn).then(res=>{
            if (res.ok) {
                if (!res.data.data.data_upload) {
                    if (!this.one_short_timer) {
                        this.enableDataUploadOneShort(60)
                        this.one_short_timer = setInterval(()=>{
                            this.enableDataUploadOneShort(60)
                        }, 55000)
                    }
                }
            }
        })
    }
    enableDataUploadOneShort (duration) {
        const { gatewayInfo } = this.props.store;
        const { sn } = this.state;
        if (!gatewayInfo.data.data_upload) {
            let params = {
                name: this.state.sn,
                duration: duration,
                id: `enable_data_one_short/${sn}/${new Date() * 1}`
            }
            http.post('/api/gateways_enable_data_one_short', params).then(res => {
                if (!res.ok) {
                    message.error('临时数据上送指令失败:' + res.error)
                }
            }).catch( err => {
                message.error('临时数据上送指令失败:' + err)
            })
        }
    }
    dataSnapshot () {
        http.post('/api/gateways_data_snapshot', {name: this.state.sn}).then(res => {
            if (res.ok) {
                message.success('请求网关数据数据快照成功')
            } else {
                message.error('请求网关数据数据快照失败:' + res.error)
            }
        }).catch( err => {
            message.error('请求网关数据数据快照失败:' + err)
        })
    }
    dataFlush () {
        http.post('/api/gateways_data_flush', {name: this.state.sn}).then(res => {
            if (res.ok) {
                message.success('请求网关上送周期内数据成功')
            } else {
                message.error('请求网关上送周期内数据失败:' + res.error)
            }
        }).catch( err => {
            message.error('请求网关上送周期内数据失败:' + err)
        })
    }
    showConfirm = (res) => {
        const $this = this;
        Modal.confirm({
          title: '未安装net_info应用，是否安装?',
          content: '未安装net_info应用，是否安装',
          okText: '安装',
          cancelText: '取消',
          onOk () {
              $this.installNet_info(res)
              return false;
          },
          onCancel () {
              message.info('取消安装net_info')
              $this.props.history.push(`/gateway/${$this.props.match.params.sn}/devices`)
              return false
          }
        });
      }
    getInfo = ()=>{
        this.getIsNetInfo().then(res=>{
            if (res) {
                this.getWanInfo('net_info')
            } else {
                this.showConfirm(res)
                clearInterval(this.t1)
            }
        })
    }
    installNet_info = (res) => {
        if (!res && this.props.store.gatewayInfo.sn === this.state.sn) {
            const beta = this.props.store.gatewayInfo.enabled ? 1 : 0;
            const data = {
                app: 'APP00000115',
                conf: {},
                gateway: this.state.sn,
                id: `app_install/${this.state.sn}/net_info/APP00000115/${new Date() * 1}`,
                inst: 'net_info'
            }
            message.info('该网关未安装Netinfo应用，将为您自动安装，请稍后。')
            http.get('/api/applications_versions_latest?app=APP00000115&beta=' + beta).then(res=>{
                if (res.ok) {
                    data.version = res.data;
                    http.post('/api/gateways_applications_install', data).then(Response=>{
                        if (Response.ok){
                            let title = '安装应用' + data.inst + '请求'
                            message.info(title + '等待网关响应!')
                            this.props.store.action.pushAction(Response.data, title, '', data, 10000,  ()=> {
                                this.getWanInfo('net_info')
                                this.t1 = setInterval(() => {
                                    this.getWanInfo('net_info')
                                }, 10000);
                            })
                        }
                    })
                } else {
                    message.error(res.error)
                }
            })
        }
    }
    getWanInfo  = (instname) => {
        this.setState({
            inst_name: instname
        })
        http.get('/api/gateway_devf_data?gateway=' + this.state.sn + '&name=' + this.state.sn + '.' + instname).then(res=>{
            if (res.ok) {
                const arr = []
                res.data.map(item=>{
                    if (item.name === 'net_info') {
                        const message = JSON.parse(item.pv);
                        message && message.length > 0 && message.map(value=>{
                            if (value.interface === 'symrouter' || value.interface === 'loopback' || value.interface === 'wan6' || value.proto === 'dhcpv6'){
                                return false;
                            } else {
                                arr.push(value)
                            }
                        })
                    }
                    if (item.name === 'default_gw') {
                        this.setState({
                            default_gw: item.pv
                        })
                    }
                    if (item.name === 'default_gw') {
                        this.setState({
                            default_gw: item.pv
                        })
                    }
                    if (item.name === 'dns_servers') {
                        this.setState({
                            dns_servers: eval(item.pv)
                        })
                    }
                    if (item.name === 'gw_interface') {
                        this.setState({
                            gw_interface: item.pv
                        })
                    }
                })
                arr && arr.length > 0 && arr.map((item, index)=>{
                    if (item.interface === 'lan') {
                        arr.splice(index, 1)
                        arr.unshift(item)
                    }
                })
                this.setState({
                    data: arr,
                    loading: false
                })
            }
        })
    }
    startnetinfo = (inst_name) =>{
        if (!this.state.running_action){
            message.info('应用未启动，将为你自动启动')
            const data = {
                gateway: this.props.match.params.sn,
                inst: inst_name,
                id: `gateways/start/${this.props.match.params.sn}/${new Date() * 1}`
            }
            http.post('/api/gateways_applications_start', data).then(res=>{
                if (res.ok) {
                    message.success('启动' + data.inst + '请求发送成功')
                    this.props.store.action.pushAction(res.data, '启动应用', '', data, 10000,  ()=> {
                        this.props.update_app_list();
                    })
                    setTimeout(()=> {
                        this.setState({ running_action: true })
                    }, 2000)
                } else {
                    message.error('启动' +  data.inst + '请求发送失败。 错误:' + res.error)
                }
            }).catch(req=>{
                req;
                message.error('发送请求失败！')
                this.setState({ running_action: false });
            })
        }
    }
    getIsNetInfo = ()=>{
        let isNetInfo = false;
        return new Promise((resolve, reject) =>{
                http.get('/api/gateways_app_list?gateway=' + this.state.sn).then(res=>{
                    if (res.ok && res.data.length !== 0) {
                        if (res.data && res.data.length > 0){
                            res.data.map(item=>{
                                if (item.name === 'APP00000115') {
                                    isNetInfo = true;
                                    this.getWanInfo(item.inst_name)
                                    if (item.status !== 'running') {
                                        this.startnetinfo(item.inst_name)
                                    }
                                }
                            })
                            resolve(isNetInfo)
                        } else {
                            resolve(isNetInfo)
                        }
                    } else {
                        resolve(isNetInfo)
                    }
                }).catch(()=>{
                    reject(isNetInfo)
                })
        })
    }
    showModal = (ip, item) => {
        this.setState({
            interface: item.interface,
            visible: true,
            brlan_ip: ip
        });
      };
      handleOk = () => {
        this.setState({
          visible: false
        });
        const data = {
            gateway: this.state.sn,
            id: `send_output/${this.state.sn}/${this.state.sn}.net_info/${new Date() * 1}`,
            command: 'mod_interface',
            name: `${this.state.sn}.${this.state.inst_name}`,
            param: {
                interface: this.state.interface,
                proto: 'static',
                ipaddr: this.state.brlan_ip.address,
                netmask: this.state.netmask
            }
          }
          http.post('/api/gateways_dev_commands', data).then(res=>{
              if (res.ok) {
                let title = '更改lan IP地址与子网掩码地址' + data.name + '请求'
                message.info(title + '等待网关响应!')
                this.props.store.action.pushAction(res.data, title, '', data, 10000,  ()=> {
                    this.getWanInfo('net_info')
                })
              } else {
                  message.error(res.error)
              }
          })
      };
      handleCancel = () => {
        this.setState({
          visible: false
        });
      };
    render (){
        const {data, loading, dns_servers} = this.state;
        return (
            <div className="networkwrapper">
                <Card
                    loading={loading || data.length === 0}
                >
                    <div className="title">
                        <h2>| 网络接口</h2>
                        <div className="btn_to_set">
                        <Tooltip
                            placement="bottom"
                            title="强制网关上送最新数据"
                        >
                                <Button
                                    disabled={!this.state.dataFlushEnable}
                                    onClick={()=>{
                                        this.setState({dataFlushEnable: false})
                                        this.dataFlush()
                                        setTimeout(()=>{
                                            this.setState({dataFlushEnable: true})
                                        }, 1000)
                                    }}
                                >
                                    <IconIOT type="icon-APIshuchu"/>强制刷新
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                {
                    data && data.length > 0 && data.map((item, key)=>{
                        return (
                                <div
                                    key={key}
                                    className="networkpagelist"
                                >
                                    <p className="networkpagelist_title">{item.interface}</p>
                                    <div className="networkpagelist_content">
                                        <div className="networkpagelist_left">
                                            <div className="networkinfo_top">
                                                {item.interface}
                                            </div>
                                            <div className="networkinfo_bottom">
                                                {item.l3_device ? item.l3_device : item.device}
                                            </div>
                                        </div>
                                        <div className="networkpagelist_right">
                                            <div>
                                                <p>网络协议：<span>{item.proto}</span></p>
                                                <p>状态： <span>{item.up ? 'up' : 'down'}</span></p>
                                                <p>IP地址：<span>{item['ipv4-address'] && item['ipv4-address'].length > 0 && item['ipv4-address'][0].address ? item['ipv4-address'][0].address + '/' + item['ipv4-address'][0].mask : ''}
                                                    </span></p>
                                            </div>
                                        </div>
                                        {
                                            item.interface === 'lan'
                                            ? <div
                                                className="networksetinfo"
                                                onClick={()=>{
                                                    this.showModal(item['ipv4-address'][0], item)
                                                }}
                                              >
                                                编辑
                                            </div>
                                            : ''
                                        }
                                        <div className="modal_">
                                        <Modal
                                            maskClosable={false}
                                            title="修改lan IP地址与子网掩码"
                                            visible={this.state.visible}
                                            onOk={this.handleOk}
                                            onCancel={this.handleCancel}
                                            okText="更改"
                                            cancelText="取消"
                                            maskStyle={{backgroundColor: 'rgba(0,0,0,0.15)'}}
                                        >
                                            <div>
                                                <Form.Item label="I P 地址:">
                                                    <Input
                                                        style={{width: 300}}
                                                        onChange={(e)=>{
                                                            this.setState({
                                                                brlan_ip: {...this.state.brlan_ip, address: e.target.value}
                                                            })
                                                        }}
                                                        value={this.state.brlan_ip && this.state.brlan_ip.address ? this.state.brlan_ip.address : ''}
                                                    />
                                                </Form.Item>

                                            </div>
                                            <div>
                                                <Form.Item label="子网掩码:">
                                                    <Select
                                                        defaultValue="255.255.255.0"
                                                        style={{width: 300}}
                                                        onChange={(value)=>{
                                                            this.setState({
                                                                netmask: value
                                                            })
                                                        }}
                                                    >
                                                        <Option value="255.255.255.0">255.255.255.0</Option>
                                                        <Option value="255.255.254.0">255.255.254.0</Option>
                                                        <Option value="255.255.252.0">255.255.252.0</Option>
                                                        <Option value="255.255.128.0">255.255.128.0</Option>
                                                        <Option value="255.255.0.0">255.255.0.0</Option>
                                                    </Select>
                                                </Form.Item>
                                            </div>
                                        </Modal>
                                        </div>
                                    </div>
                            </div>
                        )
                    })
                }
                </Card>
                <div className="DNSinfo">
                    <Card loading={loading || data.length === 0}>
                        <h2>| 默认网关&DNS</h2>
                        <div style={{lineHeight: '30px', marginTop: '20px', marginLeft: '30px'}}>
                            <p>默认网关： {this.state.default_gw}</p>
                            <p>默认接口： {this.state.gw_interface}</p>
                            {
                                dns_servers && dns_servers.length > 0 &&  dns_servers.map((item, key)=>{
                                    return (
                                        <p key={key}>DNS{key + 1}: {item}</p>
                                    )
                                })
                            }
                        </div>
                    </Card>
                </div>
            </div>
        );
    }
}

export default NetworkConfig;