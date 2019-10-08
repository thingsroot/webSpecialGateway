import React, { Component } from 'react';
import { withRouter, Switch, Redirect } from 'react-router-dom';
import GatewayStatus from '../../common/GatewayStatus';
import LeftNav from '../../components/LeftNav';
import LoadableComponent from '../../utils/LoadableComponent';
import GatewayRoute from '../../components/GatewayRoute';
import './style.scss';
import http from '../../utils/Server';
import { inject, observer } from 'mobx-react';
import { Button, Icon, message } from 'antd';
import GatewayMQTT from '../../utils/GatewayMQTT';

const DeviceList = LoadableComponent(()=>import('./DeviceList'));
const Modbus = LoadableComponent(()=>import('./Modbus'));
const Mqtt = LoadableComponent(()=>import('./Mqtt'));
const Logviewer = LoadableComponent(()=>import('./Logviewer'));
const Comm = LoadableComponent(()=>import('./CommViewer'));
const NetworkConfig = LoadableComponent(()=>import('./NetworkConfig'));
const GatewaysDrawer = LoadableComponent(()=>import('../../common/GatewaysDrawer'));
@withRouter
@inject('store')
@observer
class MyGatesDevices extends Component {
    constructor (props){
        super(props);
        this.data_len = 0
        this.timer = null
        this.state = {
            gateway: '',
            visible: false,
            url: window.location.pathname,
            mqtt: new GatewayMQTT()
        }
    }
    componentDidMount (){
        this.setState({gateway: this.props.match.params.sn}, ()=>{
            this.props.store.timer.setGateStatusLast(0)
            this.fetch()
            clearInterval(this.timer)
            this.timer = setInterval(() => this.fetch(), 10000)
        })
    }
    UNSAFE_componentWillReceiveProps (nextProps){

        if (this.props.match.params.sn !== nextProps.match.params.sn &&
            this.state.gateway !== nextProps.match.params.sn){
            this.setState({gateway: nextProps.match.params.sn}, ()=>{
                this.state.mqtt.disconnect(true)
                this.props.store.timer.setGateStatusLast(0)
                this.fetch()
                clearInterval(this.timer)
                this.timer = setInterval(() => this.fetch(), 10000)
            })
        }
    }
    componentWillUnmount (){
        clearInterval(this.timer)
    }
    fetch = () => {
        const {gateway} = this.state;
        if (gateway === undefined || gateway === '') {
            return;
        }
        const {gatewayInfo} = this.props.store;
        if (!gatewayInfo.apps_is_show) {
            http.get('/api/gateways_app_list?gateway=' + gateway).then(res=>{
                if (res.ok) {
                    gatewayInfo.setApps(res.data);
                } else {
                    message.error(res.error)
                }
            })
        }
        if (!gatewayInfo.devices_is_show) {
            http.get('/api/gateways_dev_list?gateway=' + gateway).then(res=>{
                if (res.ok) {
                    gatewayInfo.setDevices(res.data)
                } else {
                    message.error(res.error)
                }
            })
        }
    }
    showDrawer = () => {
        this.setState({
            visible: true
        })
    }
    onClose = () => {
        this.setState({
            visible: false
        })
    }
    onChangeGateway = () => {
        //this.componentDidMount()
    }
    render () {
      const { path } = this.props.match;
      const { pathname } = this.props.location;
        return (
            <div>
                <GatewayStatus gateway={this.state.gateway}/>
                    <div className="mygatesdevices">
                        <LeftNav
                            prop={this.props.match.params}
                            gateway={this.state.gateway}
                            mqtt={this.state.mqtt}
                        />
                        {
                            pathname.indexOf('vnet') === -1 && pathname.indexOf('vserial') === -1
                            ? <Button type="primary"
                                onClick={this.showDrawer}
                                className="listbutton"
                              >
                                <Icon type="swap"/><br />
                            </Button>
                        : ''
                        }
                    <GatewaysDrawer
                        gateway={this.state.gateway}
                        onClose={this.onClose}
                        onChange={this.onChangeGateway}
                        visible={this.state.visible}
                    />
                    <div className="mygateslist">
                      <Switch>
                        <GatewayRoute path={`${path}/devices`}
                            component={DeviceList}
                            title="我的网关·设备列表"
                            gateway={this.state.gateway}
                        />
                        <GatewayRoute path={`${path}/modbus`}
                            component={Modbus}
                            title="我的网关·Modbus"
                            gateway={this.state.gateway}
                        />
                        <GatewayRoute path={`${path}/mqtt`}
                            component={Mqtt}
                            title="我的网关·MQTT"
                            gateway={this.state.gateway}
                        />
                        <GatewayRoute path={`${path}/networkconfig`}
                            component={NetworkConfig}
                            title="我的网关·网络配置"
                            gateway={this.state.gateway}
                        />
                        /> */}
                        <GatewayRoute path={`${path}/logs`}
                            component={Logviewer}
                            title="我的网关·日志"
                            mqtt={this.state.mqtt}
                            gateway={this.state.gateway}
                        />
                        <GatewayRoute path={`${path}/comms`}
                            component={Comm}
                            title="我的网关·报文"
                            mqtt={this.state.mqtt}
                            gateway={this.state.gateway}
                        />
                        <Redirect from={path}
                            to={`${path}/devices`}
                        />
                      </Switch>
                    </div>
                </div>
            </div>
        );
    }
}
export default MyGatesDevices;