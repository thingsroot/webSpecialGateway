import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import { inject, observer} from 'mobx-react';
import {Select, Table, Button, InputNumber, Checkbox, Form, Divider, Input, message, Popconfirm, Modal} from 'antd';
// import Slide from 'react-slick'
import http from '../../../../utils/Server';
import EditableTable from  '../EditableTable'
import './style.scss';
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
                        {/* <Button>
                            <Link to={`/template/${record.app}/${record.name}/${record.latest_version}`}> 查看 </Link>
                        </Button> */}
                            {/* <span style={{padding: '0 2px'}}> </span>
                        <Button>
                            <Link to={`/template/${record.app}/${record.name}/${record.latest_version}/clone`}> 克隆 </Link>
                        </Button> */}
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
                        > 查看 </Button>
                    </span>)
                )
            }
        ]
        this. state = {
            // conf: {
            tpls: [],
            devs: [],
            loop_gap: 1000,
            apdu_type: 'TCP',
            channel_type: 'serial',
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
                                            <Button type="danger">delete</Button>
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
            addTempLists
        }
    }

    componentDidMount () {
        console.log(this.props.pane)
        const { conf } = this.props.pane;
        this.setState({
            apdu_type: conf.apdu_type,
            channel_type: conf.channel_type,
            dev_sn_prefix: conf.dev_sn_prefix,
            loop_gap: conf.loop_gap,
            tpls: conf.tpls,
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
    }
    // UNSAFE_componentWillReceiveProps (nextProps) {
    //     console.log(this.refs.Carousel)
    //     if (nextProps.modalKey !== this.props.modalKey) {
    //         console.log(nextProps, this)
    //         this.refs.Carousel.goTo(nextProps.modalKey)
    //     }

    // }
    setSetting = (type, val, name) =>{
        console.log(type, val, name)
        if (type === 'serial_opt') {
            this.setState({
                serial_opt: Object.assign({}, this.state.serial_opt, {[name]: val})
            }, ()=>{
                console.log(this.state.serial_opt)
            })
        }
        if (!name){
            this.setState({
                [type]: val
            }, ()=>{
                console.log(this.state[type])
            })
        }

    };
    AppConf = () => {
        const data = {
            conf: {
                apdu_type: this.state.apdu_type,
                channel_type: this.state.channel_type,
                dev_sn_prefix: this.state.dev_sn_prefix,
                devs: this.state.devs,
                loop_gap: this.state.loop_gap,
                serial_opt: this.state.channel_type === 'serial' ? this.state.serial_opt : undefined,
                socket_opt: this.state.channel_type === 'socket' ? this.state.socket_opt : undefined,
                tpls: this.state.tpls
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
        window.open('/appdetails/' + this.props.app_info.name + '/new_template', '_blank')
    }
    search = () => {

    };
    //查看模板
    onViewTemplate = (conf, version) => {
        if (version !== undefined && version !== 0) {
            window.open(`/template/${this.state.app_info.data.name}/${conf}/${version}`, '_blank')
        } else {
            window.open(`/template/${this.state.app_info.data.name}/${conf}`)
        }
    };
    //克隆模板
    onCloneTemplate = (conf, version)=> {
        window.open(`/template/${this.state.app_info.data.name}/${conf}/${version}/clone`, '_blank')
    };
    //添加模板
    onAddTemplate = (config)=>{
        const list = this.state.templateList;
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
    render (){
        console.log(this.props)
        const  { loop_gap, apdu_type, channel_type, serial_opt, disabled, socket_opt, tpls, devs, dev_sn_prefix} = this.state;
        devs, tpls;
        // const Mt10 = {
        //     marginTop: '10px'
        // }
        return (
            <div className="ModbusPane">
                {/* <Carousel
                    style={{width: 500}}
                    ref="Carousel"
                    afterChange={onChange}
                    initialSlide={this.props.modalKey}
                > */}
                <Form layout="inline">
                    <Button
                        style={{ marginLeft: '10px'}}
                        type="primary"
                        onClick={this.toggleDisable}
                    >
                        {!this.state.disabled ? '保存' : '编辑'}
                    </Button>
                    &nbsp;&nbsp;
                    {
                        !disabled
                        ? <Button
                            onClick={()=>{
                                this.setState({
                                    disabled: true
                                })
                            }}
                          >
                            取消编辑
                        </Button>
                        : ''
                    }
                    &nbsp;&nbsp;
                    <Popconfirm
                        title="确定要删除应用Modbus吗?"
                        onConfirm={this.removeModbus}
                        onCancel={cancel}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button
                            type="danger"
                        >删除</Button>
                    </Popconfirm>
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
                            <Option value="TCP">TCP协议</Option>
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
                                    defaultValue={serial_opt.port}
                                    onChange={(value)=>{
                                        this.setSetting('serial_opt', value, 'port')
                                    }}
                                >
                                    <Option value="/dev/ttyS1">/dev/ttyS1</Option>
                                    <Option value="/dev/ttyS2">/dev/ttyS2</Option>
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
                            <Form.Item label="流控:">
                                <Select
                                    disabled={disabled}
                                    defaultValue={serial_opt.flow_control}
                                    onChange={(value)=>{
                                        this.setSetting('serial_opt', value, 'flow_control')
                                    }}
                                >
                                    <Option value="OFF">OFF</Option>
                                    <Option value="ON">ON</Option>
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
                        <Form layout="inline">
                            <Form.Item label="IP地址:">
                                <Input
                                    disabled={disabled}
                                    defaultValue={socket_opt.host}
                                    onChange={(value)=>{
                                        this.setSetting('socket_opt', value, 'host')
                                    }}
                                />
                            </Form.Item>
                            <Form.Item label="端口:">
                                <Input
                                    disabled={disabled}
                                    defaultValue={socket_opt.port}
                                    onChange={(value)=>{
                                        this.setSetting('socket_opt', value, 'port')
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
                    dataSource={this.state.templateList}
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
                        rowKey="key"
                        dataSource={this.state.appTemplateList}
                        columns={this.state.addTempLists}
                        pagination={false}
                        scroll={{ y: 240 }}
                    />
                </Modal>
                <Divider orientation="left">设备列表</Divider>
                <p>|设备列表</p>
                <EditableTable disable={disabled}/>
                <div>
                    使用网关sn作为设备sn的前缀:
                    <Checkbox
                        disabled={disabled}
                        checked={dev_sn_prefix}
                        onChange={(e)=>{
                            this.setSetting('dev_sn_prefix', e.target.checked)
                        }}
                    />
                </div>
                {/* </Carousel> */}
            </div>
        );
    }
}

export default ModbusPane;