import React, { Component } from 'react';
import http from '../../../utils/Server';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { message, Modal, Input, Select, Card } from 'antd';
import './style.scss';
const Option = Select.Option;
@inject('store')
@observer
@withRouter
class NetworkConfig extends Component {
    state = {
        data: [],
        brlan_ip: '',
        netmask: '255.255.255.0',
        inst_name: '',
        loading: true,
        default_gw: '',
        gw_interface: '',
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
                        message.map(value=>{
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
                    if (item.name === 'gw_interface') {
                        this.setState({
                            gw_interface: item.pv
                        })
                    }
                })
                this.setState({
                    data: arr,
                    loading: false
                }, ()=>{
                    console.log(this.state.data, message)
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
                    if (res.ok) {
                        if (res.data && res.data.length > 0){
                            res.data.map(item=>{
                                if (item.name === 'APP00000115') {
                                    isNetInfo = true;
                                    this.getWanInfo(item.inst_name)
                                }
                            })
                            resolve(isNetInfo)
                        } else {
                            reject(isNetInfo)
                        }
                    } else {
                        reject(isNetInfo)
                    }
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
        console.log(data)
      };
      handleCancel = () => {
        this.setState({
          visible: false
        });
      };
    render (){
        const {data, loading} = this.state;
        return (
            <div>
                <Card
                    loading={loading}
                >
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
                                                {
                                                    console.log(item)
                                                }
                                                <p>IP地址：<span>{item['ipv4-address'] ? item['ipv4-address'][0].address + '/' + item['ipv4-address'][0].mask : ''}
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
                                                <span>I P 地址:</span>
                                                <Input
                                                    style={{width: 300}}
                                                    onChange={(e)=>{
                                                        console.log(e.target.value)
                                                        this.setState({
                                                            brlan_ip: {...this.state.brlan_ip, address: e.target.value}
                                                        }, ()=>{
                                                            console.log(this.state.brlan_ip)
                                                        })
                                                    }}
                                                    value={this.state.brlan_ip.address}
                                                />
                                            </div>
                                            <div>
                                                <span>子网掩码:</span>
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
                        <p>| 默认网关&DNS</p>
                        <div>
                            <p>默认网关： {this.state.default_gw}</p>
                            <p>默认接口： {this.state.gw_interface}</p>
                            <p>默认网关： 114.114.114.114</p>
                            <p>默认网关： 114.114.115.115</p>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }
}

export default NetworkConfig;