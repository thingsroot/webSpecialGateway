import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import { inject, observer} from 'mobx-react';
import {Select, Table, Button, InputNumber, Checkbox, Form, Divider, Input, message, Popconfirm, Modal, Progress, Result, Tooltip} from 'antd';
// import Slide from 'react-slick'
import http from '../../../../utils/Server';
import EditableTable from  '../EditableTable'
import './style.scss';
import GatewayMQTT from '../../../../utils/GatewayMQTT';
import ReactList from 'react-list';
import { isArray } from 'util';
import { _getCookie } from '../../../../utils/Session';
const { Option } = Select;
const { confirm } = Modal;

@withRouter
@inject('store')
@observer
class ModbusPane extends Component {
    constructor (props) {
        super(props)
        const addTempLists = [
            {
                title: '名称',
                width: '15%',
                dataIndex: 'conf_name',
                key: 'conf_name',
                render: text => <span>{text}</span>
            }, {
                title: '描述',
                width: '20%',
                dataIndex: 'description',
                key: 'description'
            }, {
                title: '模板所有者',
                width: '15%',
                dataIndex: 'owner_id',
                key: 'owner_id',
                render: (record)=>(
                    <Tooltip title={record}>
                        <span>{record}</span>
                    </Tooltip>
                )
            }, {
                title: '模板ID',
                width: '15%',
                dataIndex: 'name',
                key: 'name'
            }, {
                title: '版本',
                width: '10%',
                key: 'latest_version',
                dataIndex: 'latest_version'
            }, {
                title: '操作',
                width: '25%',
                render: (record) => (
                    record.latest_version !== undefined && record.latest_version !== 0 ? (
                        <span>
                            <Button
                                onClick={()=>{
                                    this.onViewTemplate(record.name, record.latest_version)
                                }}
                            > 查看 </Button>
                        <span style={{padding: '0 1px'}}> </span>
                            {
                                record.owner !== '' ? (
                                    <Button
                                        onClick={()=>{
                                            this.onCloneTemplate(record.name, record.latest_version)
                                        }}
                                    > 克隆 </Button> ) : null
                            }
                            <span style={{padding: '0 1px'}}> </span>
                        <Button
                            type="primary"
                            onClick={()=>{
                                const conf = {
                                    description: record.description,
                                    id: record.name,
                                    key: 1,
                                    name: record.conf_name,
                                    ver: record.latest_version
                                }
                                this.onAddTemplate(conf)
                            }}
                        > 添加 </Button>
                    </span>) : (
                        <span>
                            <Button
                                onClick={()=>{
                                    this.onViewTemplate(record.name)
                                }}
                            > 查看</Button>
                        </span>
                    )
                )
            }
        ];
        this. state = {
            // conf: {
            mqtt: new GatewayMQTT(),
            number: 0,
            isShow: false,
            result: true,
            ShowResult: false,
            pressVisible: false,
            tpls: [],
            devs: [],
            loop_gap: 1000,
            apdu_type: 'TCP',
            channel_type: 'TCP',
            serial_opt: {
                port: this.currentPort || 'COM1',
                baudrate: 9600,
                stop_bits: 1,
                data_bits: 8,
                flow_control: 'OFF',
                parity: 'None'
            },
            socket_opt: {
                host: '127.0.0.1',
                port: 502,
                nodelay: true
            },
            devsCloumns: [
                {
                    title: '地址',
                    dataIndex: 'unit',
                    key: 'unit'
                },
                {
                    title: '设备名称',
                    dataIndex: 'name',
                    key: 'name'
                },
                {
                    title: '设备序列号',
                    dataIndex: 'sn',
                    key: 'sn'
                },
                {
                    title: '模板',
                    dataIndex: 'tpl',
                    key: 'tpl'
                },
                {
                    title: '操作',
                    dataIndex: 'action',
                    key: 'action'
                }
            ],
            tplsCloumns: [
                {
                    title: '名称',
                    dataIndex: 'name',
                    key: 'name'
                },
                {
                    title: '描述',
                    dataIndex: 'desc',
                    key: 'desc'
                },
                {
                    title: '模板ID',
                    dataIndex: 'id',
                    key: 'id'
                },
                {
                    title: '版本',
                    dataIndex: 'ver',
                    key: 'ver'
                },
                {
                    title: '操作',
                    dataIndex: 'action',
                    key: 'action',
                    render: (conf, record)=>{
                        return (
                            <div>
                                <Button
                                    disabled={this.state.disabled}
                                    onClick={()=>{
                                        this.onViewTemplate(record.id, record.latest_version)
                                    }}
                                > 查看 </Button>&nbsp;&nbsp;
                                {
                                    this.state.templateList.length >= 1 ? (
                                        <Popconfirm
                                            title="确定要删除吗 ?"
                                            okText="确定"
                                            cancelText="删除"
                                            onConfirm={() => {
                                                const list = this.state.templateList.filter(item => record.key !== item.key);
                                                this.setState({
                                                    templateList: list
                                                })
                                            }}
                                        >
                                            <Button
                                                type="danger"
                                                disabled={this.state.disabled}
                                            >删除</Button>
                                        </Popconfirm>
                                    ) : null
                                }
                            </div>
                        )
                    }
                }
            ],
            disabled: true,
            templateList: [],
            addTempLists,
            TheBackupappTemplateList: [],
            totalPanes: [],
            checkIp: false,
            communication: false,
            filter_text: '',
            origTemplate: [],
            loading: false,
            checkOption: false
        }

    }
    UNSAFE_componentWillMount () {
        if (this.props.panes.length) {
            console.log(this.props.panes, 'panes')
            let s1 = this.props.panes.some(item => item.conf.serial_opt ? item.conf.serial_opt.port === '/dev/ttyS1' : '');
            let s2 = this.props.panes.some(item => item.conf.serial_opt ? item.conf.serial_opt.port === '/dev/ttyS2' : '');
            let serial_opt = this.state.serial_opt
            if (s1) {
                console.log('s1')
                serial_opt.port = 'COM2'
                this.setState({serial_opt})
            }
            if (s1 && !s2) {
                console.log('!s2')
            }
            if (s2) {
                serial_opt.port = 'COM1'
                this.setState({serial_opt})
            }
            if (s1 && s2) {
                this.setState({
                    communication: true
                })
            } else {
                this.setState({
                    communicationFt: false
                })
            }
        }
    }
    componentDidMount () {
        const { conf } = this.props.pane;
        this.setState({
            apdu_type: conf.apdu_type,
            channel_type: conf.channel_type,
            dev_sn_prefix: conf.dev_sn_prefix,
            loop_gap: conf.loop_gap,
            tpls: isArray(conf.tpls) ? conf.tpls : [],
            templateList: isArray(conf.tpls) ? conf.tpls : [],
            devs: conf.devs
        })
        if (conf.serial_opt) {
            this.setState({
                serial_opt: conf.serial_opt
            })
        }
        if (conf.socket_opt) {
            this.setState({
                socket_opt: conf.socket_opt
            })
        }
        if (this.props.pane.status === 'Not installed') {
            this.setState({
                disabled: false
            })
        }
        // this.checkOption()
    }
    UNSAFE_componentWillReceiveProps () {
        if (!this.state.disabled) {
            return false;
        }
    }
    componentWillUnmount () {
        this.t1 && clearInterval(this.t1)
    }
    checkOption () {
        console.log(this.state.serial_opt)
        if (this.props.panes.length) {
                    let s1 = this.props.panes.some(item => item.conf.serial_opt ? item.conf.serial_opt.port === '/dev/ttyS1' : '');
                    let s2 = this.props.panes.some(item => item.conf.serial_opt ? item.conf.serial_opt.port === '/dev/ttyS2' : '');
                    let option = '';
                    switch (true) {
                        case s1 && s2 :
                            option = this.optionDisabled();
                            break;
                        case !s1 && !s2:
                            option = this.optionTotal();
                            break;
                        case s1:
                             console.log('s1 show');
                             // if (this.props.currentPagePort === 'ttyS1' && !s2) {
                             //    option = this.optionTotal();
                             //     break;
                             // } else {
                             //   option = this.optionS2();
                             //     break;
                             // }
                            option = this.optionS2();
                            break;
                        case s2:
                            console.log('s2 show');
                            // if (this.props.currentPagePort === 'ttyS2' && !s1) {
                            //     option = this.optionTotal();
                            //     break;
                            // } else {
                            //     option = this.optionS1();
                            //     break;
                            // }
                            option = this.optionS1();
                            break;
                        default:
                            console.log(5);
                    }
                    return option
        }
    }
    optionS1 = () => (
        <Option
            value="/dev/ttyS1"
            key="/dev/ttyS1"
        >COM1</Option>);
    optionS2 = () => (
        <Option
            value="/dev/ttyS2"
            key="/dev/ttyS2"
        >COM2</Option>);
    optionDisabled = () => (
        <Option
            value="disabled"
            key="disabled"
            disabled
        >不可选</Option>);
    optionTotal =() => {
        return [
            <Option
                value="/dev/ttyS1"
                key="/dev/ttyS1"
            >COM1</Option>,
            <Option
                value="/dev/ttyS2"
                key="/dev/ttyS2"
            >COM2</Option>
        ]
    };
    setSetting = (type, val, name) =>{
        if (type === 'serial_opt') {
            this.setState({
                serial_opt: Object.assign({}, this.state.serial_opt, {[name]: val})
            })
            console.log(this.state.serial_opt, 'serial')
        }
        if (type === 'socket_opt') {
            this.setState({
                socket_opt: Object.assign({}, this.state.socket_opt, {[name]: val})
            })
            console.log(this.state.socket_opt, 'socket')
        }
        if (!name){
            this.setState({
                [type]: val
            })
        }

    };
    addaccout = () =>{
        const number = this.state.number;
        if (number <= 89) {
            this.setState({
                number: number + 8
            }, () => {
                setTimeout(() => {
                    this.addaccout()
                }, 200);
            })
        }
    }
    tick (time){
        const { mqtt } = this.state;
        mqtt.tick(time)

        const data = {
            duration: time || 60,
            name: this.props.match.params.sn,
            id: `sys_enable_log/${this.props.match.params.sn}/${new Date() * 1}`
        }
        http.post('/api/gateways_enable_log', data)
    }
    startChannel =()=>{
        const mqtt = this.state.mqtt;
        this.tick(60)
        this.t1 = setInterval(()=>this.tick(60), 59000);
        mqtt.connect(this.props.match.params.sn, '/log')
    }
    stopChannel =()=>{
        const { mqtt } = this.state;
        mqtt.unsubscribe('/log')
        mqtt.disconnect()
        clearInterval(this.t1)
        const data = {
            duration: 0,
            name: this.props.match.params.sn,
            id: `sys_enable_log/${this.props.match.params.sn}/${new Date() * 1}`
        }
        http.post('/api/gateways_enable_log', data)
    }
    installapp = () => {
        console.log(this.state.serial_opt.port)
        if (this.state.serial_opt.port === 'COM1') {
            let serial_opt = this.state.serial_opt;
            serial_opt.port = '/dev/ttyS1'
            this.setState({serial_opt})
        }
        if (this.state.serial_opt.port === 'COM2') {
            let serial_opt = this.state.serial_opt;
            serial_opt.port = '/dev/ttyS2'
            this.setState({serial_opt})
        }
            const data = {
                app: 'APP00000025',
                conf: {
                    apdu_type: this.state.apdu_type,
                    channel_type: this.state.channel_type,
                    dev_sn_prefix: true,
                    devs: this.state.devs,
                    loop_gap: this.state.loop_gap,
                    serial_opt: this.state.channel_type === 'serial' ? this.state.serial_opt : undefined,
                    socket_opt: this.state.channel_type === 'TCP' ? this.state.socket_opt : undefined,
                    tpls: this.state.tpls
                },
                gateway: this.props.match.params.sn,
                id: 'app_install/' + this.props.match.params.sn + '/' + this.props.pane.inst_name + '/APP00000259/' + new Date() * 1,
                inst: this.props.pane.inst_name,
                version: this.props.pane.version
            }
            http.post('/api/gateways_applications_install', data).then(res=>{
                if (res.ok) {
                    // let title = '安装应用' + data.inst + '请求'
                    // message.info(title + '等待网关响应!')
                    this.props.store.action.pushAction(res.data, '安装', '', data, 10000,  (action)=> {
                        console.log(action)
                        this.props.fetch('success')
                        if (action) {
                            this.setState({
                                number: 100,
                                result: true,
                                ShowResult: true
                            }, ()=>{
                                this.stopChannel()
                            })
                        } else {
                            this.setState({result: false, ShowResult: true, number: 99}, ()=>{
                                this.stopChannel()
                            })
                        }
                    })
                } else {
                    message.error(res.error)
                    this.setState({
                        number: 99
                    })
                }
            })
    }
    AppConf = (status) => {
            if (this.props.pane.status === 'Not installed'  && status === 'install') {
                this.state.devs.map(item=>{
                    console.log(item)
                    console.log(this.state.devs.filter(items=>{
                        if (items.unit === item.unit && items.key !== items.key) {
                            return items
                        }
                    }))
                })
                this.startChannel()
                this.setState({
                    pressVisible: true,
                    number: 0,
                    result: false,
                    action: 'install'
                }, ()=>{
                    this.addaccout()
                })
                setTimeout(() => {
                    this.installapp()
                }, 3000);
                return false;
            }
        if (status === 'remove') {
            this.setState({
                pressVisible: true,
                number: 0,
                result: false,
                action: 'remove'
            }, ()=>{
                this.addaccout()
            })
            setTimeout(() => {
                this.uninstall()
            }, 2000);
            return false;
        }
            const data = {
                conf: {
                    apdu_type: this.state.apdu_type,
                    channel_type: this.state.channel_type,
                    dev_sn_prefix: this.state.dev_sn_prefix,
                    devs: this.state.devs,
                    loop_gap: this.state.loop_gap,
                    serial_opt: this.state.channel_type === 'serial' ? this.state.serial_opt : undefined,
                    socket_opt: this.state.channel_type === 'TCP' ? this.state.socket_opt : undefined,
                    tpls: this.state.templateList
                },
                gateway: this.props.match.params.sn,
                id: `/gateways/${this.props.match.params.sn}/config/${this.props.pane.inst_name}/${new Date() * 1}`,
                inst: this.props.pane.inst_name
            };
        if (data.conf.devs.length) {
            http.post('/api/gateways_applications_conf', data).then(res=>{
                if (res.ok) {
                    let title = '配置应用' + data.inst + '请求'
                    message.info(title + '等待网关响应!')
                    this.props.store.action.pushAction(res.data, title, '', data, 10000,  ()=> {
                        this.props.fetch()
                    })
                } else {
                    message.error(res.error)
                }
            })
        } else {
            message.error('设备列表不能为空');
            return false
        }
    }
    toggleDisable = () => {
        if (this.state.tpls.length === 0 || this.state.devs.length === 0) {
            if (!this.state.disabled){
                message.info('模板和设备列表不能为空，请重新选择！')
                return false;
            }
        }
        // this.state.tpls.map(data=>{
        //     if (this.state.tpls.filter())
        // })
        this.setState({disabled: !this.state.disabled}, ()=>{
            if (this.state.disabled) {
                this.AppConf('install');
            }
        })
    };
    removeModbus = () =>{
        if (this.props.pane.status === 'Not installed') {
            this.props.removenotinstall(this.props.pane.inst_name)
            return false
        }
        this.setState({
            ShowResult: false
        }, () => {
            this.AppConf('remove');
        })
    };
    uninstall = () => {
        const data = {
            gateway: this.props.match.params.sn,
            inst: this.props.pane.inst_name,
            id: `app_remove/${this.props.match.params.sn}/${this.props.pane.inst_name}/${new Date() * 1}`
        }
        http.post('/api/gateways_applications_remove', data).then(res=>{
            if (res.ok) {
                let title = '卸载应用' + data.inst + '请求成功!'
                // message.info(title + '等待网关响应!')
                this.props.store.action.pushAction(res.data, title, '', data, 10000,  ()=> {
                    this.setState({
                        number: 100,
                        ShowResult: true,
                        result: true
                    })
                    this.props.fetch()
                    this.props.setActiveKey('0')
                })
            } else {
                this.setState({
                    number: 99
                })
            }
        })
    }
    templateShow = () => {
        this.refreshTemplateList()
        this.setState({
            showTemplateSelection: true
        })
    };
    handleCancelAddTempList = ()=>{
        this.setState({
            showTemplateSelection: false
        })
    };
    refreshTemplateList = () => {
        this.setState({
            loading: true
        }, ()=>{
            const owner = this.props.pane.data ? this.props.pane.data : 'dirk.chang@symid.com';
            this.setState({appTemplateList: []})
            http.get('/api/store_configurations_list?conf_type=Template&app=APP00000025').then(res=> {
                let list = this.state.appTemplateList;
                res.data && res.data.length > 0 && res.data.map((tp)=>{
                    if (undefined === list.find(item => item.name === tp.name) &&
                        tp.latest_version !== undefined && tp.latest_version !== 0 ) {
                        if (undefined === list.find(item => item.name === tp.name) && tp.latest_version !== undefined && tp.latest_version !== 0) {
                            list.push(tp)
                        }
                    }
                });
                list.sort(function (b, a) {
                    const id = _getCookie('user_id')
                    const order = [owner, id];
                    return order.indexOf(a.owner_id) - order.indexOf(b.owner_id)
                });
                this.setState({
                    appTemplateList: list,
                    TheBackupappTemplateList: list,
                    loading: false
                });
            });
        })
    };
    onCreateNewTemplate = () => {
        window.open('/appdetails/APP00000025/new_template', '_blank')
    };
    search = (value) => {
        console.log(value)
        if (value) {
            const newList = this.state.TheBackupappTemplateList.filter(item=>item.name.toLocaleLowerCase().indexOf(value) !== -1 || item.description.indexOf(value) !== -1 || item.conf_name.toLocaleLowerCase().indexOf(value) !== -1)
            console.log(newList)
            this.setState({
                appTemplateList: newList
            })
        } else {
            this.setState({
                appTemplateList: this.state.TheBackupappTemplateList
            })
        }
    }
    //查看模板
    onViewTemplate = (conf, version) => {
        if (version !== undefined && version !== 0) {
            window.open(`/template/APP00000025/${conf}/${version}`, '_blank')
        } else {
            window.open(`/template/APP00000025/${conf}`)
        }
    };
    //克隆模板
    onCloneTemplate = (conf, version)=> {
        window.open(`/template/APP00000025/${conf}/${version}/clone`, '_blank')
    };
    //添加模板
    onAddTemplate = (config)=>{
        const list = this.state.templateList;
        let check = this.state.templateList.some(item => item.id === config.id);
        if (check) {
            message.info('已存在相同模板，请勿重复添加！')
        } else {
                const obj = {
                    id: config.id,
                    desc: config.description,
                    name: config.name,
                    ver: config.ver,
                    key: list.length + 1
                }
                list.push(obj)
                this.setState({
                    templateList: list,
                    tpls: list
                })
            }
    };
    getDevs = (devs) => {
        const arr = [];
        if (devs && devs.length > 0){
            devs.map((item, index)=>{
                const obj = {
                    index: index,
                    key: item.key,
                    unit: item.address,
                    name: item.device,   // 应用所属实例
                    sn: item.number,
                    tpl: item.template === '选择模板' ? undefined : item.template
                }
                arr.push(obj)
            })
            this.setState({devs: arr})
        } else {
            this.setState({devs: []})
        }
    };
    isValid = e => {
        let value = e.target.value;
        let reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
        if (!reg.test(value)) {
            this.setState({checkIp: true})
            return false
        } else {
            this.setState({checkIp: false})
        }
    };
    showTitle = () => this.props.pane.status === 'Not installed' ? '确定要取消安装Modbus通道吗？' : '确定要删除应用Modbus吗?'
    showConfirm =() => {
        confirm({
            title: this.props.pane.status === 'Not installed' ? '确定要取消安装Modbus通道吗？' : '确定要删除应用Modbus吗?',
            content: '',
            okText: '确定',
            cancelText: '取消',
            onOk: ()=> {
                this.removeModbus()
            },
            onCancel () {
            }
        })
    }
    render (){
        const conf = this.props.pane.conf
        const  { loop_gap, apdu_type, channel_type, serial_opt, disabled, socket_opt, tpls, devs, dev_sn_prefix, mqtt, isShow, loading} = this.state;
        devs, tpls;
        return (
            <div className="ModbusPane">
                <div className="ModbusPaneAffix">
                        <Button
                            style={{marginLeft: '10pxs', marginRight: '20px'}}
                            type="primary"
                            disabled={this.state.checkIp}
                            onClick={this.toggleDisable}
                        >
                            {
                                this.props.pane.status === 'Not installed'
                                ? '安装'
                                : !this.state.disabled ? '保存' : '编辑'
                            }
                        </Button>
                        {/*<Popconfirm*/}
                        {/* title={this.props.pane.status === 'Not installed' ? '确定要取消安装Modbus通道吗？' : '确定要删除应用Modbus吗?'}
*/}
                        {/*    onConfirm={this.removeModbus}*/}
                        {/*    onCancel={cancel}*/}
                        {/*    okText="删除"*/}
                        {/*    cancelText="取消"*/}
                        {/*>*/}
                            <Button
                                style={{marginLeft: '10pxs'}}
                                type="danger"
                                disabled={this.state.checkIp}
                                onClick={this.showConfirm}
                            >
                                {
                                    this.props.pane.status === 'Not installed'
                                    ? '取消添加'
                                    : '删除'
                                }
                            </Button>
                        {/*</Popconfirm>*/}
                        {
                            !disabled && this.props.pane.status !== 'Not installed'
                            ? <Button
                                style={{
                                    marginLeft: '20px'
                                }}
                                onClick={()=>{
                                    this.setState({disabled: true})
                                }}
                                disabled={this.state.checkIp}
                              >
                                    取消编辑
                                </Button>
                            : ''
                        }
                        </div>
                <Form layout="inline">
                    <Divider  orientation="left">应用配置信息</Divider>
                    <Form.Item label="采集间隔:">
                        <InputNumber
                            disabled={disabled}
                            min={1}
                            max={10000}
                            value={loop_gap}
                            onChange={(val)=>{
                                this.setSetting('loop_gap', val)
                            }}
                        />
                        &nbsp; ms
                    </Form.Item>
                    <Form.Item label="协议类型:">
                        <Select
                            value={apdu_type}
                            disabled={disabled}
                            onChange={(val)=>{
                                this.setSetting('apdu_type', val)
                            }}
                        >
                            <Option value="RTU">RTU</Option>
                            <Option value="TCP">TCP</Option>
                            <Option value="ASCII">ASCII</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="通讯类型:">
                        <Select
                            disabled={disabled}
                            value={channel_type}
                            onChange={(val)=>{
                                this.setSetting('channel_type', val)
                            }}
                        >
                            <Option
                                value="serial"
                                disabled={this.state.communication}
                            >串口</Option>
                            <Option value="TCP">以太网</Option>
                        </Select>
                    </Form.Item>
                </Form>
                {
                    channel_type === 'serial'
                        ? <div>
                        <Form layout="inline">
                            <Divider  orientation="left">串口设定</Divider>
                            <Form.Item label="端口：">
                                <Select
                                    disabled={disabled}
                                    defaultValue={conf.serial_opt ? (conf.serial_opt.port === '/dev/ttyS1' ? 'COM1' : 'COM2' ) : serial_opt.port}
                                    onChange={(value)=>{
                                        this.setSetting('serial_opt', value, 'port')
                                    }}
                                >
                                    {
                                        this.checkOption()
                                    }

                                </Select>
                            </Form.Item>
                            <Form.Item label="波特率:">
                                <Select
                                    disabled={disabled}
                                    value={serial_opt.baudrate}
                                    onChange={(value)=>{
                                        this.setSetting('serial_opt', value, 'baudrate')
                                    }}
                                >
                                    <Option value="1200">1200</Option>
                                    <Option value="2400">2400</Option>
                                    <Option value="4800">4800</Option>
                                    <Option value="9600">9600</Option>
                                    <Option value="19200">19200</Option>
                                    <Option value="38400">38400</Option>
                                    <Option value="56000">56000</Option>
                                    <Option value="57600">57600</Option>
                                    <Option value="115200">115200</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item label="停止位：">
                                <Select
                                    disabled={disabled}
                                    value={serial_opt.stop_bits}
                                    onChange={(value)=>{
                                        this.setSetting('serial_opt', value, 'stop_bits')
                                    }}
                                >
                                    <Option value="1">1</Option>
                                    <Option value="2">2</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                            <Form layout="inline">
                            <Form.Item label="数据位：">
                                <Select
                                    disabled={disabled}
                                    value={serial_opt.data_bits}
                                    onChange={(value)=>{
                                        this.setSetting('serial_opt', value, 'data_bits')
                                    }}
                                >
                                    <Option value="8">8</Option>
                                    <Option value="7">7</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item label="校验:">
                                <Select
                                    disabled={disabled}
                                    value={serial_opt.parity}
                                    onChange={(value)=>{
                                        this.setSetting('serial_opt', value, 'parity')
                                    }}
                                >
                                    <Option value="NONE">NONE</Option>
                                    <Option value="EVEN">EVEN</Option>
                                    <Option value="ODD">ODD</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                        </div>
                        : <div>
                            <Divider  orientation="left">以太网</Divider>
                            <Form layout="inline">
                            <Form.Item label="IP地址:">
                                <Input
                                    disabled={disabled}
                                    value={socket_opt.host}
                                    onChange={(e)=>{
                                        this.setSetting('socket_opt', e.target.value, 'host')
                                    }}
                                    onBlur={(this.isValid)}
                                />
                                {
                                    this.state.checkIp
                                        ? <span style={{position: 'absolute', left: '20px', top: '15px', fontSize: '12px', color: 'red'}}>请输入有效ip地址</span>
                                        : null
                                }
                            </Form.Item>
                            <Form.Item label="端口:">
                                <InputNumber
                                    disabled={disabled}
                                    min={1}
                                    max={65535}
                                    value={socket_opt.port}
                                    onChange={(val)=>{
                                        this.setSetting('socket_opt', val, 'port')
                                    }}
                                />
                            </Form.Item>
                            <Form.Item label="Nodelay:">
                                <Checkbox
                                    disabled={disabled}
                                    checked={socket_opt.nodelay}
                                    onChange={(val)=>{
                                        this.setSetting('socket_opt', val.target.checked, 'nodelay')
                                    }}
                                />

                            </Form.Item>
                        </Form>
                        </div>
                }
                <Divider orientation="left">设备模板选择</Divider>
                <Table
                    columns={this.state.tplsCloumns}
                    dataSource={this.state.templateList && this.state.templateList.length > 0 ? this.state.templateList : []}
                    pagination={false}
                />
                <Button
                    onClick={this.templateShow}
                    style={{margin: '10px 0'}}
                    disabled={disabled}
                >
                    选择模板
                </Button>
                <Modal
                    className="templateList"
                    title={<h3>选择模板</h3>}
                    maskClosable={false}
                    visible={this.state.showTemplateSelection}
                    onOk={this.handleCancelAddTempList}
                    onCancel={this.handleCancelAddTempList}
                    wrapClassName={'templatesModal'}
                    okText="确定"
                    cancelText="取消"
                >
                    <div
                        style={{
                            display: 'flex',
                            position: 'absolute',
                            left: '110px',
                            top: 10,
                            zIndex: 999,
                            lineHeight: '30px'
                        }}
                    >
                        <span style={{padding: '0 20px'}}> </span>
                        <Input.Search
                            placeholder="网关名称、描述、模板ID"
                            onChange={(e)=>{
                                this.search(e.target.value.toLocaleLowerCase())
                            }}
                            style={{ width: 200 }}
                        />
                        <span style={{padding: '0 2px'}}> </span>
                        {/* <Button
                            type="primary"
                            onClick={this.onCreateNewTemplate}
                        >
                            创建新模板
                        </Button> */}
                        <Button
                            style={{
                                marginLeft: '538px'
                            }}
                            type="primary"
                            onClick={()=>{
                                // this.props.refreshTemplateList()
                                this.refreshTemplateList()
                            }}
                        >
                            刷新
                        </Button>
                    </div>
                    <Table
                        style={{wordBreak: 'break-all'}}
                        rowKey="name"
                        dataSource={this.state.appTemplateList}
                        columns={this.state.addTempLists}
                        pagination={false}
                        scroll={{ y: 240 }}
                        loading={loading}
                    />
                </Modal>
                <Divider orientation="left">设备列表</Divider>
                    <EditableTable
                        key="1"
                        disable={disabled}
                        getdevs={this.getDevs}
                        parentTitle={this.props.titles}
                        templateList={this.state.templateList}
                        devs={this.props.pane.conf.devs}
                    />
                <div style={{display: 'none'}}>
                    使用网关sn作为设备sn的前缀:
                    <Checkbox
                        disabled={disabled}
                        checked={dev_sn_prefix}
                        defaultChecked
                        onChange={(e)=>{
                            this.setSetting('dev_sn_prefix', e.target.checked)
                        }}
                    />
                </div>
                <div style={{display: 'flex', marginTop: '20px'}}>
                        <Button
                            style={{marginLeft: '10pxs', marginRight: '20px'}}
                            type="primary"
                            onClick={this.toggleDisable}
                            disabled={this.state.checkIp}
                        >
                            {
                                this.props.pane.status === 'Not installed'
                                ? '安装'
                                : !this.state.disabled ? '保存' : '编辑'
                            }
                        </Button>
                    {/*<Popconfirm*/}
                    {/* title={this.props.pane.status === 'Not installed' ? '确定要取消安装Modbus通道吗？' : '确定要删除应用Modbus吗?'}
*/}
                    {/*    onConfirm={this.removeModbus}*/}
                    {/*    onCancel={cancel}*/}
                    {/*    okText="删除"*/}
                    {/*    cancelText="取消"*/}
                    {/*>*/}
                    <Button
                        style={{marginLeft: '10pxs'}}
                        type="danger"
                        disabled={this.state.checkIp}
                        onClick={this.showConfirm}
                    >
                        {
                            this.props.pane.status === 'Not installed'
                                ? '取消添加'
                                : '删除'
                        }
                    </Button>
                    {/*</Popconfirm>*/}
                        {
                            !disabled && this.props.pane.status !== 'Not installed'
                            ? <Button
                                style={{
                                    marginLeft: '20px'
                                }}
                                onClick={()=>{
                                    this.setState({disabled: true})
                                }}
                                disabled={this.state.checkIp}
                              >
                                    取消编辑
                                </Button>
                            : ''
                        }
                        </div>
                        <Modal
                            title={!this.state.isShow ? this.state.action === 'install' ? '新增通道进度' : '卸载通道进度' : '查看日志'}
                            visible={this.state.pressVisible}
                            footer={null}
                            closable={false}
                        >
                            {<div>
                                {
                                    this.state.ShowResult
                                        ? this.state.result && this.state.number === 100
                                        ? <div>
                                            <Result
                                                status="success"
                                                title={this.state.action === 'install' ? '新增Modbus通道成功' : '卸载Modbus通道成功'}
                                                subTitle=""
                                                extra={[
                                                this.state.action === 'install'
                                                ? <Button
                                                    type="primary"
                                                    key="console"
                                                    onClick={()=>{
                                                        this.setState({isShow: !this.state.isShow})
                                                    }}
                                                  >
                                                {
                                                    isShow
                                                    ? '关闭日志'
                                                    : '查看日志'
                                                }
                                                </Button>
                                                : '',
                                                <Button
                                                    key="buy"
                                                    onClick={()=>{
                                                        this.setState({pressVisible: false, number: 0})
                                                    }}
                                                >关闭窗口</Button>
                                                ]}
                                            />
                                            {
                                                isShow
                                                ? <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                                                    <ReactList
                                                        pageSize={1}
                                                        ref="content"
                                                        axis="y"
                                                        type="simple"
                                                        length={mqtt.log_channel.Data.length}
                                                        itemRenderer={(key)=>{
                                                            if (mqtt.log_channel.Data[key].content.indexOf('modbus_') !== -1) {
                                                                return (<div key={key}>
                                                                    <div className="tableHeaders">
                                                                        <div>{mqtt.log_channel.Data[key].time.substring(10, 19)}</div>
                                                                        {/* <div>{mqtt.log_channel.Data[key].level}</div> */}
                                                                        {/* <div>{mqtt.log_channel.Data[key].id}</div> */}
                                                                        {/* <div>{mqtt.log_channel.Data[key].inst}</div> */}
                                                                        <div>{mqtt.log_channel.Data[key].content}</div>
                                                                    </div>
                                                                </div>)
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                : ''
                                            }
                                        </div>
                                        : <div>
                                        <Result
                                            status="warning"
                                            title="新增Modbus通道失败！"
                                            extra={
                                            <Button
                                                type="primary"
                                                key="console"
                                                onClick={()=>{
                                                    this.setState({isShow: !this.state.isShow})
                                                }}
                                            >
                                                {
                                                    isShow
                                                    ? '关闭日志'
                                                    : '查看日志'
                                                }
                                            </Button>,
                                            <Button
                                                key="buy"
                                                onClick={()=>{
                                                    this.setState({pressVisible: false})
                                                }}
                                            >关闭窗口</Button>
                                            }
                                        />
                                        {
                                            isShow
                                            ? <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                                                <ReactList
                                                    pageSize={1}
                                                    ref="content"
                                                    axis="y"
                                                    type="simple"
                                                    length={mqtt.log_channel.Data.length}
                                                    itemRenderer={(key)=>{
                                                        if (mqtt.log_channel.Data[key].content.indexOf('modbus_') !== -1) {
                                                            return (<div key={key}>
                                                                <div className="tableHeaders">
                                                                    <div>{mqtt.log_channel.Data[key].time.substring(10, 19)}</div>
                                                                    {/* <div>{mqtt.log_channel.Data[key].level}</div> */}
                                                                    {/* <div>{mqtt.log_channel.Data[key].id}</div> */}
                                                                    {/* <div>{mqtt.log_channel.Data[key].inst}</div> */}
                                                                    <div>{mqtt.log_channel.Data[key].content}</div>
                                                                </div>
                                                            </div>)
                                                        }
                                                    }}
                                                />
                                            </div>
                                            : ''
                                        }
                                    </div>
                                    : this.state.number === 99
                                        ? <div>
                                        <Result
                                            status="warning"
                                            title="新增Modbus通道失败！"
                                            extra={
                                            <Button
                                                type="primary"
                                                key="console"
                                                onClick={()=>{
                                                    this.setState({isShow: !this.state.isShow})
                                                }}
                                            >
                                                {
                                                    isShow
                                                    ? '关闭日志'
                                                    : '查看日志'
                                                }
                                            </Button>,
                                            <Button
                                                key="buy"
                                                onClick={()=>{
                                                    this.setState({pressVisible: false})
                                                }}
                                            >关闭窗口</Button>
                                            }
                                        />
                                        {
                                            isShow
                                            ? <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                                                <ReactList
                                                    pageSize={1}
                                                    ref="content"
                                                    axis="y"
                                                    type="simple"
                                                    length={mqtt.log_channel.Data.length}
                                                    itemRenderer={(key)=>{
                                                        if (mqtt.log_channel.Data[key].content.indexOf('modbus_') !== -1) {
                                                            return (<div key={key}>
                                                                <div className="tableHeaders">
                                                                    <div>{mqtt.log_channel.Data[key].time.substring(10, 19)}</div>
                                                                    {/* <div>{mqtt.log_channel.Data[key].level}</div> */}
                                                                    {/* <div>{mqtt.log_channel.Data[key].id}</div> */}
                                                                    {/* <div>{mqtt.log_channel.Data[key].inst}</div> */}
                                                                    <div>{mqtt.log_channel.Data[key].content}</div>
                                                                </div>
                                                            </div>)
                                                        }
                                                    }}
                                                />
                                            </div>
                                            : ''
                                        }
                                    </div>
                                        : <Progress
                                            style={{
                                                marginLeft: '50%',
                                                transform: 'translate(-50%, 0)'
                                            }}
                                            type="circle"
                                            strokeColor={{
                                                '0%': '#108ee9',
                                                '100%': '#87d068'
                                            }}
                                            percent={this.state.number}
                                          />
                                }
                            </div>
                            }
                </Modal>
            </div>
        );
    }
}

export default ModbusPane;