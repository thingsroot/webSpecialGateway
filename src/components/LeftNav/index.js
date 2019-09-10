import React, { Component } from 'react';
import { Icon } from 'antd';
import { Link, withRouter } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
// import EditSwitch from '../../router/Gateway/Settings/Edit/switch';
// import http from '../../utils/Server';
import './style.scss';
// import {IconIOT} from '../../utils/iconfont';
// const IconFont = Icon.createFromIconfontCN({
//     scriptUrl: '//at.alicdn.com/t/font_1163855_v0zrjr2i1em.js'
// })
@withRouter
@inject('store')
@observer
class LeftNav extends Component {
    state = {
        lognum: 0,
        commnum: 0,
        visible: false,
        list: [
            {
                icon: 'gold',
                text: '设备列表',
                href: '/devices'
            }, {
                icon: 'appstore',
                text: 'Modbus设置',
                href: '/modbus'
            }, {
                icon: 'setting',
                text: 'MQTT设置',
                href: '/mqtt'
            }
        ],
        index: 0
    }
    componentDidMount (){
        this.t1 = setInterval(() => {
            this.getNum()
        }, 500);
        const pathname = this.props.location.pathname.toLowerCase();
        if (pathname.indexOf('/devices') !== -1) {
            this.setState({
                index: 0
            })
        } else if (pathname.indexOf('/modbus') !== -1){
            this.setState({
                index: 1
            });
        } else if (pathname.indexOf('/mqtt') !== -1){
            this.setState({
                index: 2
            });
        }
    }
    componentWillUnmount (){
        clearInterval(this.t1)
    }
    setIndex (key){
        this.setState({
            index: key
        })
    }
    showModal = () => {
        this.setState({
          visible: true
        });
      };
    handleOk = e => {
    console.log(e);
    this.setState({
        visible: false
    });
    };
    handleCancel = e => {
    console.log(e);
    this.setState({
        visible: false
    });
    };
    // info () {
    //     Modal.info({
    //       title: '提示：',
    //       content: (
    //         <div>
    //           <p>该设备为虚拟设备,暂不支持此项功能！请更换设备后重试！</p>
    //         </div>
    //       )
    //     });
    //   }
    // enableVSERIAL (enable) {
    //     if (enable) {
    //         return this.installApp('freeioe_Vserial', 'APP00000130', '开启远程串口功能')
    //     } else {
    //         return this.removeApp('freeioe_Vserial', '关闭虚拟网络功能')
    //     }
    // }
    // enableVNET (enable) {
    //     if (enable) {
    //         return this.installApp('freeioe_Vnet', 'APP00000135', '开启远程编程网络功能')
    //     } else {
    //         return this.removeApp('freeioe_Vnet', '关闭虚拟网络功能')
    //     }
    // }
    // enableIOENetwork (enable){
    //     if (enable) {
    //         return this.installApp('ioe_network', 'network_uci', '开启虚拟网络功能')
    //     } else {
    //         return this.removeApp('ioe_network', '关闭虚拟网络功能')
    //     }
    // }
    // installApp (inst_name, app_name, title){
    //     return new Promise((resolve, reject) => {
    //         const { gateway } = this.props;
    //         let params = {
    //             gateway: gateway,
    //             inst: inst_name,
    //             app: app_name,
    //             version: 'latest',
    //             from_web: '1',
    //             conf: {
    //                 auto_start: true,
    //                 enable_web: true
    //             },
    //             id: `installapp/${gateway}/${inst_name}/${new Date() * 1}`
    //         }
    //         http.post('/api/gateways_applications_install', params).then(res=>{
    //             if (res.ok) {
    //                 message.info(title + '请求成功. 等待网关响应!')
    //                 this.props.store.action.pushAction(res.data, title, '', params, 30000,  (result)=> {
    //                     resolve(result, 60000)
    //                     this.props.refreshGatewayData();
    //                 })
    //             } else {
    //                 resolve(false)
    //                 message.error(res.error)
    //             }
    //         }).catch(err=>{
    //             reject(err)
    //             message.error(title + '发送请求失败：' + err)
    //         })
    //     })
    // }
    // removeApp (inst_name, title) {
    //     return new Promise((resolve, reject) => {
    //         const { gateway } = this.props;
    //         let params = {
    //             gateway: gateway,
    //             inst: inst_name,
    //             id: `removeapp/${gateway}/${inst_name}/${new Date() * 1}`
    //         }
    //         http.post('/api/gateways_applications_remove', params).then(res=>{
    //             if (res.ok) {
    //                 message.info(title + '请求成功. 等待网关响应!')
    //                 this.props.store.action.pushAction(res.data, title, '', params, 10000,  (result)=> {
    //                     resolve(result, 60000)
    //                     this.props.refreshGatewayData();
    //                 })
    //             } else {
    //                 resolve(false)
    //                 message.error(res.error)
    //             }
    //         }).catch(err=>{
    //             reject(err)
    //             message.error(title + '发送请求失败：' + err)
    //         })
    //     })
    // }
    getNum (){
        this.setState({
            commnum: this.props.mqtt.comm_channel.NewArrived,
            lognum: this.props.mqtt.log_channel.NewArrived
        })
    }
    render () {
        const { list, index } = this.state;
        const { url } = this.props.match;
        const { gatewayInfo } = this.props.store;
        return (
            <div className="leftnav">
                <div className="navlist">
                    <p className="FeaturesGroup">基本功能</p>
                    <ul>
                        {
                            list.map((v, i)=>{
                                return (
                                    <Link to={`${url}${v.href}`}
                                        key={i}
                                        onClick={()=>{
                                            this.setIndex(i)
                                        }}
                                    ><li className={index === i ? 'active' : ''}>
                                    {
                                        v.href.toLowerCase() === '/devices' ? <div className="gatecount count">{gatewayInfo.devices_count}</div> : ''
                                    }
                                    {/* {
                                        v.href.toLowerCase() === '/modbus' ? <div className="appcount count">{gatewayInfo.apps_count}</div> : ''
                                    } */}
                                    <Icon type={v.icon}/>&nbsp;&nbsp;{v.text}</li></Link>
                                )
                            })
                        }
                    </ul>
                </div>
                {/* <Modal
                    title="扩展功能设置"
                    visible={this.state.visible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    cancelText="取消"
                    okText="确认"
                >
                    <div className="list">
                        <span>
                            网络配置
                        </span>
                        <EditSwitch
                            checked={gatewayInfo.ioe_network}
                            disabled={!gatewayInfo.actionEnable}
                            gateway={gateway}
                            onChange={(checked, onResult)=>{
                                this.enableIOENetwork(checked).then((result) => {
                                    onResult(result)
                                })
                            }}
                        />
                    </div>
                    <div className="list">
                        <span>
                            远程串口编程 [*开启后可使用远程串口编程功能]
                        </span>
                        <EditSwitch
                            checked={gatewayInfo.isVserial}
                            disabled={!gatewayInfo.actionEnable}
                            gateway={gateway}
                            onChange={(checked, onResult)=>{
                                const { sn } = this.props.match.params;
                                if (sn.indexOf('TRTX') === -1 && sn.indexOf('-') === -1) {
                                    this.handleCancel()
                                    this.info()
                                    return false;
                                } else {
                                    this.enableVSERIAL(checked).then((result) => {
                                        onResult(result)
                                    })
                                }
                            }}
                        />
                        </div>
                        <div className="list">
                            <span>
                                远程网络编程 [*开启后可使用远程网络编程功能]
                            </span>
                            <EditSwitch
                                checked={gatewayInfo.isVnet}
                                disabled={!gatewayInfo.actionEnable}
                                gateway={gateway}
                                onChange={(checked, onResult)=>{
                                    const { sn } = this.props.match.params;
                                    if (sn.indexOf('TRTX') === -1 && sn.indexOf('-') === -1) {
                                        this.handleCancel()
                                        this.info()
                                        return false;
                                    } else {
                                        this.enableVNET(checked).then((result) => {
                                            onResult(result)
                                        })
                                    }
                                }}
                            />
                        </div>
                    </Modal> */}
            </div>
        );
    }
}
export default LeftNav;