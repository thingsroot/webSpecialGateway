import React, { Component } from 'react';
import {Tabs, message, Table, Result, Button, Icon} from 'antd';
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
            templateStore: [],
            currentPagePort: ''
        };
    }
    componentDidMount () {
        this.setState({
            sn: this.props.match.params.sn
        }, ()=>{
            this.fetch()
            this.refreshTemplateList()
        })
        this.t1 = setInterval(() => {
            this.fetch()
        }, 5000);
    }
    UNSAFE_componentWillReceiveProps (nextProps){
        if (nextProps.match.params.sn !== this.props.match.params.sn) {
            clearInterval(this.t1)
            this.setState({
                sn: nextProps.match.params.sn,
                loading: true,
                panes: [],
                activeKey: '0'
            }, ()=>{
                this.fetch()
                this.t1 = setInterval(() => {
                    this.fetch()
                }, 5000);
            })
        }
    }
    componentWillUnmount () {
        clearInterval(this.t1)
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
        const {panes} = this.state;
        console.log(activeKey)
        if (panes.length >= 9 && activeKey === '8') {
            return false;
        }
        if (panes.filter(item=> item.status === 'Not installed').length > 0 && activeKey === panes.length - 1 + '') {
            message.info('已有未安装通道，请在删除或安装通道后再执行操作！')
            return false;
        }
        if (activeKey === panes.length - 1 + '') {
            this.add()
            return false;
        }
        this.setState({ activeKey });
        if (this.state.panes[activeKey].conf.serial_opt) {
            console.log(this.state.panes[activeKey].conf.serial_opt.port === '/dev/ttyS1')
            if (this.state.panes[activeKey].conf.serial_opt.port === '/dev/ttyS1') {
                this.setState({currentPagePort: 'ttyS1'})
            } else {
                this.setState({currentPagePort: 'ttyS1'})
            }
            console.log(this.state.currentPagePort)
        }
    };
    onEdit = (targetKey, action) => {
        this[action](targetKey);
    };
    add = () => {
        let inst = undefined;
        let applist = this.state.panes;
        if (applist && applist.length > 0 && applist.length < 9) {
            applist.map((item, key) =>{
                if (item.inst_name.indexOf(key + 1) === -1) {
                    if (!inst && applist.filter(item=>item.inst_name === 'modbus_' + (key + 1)).length === 0){
                        inst = 'modbus_' + (key + 1)
                    }
                }
            });
        } else {
            inst = 'modbus_1'
        }
        const data = {
            inst_name: inst ? inst : 'modbus_' + (this.state.panes.length + 1),
            status: 'Not installed',
            conf: {
                apdu_type: 'TCP',
                channel_type: 'socket',
                devs: [],
                loop_gap: '1000',
                // serial_opt: {
                //     port: '--请选择--',
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
        applist.splice(applist.length - 1, 0, data)
        this.setState({
            panes: applist,
            activeKey: applist.length - 2 + ''
        })
    }
    setActiveKey = (key)=>{
        console.log(key, 'key')
        this.setState({activeKey: key})
        // this.fetch()
    }
    removeList = (inst) =>{
        const arr = this.state.panes.filter(item=> item.inst_name !== inst)
        this.setState({
            panes: arr
        })
    }
    removeNotInstall = (record) =>{
        const app_list = this.state.panes;
        app_list.map((item, key) => {
            if (item.inst_name === record) {
                app_list.splice(key, 1)
            }
        })

        this.setState({
            panes: app_list,
            activeKey: '0'
        })
    }
    fetch = (status) => {
        const addButton = {
            inst_name: '+',
            status: 'add button',
            conf: {}
        }
        http.get('/api/applications_read?app=APP00000025').then(res=>{
            if (res.ok) {
                this.setState({app_info: res.data})
            }
        })
        http.get('/api/gateways_app_list?gateway=' + this.state.sn + '&beta=0').then(res=>{
            if (res.ok){
                let app_list = [];
                if (res.data && res.data.length > 0) {
                    res.data.map(item=>{
                        if (item.inst_name.toLowerCase().indexOf('modbus_') !== -1) {
                            app_list.push(item)
                        }
                    })
                }
                const UnsavedChannel = this.state.panes.filter(item=>item.status === 'Not installed')
                app_list.sort((a, b)=>{
                    return a.inst_name.slice(-1) - b.inst_name.slice(-1)
                })
                if (UnsavedChannel.length > 0 && app_list.filter(item => item.inst_name === UnsavedChannel[0].inst_name).length === 0 && status !== 'success') {
                    app_list = app_list.concat(UnsavedChannel)
                }
                app_list.push(addButton)
                if (JSON.stringify(this.state.panes) !== JSON.stringify(app_list)) {
                    this.setData(app_list)
                }
            } else {
                message.error(res.error)
            }
        })
    }
    setData = (apps)=> {
        this.setState({
            panes: apps, loading: false
        })
    };
    render () {
        return (
            <div>
                    {
                    !this.state.loading
                        ? this.state.panes && this.state.panes.length > 0 && this.state.panes.length !== 1 && this.state.panes[0].status !== 'add button'
                                ? <Tabs
                                    onChange={this.onChange}
                                    activeKey={this.state.activeKey}
                                    type="editable-card"
                                    onEdit={this.onEdit}
                                    hideAdd
                                  >
                                    {
                                        this.state.panes.map((pane, key) => {
                                            const title = pane.inst_name.indexOf('_') !== -1 ?  pane.status === 'Not installed' ? pane.inst_name.replace('_', '通道') + '(未安装)' : pane.inst_name.replace('_', '通道') : pane.inst_name;
                                            const titles = pane.inst_name.indexOf('_') !== -1 ?  pane.inst_name : pane.inst_name;
                                            return (
                                                <TabPane
                                                    tab={
                                                        pane.status === 'add button'
                                                        ? title
                                                        : pane.status === 'running'
                                                            ? <span>
                                                                <Icon
                                                                    type="play-circle"
                                                                    style={{color: '#269f42'}}
                                                                />{title}</span>
                                                            : <span>
                                                                <Icon
                                                                    style={{color: '#d73a4a'}}
                                                                    type="pause-circle"
                                                                />{title}</span>
                                                    }
                                                    key={key}
                                                    closable={false}
                                                >
                                                    {
                                                        pane.status !== 'add button'
                                                        ? <ModbusPane
                                                            title={pane.inst_name}
                                                            removenotinstall={this.removeNotInstall}
                                                            key={key}
                                                            titles={titles}
                                                            remove={this.removeList}
                                                            pane={pane}
                                                            panes={this.state.panes}
                                                            fetch={this.fetch}
                                                            setActiveKey={this.setActiveKey}
                                                          />
                                                        : ''
                                                    }
                                                </TabPane>
                                            )
                                        })
                                    }
                            </Tabs>
                            : <Result
                                icon={
                                    <Icon
                                        type="smile"
                                        theme="twoTone"
                                    />
                                }
                                title="您的设备不存在Modbus通道，请添加!"
                                extra={
                                    <Button
                                        type="primary"
                                        onClick={this.add}
                                    >新增Modbus通道</Button>
                                }
                              />
                        : <Table loading/>
                    }
            </div>
        );
    }
}

export default Modbus;