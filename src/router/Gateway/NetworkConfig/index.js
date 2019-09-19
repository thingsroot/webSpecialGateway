import React, { Component } from 'react';
import http from '../../../utils/Server';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { message, Modal, Input, Select, Card, Form } from 'antd';
import './style.scss';
const Option = Select.Option;
@inject('store')
@observer
@withRouter
class NetworkConfig extends Component {
    state = {
        data: [],
        brlan_ip: undefined,
        netmask: '255.255.255.0',
        inst_name: undefined,
        loading: true,
        default_gw: undefined,
        gw_interface: undefined,
        dns_servers: undefined,
        sn: this.props.match.params.sn
    }
    componentDidMount () {
       this.getInfo()
       this.t1 = setInterval(() => {
        this.getInfo()
       }, 10000);
    }
    UNSAFE_componentWillReceiveProps (nextProps){
        if (nextProps.match.params.sn !== this.props.match.params.sn) {
            this.setState({
                loading: true,
                sn: nextProps.match.params.sn
            }, ()=>{
                this.getInfo()
            })
        }
    }
    componentWillUnmount (){
        clearInterval(this.t1)
    }
    getInfo = ()=>{
        this.getIsNetInfo().then(res=>{
            console.log(res)
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
                                })
                            }
                        })
                    } else {
                        message.error(res.error)
                    }
                })
            }
        })
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
                this.setState({
                    data: arr,
                    loading: false
                })
            }
        })
    }
    getIsNetInfo = ()=>{
        let isNetInfo = false;
        const { apps } = this.props.store.gatewayInfo;
        return new Promise((resolve, reject) =>{
            if (apps && apps.length > 0 && this.state.sn === this.props.store.gatewayInfo.sn) {
                apps.map(item=>{
                    if (item.name === 'APP00000115') {
                        isNetInfo = true;
                        this.getWanInfo(item.inst_name)
                    }
                })
                resolve(isNetInfo)
            } else {
                http.get('/api/gateways_app_list?gateway=' + this.state.sn).then(res=>{
                    if (res.ok && res.data.length > 0) {
                        if (res.data && res.data.length > 0){
                            res.data.map(item=>{
                                if (item.name === 'APP00000115') {
                                    isNetInfo = true;
                                    this.getWanInfo(item.inst_name)
                                }
                            })
                            resolve(isNetInfo)
                        } else {
                            console.log('null')
                            resolve(isNetInfo)
                        }
                    } else {
                        resolve(isNetInfo)
                    }
                }).catch(()=>{
                    reject(isNetInfo)
                })
            }
        })
    }
    showModal = (ip) => {

        this.setState({
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
                interface: 'lan',
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
            <div>
                <Card
                    loading={loading}
                >
                    <h2>| 网络接口</h2>
                {
                    data && data.length > 0 && data.map((item, key)=>{
                        return (
                                <div
                                    key={key}
                                    className="networkpagelist"
                                >
                                    <p className="networkpagelist_title">{item.device}</p>
                                    <div className="networkpagelist_content">
                                        <div className="networkpagelist_left">
                                            <div className="networkinfo_top">
                                                {item.interface}
                                            </div>
                                            <div className="networkinfo_bottom">
                                                {item.device}
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
                                            item.device === 'br-lan'
                                            ? <div
                                                className="networksetinfo"
                                                onClick={()=>{
                                                    this.showModal(item['ipv4-address'][0])
                                                }}
                                              >
                                                编辑
                                            </div>
                                            : ''
                                        }
                                        <Modal
                                            title="修改br-lan IP地址与子网掩码"
                                            visible={this.state.visible}
                                            onOk={this.handleOk}
                                            onCancel={this.handleCancel}
                                            okText="更改"
                                            cancelText="取消"
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
                        )
                    })
                }
                </Card>
                <div style={{marginTop: 20}}>
                    <Card loading={loading}>
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