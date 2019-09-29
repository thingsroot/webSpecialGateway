import React, { Component } from 'react';
import {Dropdown, Button, Menu, Icon, message} from 'antd';
import http from '../../../utils/Server';
import { inject, observer} from 'mobx-react';
import { withRouter } from 'react-router-dom';
const style = { backgroundColor: '#2db7f5', color: '#fff', border: '1px solid #2db7f5' }
    @withRouter
    @inject('store')
    @observer
class Btn extends Component {
    state = {
        freeioe_version: null,
        skynet_version: null,
        modbus_version: null,
        mqtt_version: null,
        allBtnFlag: true,
        firmwareBtnFlag: true,
        MqttBtnFlag: true,
        ModbusBtnFlag: true,
        firmwareArr: [],
        mqttArr: [],
        modbusArr: [],
        loading: true
    }
    componentDidMount () {
        this.setState({
            sn: this.props.match.params.sn
        }, ()=>{
            this.getVersion()
        })
        setInterval(() => {
            this.getVersion()
        }, 10000);
    }
    UNSAFE_componentWillReceiveProps (nextProps){
        if (nextProps.match.params.sn !== this.props.match.params.sn) {
            this.setState({
                loading: true,
                mqtt_version: null,
                skynet_version: null,
                modbus_version: null,
                freeioe_version: null,
                sn: nextProps.match.params.sn
            }, ()=>{
                this.getVersion()
            })
        }
    }
    menu = () =>{
        return (
            <Menu style={{width: 140}}>
                <Menu.Item>
                    <div className="upgradeBtn">
                        <span>固件</span>
                        <Button
                            size="small"
                            disabled={this.state.firmwareBtnFlag}
                            style={this.state.firmwareBtnFlag ? {} : style}
                            onClick={()=>{
                                this.upgradeApp('freeioe')
                            }}
                        >升级</Button>
                    </div>
                </Menu.Item>
                <Menu.Item>
                    <div className="upgradeBtn">
                        <span>Modbus</span>
                        <Button
                            size="small"
                            type="primary"
                            disabled={this.state.ModbusBtnFlag}
                            style={this.state.ModbusBtnFlag ? {} : style}
                            onClick={()=>{
                                this.upgradeApp('modbus')
                            }}
                        >升级</Button>
                    </div>
                </Menu.Item>
                <Menu.Item>
                    <div className="upgradeBtn">
                        <span>MQTT</span>
                        <Button
                            size="small"
                            type="primary"
                            disabled={this.state.MqttBtnFlag}
                            style={this.state.MqttBtnFlag ? {} : style}
                            onClick={()=>{
                                this.upgradeApp('mqtt')
                            }}
                        >升级</Button>
                    </div>
                </Menu.Item>
            </Menu>
          )
    }
    upgradeApp (type){
        if (type === 'mqtt') {
            this.state.mqttArr.map(item=>{
                const data = {
                    gateway: this.props.match.params.sn,
                    id: `sys_upgrade/${type}/${this.props.match.params.sn}/${item}/${new Date() * 1}`,
                    app: 'APP00000259',
                    inst: item,
                    version: this.state.mqtt_version
                }
                http.post('/api/gateways_applications_upgrade', data).then(res=>{
                    if (res.ok) {
                        let title = '应用升级' + data.inst + '请求'
                        message.info(title + '等待网关响应!')
                        this.props.store.action.pushAction(res.data, title, '', data, 10000,  ()=> {
                            this.getVersion()
                        })
                    } else {
                        message.error(res.error)
                    }
                })
            })
        }
        if (type === 'modbus') {
            this.state.modbusArr.map(item=>{
                const modbus = {
                    app: 'APP00000025',
                    inst: item,
                    version: this.state.modbus_version,
                    gateway: this.props.match.params.sn,
                    id: `sys_upgrade/${type}/${this.props.match.params.sn}/${item}/${new Date() * 1}`
                }
                http.post('/api/gateways_applications_upgrade', modbus).then(res=>{
                    if (res.ok) {
                        let title = '应用升级' + modbus.inst + '请求'
                        message.info(title + '等待网关响应!')
                        this.props.store.action.pushAction(res.data, title, '', modbus, 10000,  ()=> {
                            this.getVersion()
                        })
                    } else {
                        message.error(res.error)
                    }
                })
            })
        }
        if (type === 'freeioe') {
            const datas = {
                name: this.props.match.params.sn,
                id: `sys_upgrade/${type}/${this.props.match.params.sn}/${new Date() * 1}`,
                no_ack: 1,
                skynet_version: this.state.skynet_version,
                version: this.state.freeioe_version
            }
                http.post('/api/gateways_upgrade', datas).then(res=>{
                    if (res.ok) {
                        let title = '网关固件升级请求'
                        message.info(title + '等待网关响应!')
                        this.props.store.action.pushAction(res.data, title, '', datas, 10000,  ()=> {
                            this.getVersion()
                        })
                    } else {
                        message.error(res.error)
                    }
                })
        }
    }
    getVersion () {
        const {gatewayInfo} = this.props.store;
        const { sn } = this.state;
        http.get('/api/gateways_read?name=' + sn).then(Response=>{
            if (Response.ok) {
                const beta = Response.data.data.enable_beta ? 1 : 0;
                const app_list = gatewayInfo.apps;
                const {freeioe_version, skynet_version, mqtt_version, modbus_version} = this.state;
                if (!mqtt_version) {
                    http.get('/api/applications_versions_latest?app=APP00000259&beta=' + beta).then(res=>{
                        if (res.ok){
                            this.setState({
                                mqtt_version: res.data
                            })
                        }
                    })
                }
                if (!freeioe_version){
                    http.get('/api/applications_versions_latest?app=freeioe&beta=' + beta).then(res=>{
                        if (res.ok){
                            this.setState({
                                freeioe_version: res.data
                            })
                        }
                    })
                }
                if (!skynet_version) {
                    http.get('/api/applications_versions_latest?app=bin/openwrt/19.07/arm_cortex-a7_neon-vfpv4/skynet&beta=' + beta).then(res=>{
                        if (res.ok){
                            this.setState({
                                skynet_version: res.data
                            })
                        }
                    })
                }
                if (!modbus_version) {
                    http.get('/api/applications_versions_latest?app=APP00000025&beta=' + beta).then(res=>{
                        if (res.ok){
                            this.setState({
                                modbus_version: res.data
                            })
                        }
                    })
                }
                if (mqtt_version) {
                    const mqttArr = [];
                    app_list && app_list.length > 0 && app_list.map((item) => {
                        if (item.name === 'APP00000259' && item.version < mqtt_version) {
                                mqttArr.push(item.inst_name)
                        }
                    })
                    const flag = mqttArr.length > 0 ? false : true
                    this.setState({MqttBtnFlag: flag, mqttArr})
                }
                if (modbus_version) {
                    const modbusArr = [];
                    app_list && app_list.length > 0 && app_list.map((item) => {
                        if (item.name === 'APP00000025' && item.version < modbus_version) {
                                modbusArr.push(item.inst_name)
                        }
                    })
                    const Flag = modbusArr.length > 0 ? false : true
                    this.setState({ModbusBtnFlag: Flag, modbusArr})
                }
                if (freeioe_version > Response.data.data.version || skynet_version > Response.data.data.skynet_version) {
                    this.setState({firmwareBtnFlag: false})
                }
                if (freeioe_version <= Response.data.data.version && skynet_version <= Response.data.data.skynet_version){
                    this.setState({firmwareBtnFlag: true})
                }
                if (skynet_version && modbus_version && mqtt_version) {
                    this.setState({
                        loading: false
                    })
                }
            }
        })
    }
    render () {
        const { firmwareBtnFlag, MqttBtnFlag, ModbusBtnFlag, loading} = this.state
        return (
            <div>
                {
                    loading
                    ? <Button
                        style={{
                            width: 140
                        }}
                        loading
                      >
                          版本获取中...
                      </Button>
                    : <Dropdown
                        overlay={this.menu}
                        disabled={firmwareBtnFlag && MqttBtnFlag && ModbusBtnFlag}
                      >
                        <Button
                            // type="primary"
                            className="ant-dropdown-link"
                            style={firmwareBtnFlag && MqttBtnFlag && ModbusBtnFlag ? {width: 140} : {...style, width: 140}}
                        >
                            {
                                !firmwareBtnFlag || !MqttBtnFlag || !ModbusBtnFlag
                                ? '网关升级'
                                : '已是最新版本'
                            } <Icon type="down" />
                        </Button>
                    </Dropdown>
                }
            </div>
        );
    }
}

export default Btn;