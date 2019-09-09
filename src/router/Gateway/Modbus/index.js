import React, { Component, Fragment } from 'react';
import {Tabs, Button, message, Modal, Form, Divider, InputNumber, Select, Checkbox, Table, Input} from 'antd';
import {withRouter} from 'react-router-dom'
import http from '../../../utils/Server';
import ModbusPane from './ModbusPane';
import {ConfigStore} from '../../../utils/ConfigUI'
import './style.scss'

const { TabPane } = Tabs;
const { Option } = Select;

@withRouter
class Modbus extends Component {
    constructor (props) {
        super(props);
        this.newTabIndex = 0;
        const panes = [
            // { title: 'Modbus配置1', content: 'Content of Tab Pane 1', key: '1' },
            // { title: 'Modbus配置2', content: 'Content of Tab Pane 2', key: '2' }
        ];
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
                                console.log(record)
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
        const temoplateColumns = [
            {
                title: '名称',
                dataIndex: 'name',
                key: 'name'
            }, {
                title: '描述',
                dataIndex: 'desc',
                key: 'desc'
            }, {
                title: '模板ID',
                dataIndex: 'id',
                key: 'id'
            }, {
                title: '版本',
                dataIndex: 'ver',
                key: 'ver'
            }, {
                title: '操作',
                dataIndex: 'action',
                key: 'action',
                render: (conf, record)=>{
                    console.log(conf, record)
                    return (
                        <div>
                            <Button>编辑</Button>
                            <Button
                                onClick={()=>{
                                    const list = this.state.templateList.filter(item=> record.key !== item.key);
                                    this.setState({
                                        templateList: list
                                    })
                                }}
                            >删除</Button>
                        </div>
                    )
                }
            }
        ]
        this.state = {
            activeKey: '0',
            panes,
            data: undefined,
            visible: false,
            modalKey: 0,
            app_info: {},
            configStore: new ConfigStore(),
            loop_gap: 1000,
            apdu_type: 'TCP',
            channel_type: 'socket',
            temoplateColumns,
            templateList: [],
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
            addTempLists,
            templateStore: []
        };
    }
    componentDidMount () {
        this.fetch()
        this.refreshTemplateList()
    }
     MatchTheButton = (key)=> {
        let name = '';
        switch (key) {
            case 0:
                name = '下一步'
                break;
            case 1:
                name = '下一步'
                break;
            case 2:
                name = '安装'
                break;
            default:
                break;
        }
        return name;
    }
     //添加模板
     onAddTemplate = (config)=>{
         console.log(this.state.templateList)
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
         }, ()=>{
             console.log(this.state.templateList)
         })
        // this.state.configStore.addTemplate(name, conf_name, desc, version)
        // let val = config.Value
        // let max_key = 0
        // val.map(item => max_key < item.key ? max_key = item.key : max_key)
        // val.push({
        //     key: max_key + 1,
        //     id: name,
        //     name: conf_name,
        //     description: desc,
        //     ver: version
        // })
        // config.setValue(val)
        // this.props.onChange()
    };
    // 删除模板
    onDeleteTemplate =  (name)=>{
        let dataSource = this.state.showTempList;
        dataSource.splice(name, 1);//index为获取的索引，后面的 1 是删除几行
        this.setState({
            showTempList: dataSource
        });
        let a = [];
        dataSource && dataSource.length > 0 && dataSource.map((item)=>{
            a.push(item.conf_name)
        });
        let addTempList = this.state.addTempList;
        this.setState({
            addTempList: addTempList
        })
    };
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
            }, ()=>{
                console.log(this.state.appTemplateList)
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
    templateShow = ()=>{
        this.setState({
            showTemplateSelection: true
        })
    }
    handleCancelAddTempList = ()=>{
        this.setState({
            showTemplateSelection: false
        })
    };
    showModbus () {
       if (this.state.modalKey === 0) {
           return (
              <Fragment>
               <div className="ModbusModal">
                   <Form layout="inline">
                       <Divider  orientation="left">应用配置信息</Divider>
                       <Form.Item label="采集间隔:">
                           <InputNumber
                               min={1}
                               max={10000}
                               defaultValue={this.state.loop_gap}
                               onChange={(val)=>{
                                   this.setSetting('loop_gap', val)
                               }}
                           />
                       </Form.Item>
                       <Form.Item label="协议类型:">
                           <Select
                               defaultValue={this.state.apdu_type}
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
                               defaultValue={this.state.channel_type}
                               onChange={(val)=>{
                                   this.setSetting('channel_type', val)
                               }}
                           >
                               <Option value="socket">串口</Option>
                               <Option value="TCP">TCP协议</Option>
                           </Select>
                       </Form.Item>
                   </Form>
                   {
                       this.state.channel_type === 'socket'
                           ? <Form layout="inline">
                               <Divider  orientation="left">串口设定</Divider>
                               <Form.Item label="端口：">
                                   <Select
                                       defaultValue={this.state.serial_opt.port}
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
                                       defaultValue={this.state.serial_opt.baudrate}
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
                                       defaultValue={this.state.serial_opt.stop_bits}
                                       onChange={(value)=>{
                                           this.setSetting('serial_opt', value, 'stop_bits')
                                       }}
                                   >
                                       <Option value="1">1</Option>
                                       <Option value="2">2</Option>
                                   </Select>
                               </Form.Item>
                               <Form.Item label="数据位：">
                                   <Select
                                       defaultValue={this.state.serial_opt.data_bits}
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
                                       defaultValue={this.state.serial_opt.flow_control}
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
                                       defaultValue={this.state.serial_opt.parity}
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
                           : <div>
                           <Form layout="inline">
                               <Form.Item label="IP地址:">
                                   <Input
                                       defaultValue={this.state.serial_opt.host}
                                       onChange={(value)=>{
                                           this.setSetting('serial_opt', value, 'flow_control')
                                       }}
                                   />

                               </Form.Item>
                               <Form.Item label="端口:">
                                   <Select
                                       defaultValue={this.state.serial_opt.flow_control}
                                       onChange={(value)=>{
                                           this.setSetting('serial_opt', value, 'flow_control')
                                       }}
                                   >
                                       <Option value="OFF">OFF</Option>
                                       <Option value="ON">ON</Option>
                                   </Select>
                               </Form.Item>
                               <Form.Item label="Nodelay:">
                                   <Checkbox
                                       defaultChecked
                                   />
                               </Form.Item>
                           </Form>
                           </div>
                   }
               </div>
              </Fragment>

       )
       }
       if (this.state.modalKey === 1) {
           return (
               <Fragment>
                   <Divider orientation="left">设备模板选择</Divider>
                    <Table
                        columns={this.state.temoplateColumns}
                        dataSource={this.state.templateList}
                        pagination={false}
                    />
                    <Button
                        onClick={this.templateShow}
                        style={{margin: '10px 0'}}
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
                                    this.props.refreshTemplateList()
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
               </Fragment>
           )
       }
       if (this.state.modalKey === 2) {
           return (
                <Fragment>
                    <Divider orientation="left">设备列表</Divider>
                    <p>|设备列表</p>
                    <Button
                        type="primary"
                        onClick={()=>{
                            console.log('222222')
                        }}
                    >添加</Button>
                    <Table
                        pagination={false}
                    />
                </Fragment>
           )
       }
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
            visible: false,
            modalKey: 0
        });
    };
    onChange = activeKey => {
        this.setState({ activeKey });
    };
    onEdit = (targetKey, action) => {
        console.log(targetKey, action)
        this[action](targetKey);
    };
    add = () => {
        const { data } = this.state;
        const activeKey = `newTab${this.newTabIndex++}`;
        const inst_name = 'Modbus配置' + (this.state.data.length + 1);
        data.push({ inst_name, content: 'New Tab Pane' + activeKey, key: activeKey });
        this.setState({ data, activeKey });
    };
    remove = targetKey => {
        let { activeKey } = this.state;
        let lastIndex;
        this.state.panes.forEach((pane, i) => {
            if (pane.key === targetKey) {
                lastIndex = i - 1;
            }
        });
        const panes = this.state.panes.filter(pane => pane.key !== targetKey);
        if (panes.length && activeKey === targetKey) {
            if (lastIndex >= 0) {
                activeKey = panes[lastIndex].key;
            } else {
                activeKey = panes[0].key;
            }
        }
        this.setState({ panes, activeKey });
    };
    fetch = () => {
        // const {gatewayInfo} = this.props.store
        // let enable_beta = gatewayInfo.data.enable_beta
        // if (enable_beta === undefined) {
        //     enable_beta = 0
        // }
        console.log('22')
        http.get('/api/applications_read?app=APP00000025').then(res=>{
            console.log(res)
            if (res.ok) {
                this.setState({app_info: res.data})
            }
        })
        http.get('/api/gateways_app_list?gateway=' + this.props.match.params.sn + '&beta=0').then(res=>{
            if (res.ok){
                const app_list = [];
                if (res.data && res.data.length > 0) {
                    res.data.map(item=>{
                        if (item.inst_name.toLowerCase().indexOf('modbus') !== -1) {
                            app_list.push(item)
                        }
                    })
                    // this.props.store.gatewayInfo.setApps(app_list)
                }
                this.setData(app_list)
            } else {
                message.error(res.error)
            }
        })
    }
    setData = (apps)=> {
        this.setState({
            panes: apps
        })
    };
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
    render () {
        console.log(this.state.data)
        return (
            <div>
                <div style={{ marginBottom: 16 }}>
                    <Button onClick={this.showModal}>ADD</Button>
                </div>
                <Modal
                    title="ADD"
                    visible={this.state.visible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    destroyOnClose="true"
                    width="800px"
                    footer={[
                        <Button
                            key="0"
                            onClick={this.handleCancel}
                        >
                            取消
                        </Button>,
                        <Button
                            key="1"
                            disabled={this.state.modalKey === 0}
                            onClick={()=>{
                                if (this.state.modalKey > 0) {
                                    this.setState({modalKey: this.state.modalKey - 1})
                                }
                            }}
                        >
                            上一步
                        </Button>,
                        <Button
                            key="2"
                            onClick={()=>{
                                if (this.state.modalKey < 2) {
                                    this.setState({modalKey: this.state.modalKey + 1})
                                }
                            }}
                        >
                            {
                                this.MatchTheButton(this.state.modalKey)
                            }
                        </Button>
                    ]}
                >
                    {this.showModbus()}
                </Modal>
                <Tabs
                    hideAdd
                    onChange={this.onChange}
                    activeKey={this.state.activeKey}
                    type="editable-card"
                    onEdit={this.onEdit}
                    // tabBarExtraContent={operations}
                >
                    {this.state.panes.map((pane, key) => (
                        <TabPane
                            tab={pane.inst_name}
                            key={key}
                        >
                            <ModbusPane
                                key={key}
                                pane={pane}
                            />
                        </TabPane>
                    ))}
                </Tabs>
            </div>
        );
    }
}

export default Modbus;