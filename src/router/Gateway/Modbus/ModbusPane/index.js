import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import { inject, observer} from 'mobx-react';
import {Select, Table, Button, InputNumber, Checkbox, Form, Divider, Input, message, Popconfirm, Modal, Progress, Result} from 'antd';
// import Slide from 'react-slick'
import http from '../../../../utils/Server';
import EditableTable from  '../EditableTable'
import './style.scss';
import GatewayMQTT from '../../../../utils/GatewayMQTT';
import ReactList from 'react-list';
import { isArray } from 'util';
const { Option } = Select;
function cancel () {
    message.info('取消删除应用');
  }
@withRouter
@inject('store')
@observer
class ModbusPane extends Component {
    constructor (props) {
        super(props)
        const addTempLists = [
            {
                title: '名称',
                width: '20%',
                dataIndex: 'conf_name',
                key: 'conf_name',
                render: text => <span>{text}</span>
            }, {
                title: '描述',
                width: '30%',
                dataIndex: 'description',
                key: 'description'
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
            channel_type: 'serial',
            serial_opt: {
                port: '',
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
                    dataIndex: 'description',
                    key: 'description'
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
                                            title="Sure to delete ?"
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
                                            >delete</Button>
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
            totalPanes: [],
            checkIp: false
        }

    }
    UNSAFE_componentWillMount () {
        this.props.panes.length ? this.props.panes.map((pane, key)=> {
            key;
            this.transformOption(pane.conf)
        }) : null
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
    }
    componentWillUnmount () {
        this.t1 && clearInterval(this.t1)
    }
    setSetting = (type, val, name) =>{
        if (type === 'serial_opt') {
            this.setState({
                serial_opt: Object.assign({}, this.state.serial_opt, {[name]: val})
            })
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
        const data = {
            app: 'APP00000025',
            conf: {
                apdu_type: this.state.apdu_type,
                channel_type: this.state.channel_type,
                dev_sn_prefix: true,
                devs: this.state.devs,
                loop_gap: this.state.loop_gap,
                serial_opt: this.state.channel_type === 'serial' ? this.state.serial_opt : undefined,
                socket_opt: this.state.channel_type === 'socket' ? this.state.socket_opt : undefined,
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
                    this.props.fetch()
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
    AppConf = () => {
        if (this.props.pane.status === 'Not installed') {
            this.startChannel()
            this.setState({
                pressVisible: true
            }, ()=>{
                this.addaccout()
            })
            setTimeout(() => {
                this.installapp()
            }, 3000);
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
                socket_opt: this.state.channel_type === 'socket' ? this.state.socket_opt : undefined,
                tpls: this.state.templateList
            },
            gateway: this.props.match.params.sn,
            id: `/gateways/${this.props.match.params.sn}/config/${this.props.pane.inst_name}/${new Date() * 1}`,
            inst: this.props.pane.inst_name
        }
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
    }
    toggleDisable = () => {
        this.setState({disabled: !this.state.disabled}, ()=>{
            if (this.state.disabled) {
                   this.AppConf()
            }
        })
    };
    removeModbus = () =>{
        if (this.props.pane.status === 'Not installed') {
            this.props.removenotinstall(this.props.pane.inst_name)
            return false
        }
        const data = {
            gateway: this.props.match.params.sn,
            inst: this.props.pane.inst_name,
            id: `app_remove/${this.props.match.params.sn}/${this.props.pane.inst_name}/${new Date() * 1}`
        }
        http.post('/api/gateways_applications_remove', data).then(res=>{
            if (res.ok) {
                let title = '卸载应用' + data.inst + '请求成功!'
                message.info(title + '等待网关响应!')
                this.props.store.action.pushAction(res.data, title, '', data, 10000,  ()=> {
                    this.props.fetch()
                    this.props.setActiveKey('0')
                })
            }
        })
    };
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
      this.setState({appTemplateList: []})
        http.get('/api/store_configurations_list?conf_type=Template&app=APP00000025').then(res=> {
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
    };
    onCreateNewTemplate = () => {
        window.open('/appdetails/APP00000025/new_template', '_blank')
    }
    search = () => {

    };
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
        if (list.find(item => item.id === config.id) !== undefined) {
            message.info('已存在相同模板，请勿重复添加！')
            return false;
        }
        const obj = {
            id: config.id,
            desc: config.description,
            name: config.name,
            ver: config.ver,
            key: list.length + 1
        }
        list.push(obj)
        this.setState({
            templateList: list
        })
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
    transformOption = (conf) => {
        if (conf) {
            if (conf.serial_opt) {
                if (conf.serial_opt.port === '/dev/ttyS1' && conf.serial_opt.port !== '/dev/ttyS2') {
                    return [
                        <Option
                            value="/dev/ttyS1"
                            key="/dev/ttyS1"
                            disabled
                        >COM1</Option>,
                        <Option
                            value="/dev/ttyS2"
                            key="/dev/ttyS2"
                        >COM2</Option>
                    ]

                } else if (conf.serial_opt.port === '/dev/ttyS2' && conf.serial_opt.port !== '/dev/ttyS1') {
                    return [
                        <Option
                            value="/dev/ttyS2"
                            key="/dev/ttyS2"
                            disabled
                        >COM2</Option>,
                        <Option
                            value="/dev/ttyS1"
                            key="/dev/ttyS1"
                        >COM1</Option>
                    ]
                } else {
                    return [
                        <Option
                            value=""
                            key="disabled"
                        >disabled</Option>
                    ]
                }
            } else {
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
            }
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
    }

    render (){
        const conf = this.props.pane.conf

        const  { loop_gap, apdu_type, channel_type, serial_opt, disabled, socket_opt, tpls, devs, dev_sn_prefix, mqtt, isShow} = this.state;
        devs, tpls;
        // const Mt10 = {
        //     marginTop: '10px'
        // }
        return (
            <div className="ModbusPane">
                <div className="ModbusPaneAffix">
                        <Button
                            style={{marginLeft: '10pxs', marginRight: '20px'}}
                            type="primary"
                            onClick={this.toggleDisable}
                        >
                            {!this.state.disabled ? '保存' : '编辑'}
                        </Button>
                        <Popconfirm
                            title="确定要删除应用Modbus吗?"
                            onConfirm={this.removeModbus}
                            onCancel={cancel}
                            okText="删除"
                            cancelText="取消"
                        >
                            <Button
                                style={{marginLeft: '10pxs'}}
                                type="danger"
                            >
                                删除
                            </Button>
                        </Popconfirm>
                        {
                            !disabled
                            ? <Button
                                style={{
                                    marginLeft: '20px'
                                }}
                                onClick={()=>{
                                    this.setState({disabled: true})
                                }}
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
                            defaultValue={loop_gap}
                            onChange={(val)=>{
                                this.setSetting('loop_gap', val)
                            }}
                        />
                        &nbsp; ms
                    </Form.Item>
                    <Form.Item label="协议类型:">
                        <Select
                            defaultValue={apdu_type}
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
                            defaultValue={channel_type}
                            onChange={(val)=>{
                                this.setSetting('channel_type', val)
                            }}
                        >
                            <Option value="serial">串口</Option>
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
                                    defaultValue={conf.serial_opt ? (conf.serial_opt.port === '/dev/ttyS1' ? 'COM1' : 'COM2' ) : ''}
                                    onChange={(value)=>{
                                        this.setSetting('serial_opt', value, 'port')
                                    }}
                                >
                                    {
                                        this.transformOption()
                                    }
                                </Select>
                            </Form.Item>
                            <Form.Item label="波特率:">
                                <Select
                                    disabled={disabled}
                                    defaultValue={serial_opt.baudrate}
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
                                    defaultValue={serial_opt.stop_bits}
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
                                    defaultValue={serial_opt.data_bits}
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
                                    defaultValue={serial_opt.parity}
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
                                    defaultValue={socket_opt.host}
                                    onChange={(value)=>{
                                        this.setSetting('socket_opt', value, 'host')
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
                                    defaultValue={socket_opt.port}
                                    onChange={(val)=>{
                                        this.setSetting('loop_gap', val)
                                    }}
                                />
                            </Form.Item>
                            <Form.Item label="Nodelay:">
                                <Checkbox
                                    disabled={disabled}
                                    defaultChecked
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
                    title="选择模板"
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
                            right: 300,
                            top: 10,
                            zIndex: 999,
                            lineHeight: '30px'
                        }}
                    >
                        <Button
                            onClick={()=>{
                                // this.props.refreshTemplateList()
                                this.refreshTemplateList()
                            }}
                        >
                            刷新
                        </Button>
                        <span style={{padding: '0 20px'}}> </span>
                        <Input.Search
                            placeholder="网关名称、描述、序列号"
                            onChange={this.search}
                            style={{ width: 200 }}
                        />
                        <span style={{padding: '0 2px'}}> </span>
                        <Button
                            type="primary"
                            onClick={this.onCreateNewTemplate}
                        >
                            创建新模板
                        </Button>
                    </div>
                    <Table
                        rowKey="name"
                        dataSource={this.state.appTemplateList}
                        columns={this.state.addTempLists}
                        pagination={false}
                        scroll={{ y: 240 }}
                    />
                </Modal>
                <Divider orientation="left">设备列表</Divider>
                    <EditableTable
                        key="1"
                        disable={disabled}
                        getdevs={this.getDevs}
                        templateList={this.state.templateList}
                        devs={this.props.pane.conf.devs}
                    />
                <div style={{display: 'none'}}>
                    使用网关sn作为设备sn的前缀:
                    <Checkbox
                        disabled={disabled}
                        checked={dev_sn_prefix}
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
                        >
                            {!this.state.disabled ? '保存' : '编辑'}
                        </Button>
                        <Popconfirm
                            title="确定要删除应用Modbus吗?"
                            onConfirm={this.removeModbus}
                            onCancel={cancel}
                            okText="删除"
                            cancelText="取消"
                        >
                            <Button
                                style={{marginLeft: '10pxs'}}
                                type="danger"
                            >
                                删除
                            </Button>
                        </Popconfirm>
                        {
                            !disabled
                            ? <Button
                                style={{
                                    marginLeft: '20px'
                                }}
                                onClick={()=>{
                                    this.setState({disabled: true})
                                }}
                              >
                                    取消编辑
                                </Button>
                            : ''
                        }
                        </div>
                        <Modal
                            title={!this.state.isShow ? '新增通道进度' : '查看日志'}
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
                                            title="新增Modbus通道成功！"
                                            subTitle=""
                                            extra={[
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