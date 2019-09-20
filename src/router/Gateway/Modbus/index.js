import React, { Component } from 'react';
import {Tabs, message, Table, Empty} from 'antd';
import { inject, observer} from 'mobx-react';
import {withRouter} from 'react-router-dom';
import http from '../../../utils/Server';
import ModbusPane from './ModbusPane';
import {ConfigStore} from '../../../utils/ConfigUI'
import './style.scss'

const { TabPane } = Tabs;

@withRouter
@inject('store')
@observer
class Modbus extends Component {
    constructor (props) {
        super(props);
        this.newTabIndex = 0;
        const panes = [];
        this.state = {
            activeKey: '0',
            panes,
            data: undefined,
            visible: false,
            modalKey: 0,
            app_info: {},
            devs: [],
            configStore: new ConfigStore(),
            loop_gap: 1000,
            apdu_type: 'TCP',
            channel_type: 'serial',
            templateList: [],
            sn: null,
            loading: true,
            serial_opt: {
                port: '/dev/ttyS1',
                baudrate: 9600,
                stop_bits: 1,
                data_bits: 8,
                flow_control: 'OFF',
                parity: 'None'
            },
            socket_opt: {
                host: '127.0.0.1',
                port: 499,
                nodelay: true
            },
            templateStore: []
        };
    }
    componentDidMount () {
        this.setState({
            sn: this.props.match.params.sn
        }, ()=>{
            this.fetch()
            this.refreshTemplateList()
        })
    }
    UNSAFE_componentWillReceiveProps (nextProps){
        if (nextProps.match.params.sn !== this.props.match.params.sn) {
            this.setState({
                sn: nextProps.match.params.sn,
                loading: true
            }, ()=>{
                this.fetch()
            })
        }
    }
    refreshTemplateList = () => {
        this.setState({appTemplateList: []})
        http.get('/api/store_configurations_list?conf_type=Template&app=APP00000025')
        .then(res=>{
            let list = this.state.appTemplateList;
            res.data && res.data.length > 0 && res.data.map((tp)=>{
                if (undefined === list.find(item => item.name === tp.name) &&
                    tp.latest_version !== undefined && tp.latest_version !== 0 ) {
                    list.push(tp)
                }
            });
            this.setState({
                appTemplateList: list
            });
        });
        http.get('/api/user_configurations_list?conf_type=Template&app=APP00000025')
            .then(res=>{
                if (res.ok) {
                    let list = this.state.appTemplateList;
                    res.data && res.data.length > 0 && res.data.map((tp)=>{
                        if (undefined === list.find(item => item.name === tp.name) ) {
                            list.push(tp)
                        }
                    });
                    this.setState({
                        appTemplateList: list
                    });
                }
            });
    }
    onChange = activeKey => {
        console.log(activeKey)
        this.setState({ activeKey });
    };
    onEdit = (targetKey, action) => {
        this[action](targetKey);
    };
    add = () => {
        let inst = undefined;
        const applist = this.state.panes;
        if (applist && applist.length > 0 && applist.length < 8) {
            applist.map((item, key) =>{
                if (item.inst_name.indexOf(key + 1) === -1) {
                    if (!inst){
                        inst = 'modbus_' + (key + 1)
                    }
                }
            });
            const data = {
                inst_name: inst ? inst : 'modbus_' + (this.state.panes.length + 1),
                status: 'Not installed',
                conf: {
                    apdu_type: 'TCP',
                    channel_type: 'TCP',
                    devs: [],
                    loop_gap: '1000',
                    // serial_opt: {
                    //     port: '/dev/ttyS1',
                    //     baudrate: '9600',
                    //     stop_bits: '1',
                    //     data_bits: '8',
                    //     flow_control: 'OFF',
                    //     parity: 'None'
                    // },
                    socket_opt: {
                        host: '127.0.0.1',
                        port: 502,
                        nodelay: true
                    },
                    tpls: []
                },
                version: this.state.app_info.versionLatest
            }
            applist.push(data)
            this.setState({
                panes: applist
            })
        }
    }
    setActiveKey = (key)=>{
        this.setState({activeKey: key})
    }
    fetch = () => {
        http.get('/api/applications_read?app=APP00000025').then(res=>{
            if (res.ok) {
                this.setState({app_info: res.data})
            }
        })
        http.get('/api/gateways_app_list?gateway=' + this.state.sn + '&beta=0').then(res=>{
            if (res.ok){
                const app_list = [];
                if (res.data && res.data.length > 0) {
                    res.data.map(item=>{
                        if (item.inst_name.toLowerCase().indexOf('modbus') !== -1) {
                            app_list.push(item)
                        }
                    })
                }
                app_list.sort((a, b)=>{
                    return a.inst_name.slice(-1) - b.inst_name.slice(-1)
                })
                this.setData(app_list)
            } else {
                message.error(res.error)
            }
        })
    }
    setData = (apps)=> {
        this.setState({
            panes: apps, loading: false
        })
    }
    render () {
        return (
            <div>
                    {
                    !this.state.loading
                        ? this.state.panes && this.state.panes.length > 0
                                ? <Tabs
                                    onChange={this.onChange}
                                    activeKey={this.state.activeKey}
                                    type="editable-card"
                                    onEdit={this.onEdit}
                                  >
                            {
                                this.state.panes.map((pane, key) => (
                                    <TabPane
                                        tab={pane.inst_name.indexOf('_') !== -1 ? pane.inst_name.replace('_', '通道') : pane.inst_name}
                                        key={key}
                                        closable={false}
                                    >
                                        <ModbusPane
                                            key={key}
                                            pane={pane}
                                            panes={this.state.panes}
                                            fetch={this.fetch}
                                            setActiveKey={this.setActiveKey}
                                        />
                                    </TabPane>
                                ))
                            }
                            </Tabs>
                            : <Empty/>
                        : <Table loading/>
                    }
            </div>
        );
    }
}

export default Modbus;