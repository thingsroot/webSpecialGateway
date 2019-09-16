import React, { Component, Fragment } from 'react';
import {Tabs, Button, message, Modal, Form, Divider, InputNumber, Select, Checkbox, Table, Input, Popconfirm, Empty} from 'antd';
import { inject, observer} from 'mobx-react';
import {withRouter} from 'react-router-dom';
import http from '../../../utils/Server';
import ModbusPane from './ModbusPane';
import {ConfigStore} from '../../../utils/ConfigUI'
import './style.scss'
import EditableTable from './EditableTable';

const { TabPane } = Tabs;
const { Option } = Select;

@withRouter
@inject('store')
@observer
class Modbus extends Component {
    constructor (props) {
        super(props);
        this.newTabIndex = 0;
        const panes = [];
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
        ]
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
            temoplateColumns,
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
            addTempLists,
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
    onCreateNewTemplate = () => {
        // window.open('/appdetails/' + this.props.app_info.name + '/new_template', '_blank')
        window.open('/appdetails/APP00000025/new_template', '_blank')

    }
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
    //查看模板
    onViewTemplate = (conf, version) => {
        if (version !== undefined && version !== 0) {
            window.open(`/template/${this.state.app_info.data.name}/${conf}/${version}`, '_blank')
        } else {
            window.open(`/template/${this.state.app_info.data.name}/${conf}`)
        }
    }
    //克隆模板
    onCloneTemplate = (conf, version)=> {
        window.open(`/template/${this.state.app_info.data.name}/${conf}/${version}/clone`, '_blank')
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
                               <Option value="serial">串口</Option>
                               <Option value="socket">TCP协议</Option>
                           </Select>
                       </Form.Item>
                   </Form>
                   {
                       this.state.channel_type === 'serial'
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
               </Fragment>
           )
       }
       if (this.state.modalKey === 2) {
           return (
               <Fragment>
                   <Divider orientation="left">设备列表</Divider>
                   <p>|设备列表</p>
                   {/*<Table  pagination={false}/>*/}
                    <EditableTable
                        getdevs={this.getDevs}
                        templateList={this.state.templateList}
                    />
               </Fragment>
           )
       }
    }
    getDevs = (devs) => {
        const arr = [];
        if (devs && devs.length > 0){
            devs.map(item=>{
                const obj = {
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
    }
    installapp = () => {
        let inst = undefined;
        const applist = this.state.panes;
        applist && applist.length > 0 && applist.map((item, key) =>{
            if (item.inst_name.indexOf(key + 1) === -1) {
                if (!inst){
                    inst = 'modbus_' + (key + 1)
                }
            }
        })
        const data = {
            app: 'APP00000025',
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
            id: 'app_install/' + this.props.match.params.sn + '/' + inst + '/APP00000259/' + new Date() * 1,
            inst: inst ? inst : 'modbus_' + (this.state.panes.length + 1),
            version: this.state.app_info.versionLatest
        }
        http.post('/api/gateways_applications_install', data).then(res=>{
            if (res.ok) {
                let title = '安装应用' + data.inst + '请求'
                message.info(title + '等待网关响应!')
                this.props.store.action.pushAction(res.data, title, '', data, 10000,  ()=> {
                    this.fetch()
                    this.setState({
                        modalKey: 0
                    })
                })
            } else {
                message.error(res.error)
            }
        })
    }
    showModal = () => {
        this.setState({
            visible: true
        });
    };

    handleOk = () => {
        this.setState({
            visible: false
        });
    };

    handleCancel = () => {
        this.setState({
            visible: false,
            modalKey: 0
        });
    };
    onChange = activeKey => {
        this.setState({ activeKey });
    };
    onEdit = (targetKey, action) => {
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
    };
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
    render () {
        return (
            <div>
                <div style={{ marginBottom: 16 }}>
                    <Button
                        onClick={this.showModal}
                        disabled={this.state.panes.length >= 8}
                    >安装Modbus应用</Button>
                </div>
                <Modal
                    title="安装Modbus应用"
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
                                if (this.state.modalKey === 2){
                                    this.setState({
                                        visible: false
                                    }, ()=>{
                                        this.installapp()
                                    })
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
                    {
                    !this.state.loading
                        ? this.state.panes && this.state.panes.length > 0
                                ? <Tabs
                                    hideAdd
                                    onChange={this.onChange}
                                    activeKey={this.state.activeKey}
                                    type="card"
                                    onEdit={this.onEdit}
                                    // tabBarExtraContent={operations}
                                  >
                            {
                                this.state.panes.map((pane, key) => (
                                    <TabPane
                                        tab={pane.inst_name}
                                        key={key}
                                    >
                                        <ModbusPane
                                            key={key}
                                            pane={pane}
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