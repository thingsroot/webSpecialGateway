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
                text: 'Modbus配置',
                href: '/modbus'
            }, {
                icon: 'setting',
                text: 'MQTT配置',
                href: '/mqtt'
            }
        ],
        index: 0
    }
    componentDidMount (){
        this.t1 = setInterval(() => {
            this.getNum()
        }, 500);
        this.TestingPath(this.props)
    }
    UNSAFE_componentWillReceiveProps (nextProps) {
        if (nextProps.location.pathname !== this.props.location.pathname) {
            this.TestingPath(nextProps)
        }
    }
    componentWillUnmount (){
        clearInterval(this.t1)
    }
    TestingPath (props) {
        const pathname = props.location.pathname.toLowerCase();
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
        } else if (pathname.indexOf('/logs') !== -1){
            this.setState({
                index: 6
            });
        } else if (pathname.indexOf('/comms') !== -1){
            this.setState({
                index: 7
            });
        } else if (pathname.indexOf('/networkconfig') !== -1){
            this.setState({
                index: 8
            });
        }
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
                                    {
                                        v.href.toLowerCase() === '/modbus' ? <div className="appcount count">{gatewayInfo.apps_count}</div> : ''
                                    }
                                    {
                                        v.href.toLowerCase() === '/mqtt' ? <div className="mqttcount count">{gatewayInfo.mqtt_count}</div> : ''
                                    }
                                    <Icon type={v.icon}/>&nbsp;&nbsp;{v.text}</li></Link>
                                )
                            })
                        }
                    </ul>
                </div>
                <div className="navlist">
                        <p className="FeaturesGroup">高级功能</p>
                        <ul>
                            <Link
                                to={`${url}/logs`}
                                onClick={()=>{
                                    this.setState({index: 6})
                                }}
                            >
                                <li
                                    className={index === 6 ? 'active' : ''}
                                >{this.state.lognum !== 0 ? <div className="logcount count">{this.state.lognum}</div> : ''}<Icon type="ordered-list"/>&nbsp;&nbsp;网关日志</li>
                            </Link>
                            <Link
                                to={`${url}/comms`}
                                onClick={()=>{
                                    this.setState({index: 7})
                                }}
                            >
                                <li
                                    className={index === 7 ? 'active' : ''}
                                >{this.state.commnum !== 0 ? <div className="logcount count">{this.state.commnum}</div> : ''}<Icon type="bars"/>&nbsp;&nbsp;网关报文</li>
                            </Link>
                            <Link
                                to={`${url}/networkconfig`}
                                onClick={()=>{
                                    this.setState({index: 8})
                                }}
                            >
                                <li
                                    className={index === 8 ? 'active' : ''}
                                ><Icon type="bell"/>&nbsp;&nbsp;网络配置</li>
                            </Link>
                        </ul>
                </div>
            </div>
        );
    }
}
export default LeftNav;