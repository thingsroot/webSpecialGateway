import React, { Component, Fragment } from 'react';
import {Tabs, Button, message, Modal, Form, Divider, InputNumber, Select, Checkbox, Table} from 'antd';
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
            }
        };
    }
    componentDidMount () {
        this.fetch()
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
    showModbus () {
       if (this.state.modalKey === 0) {
           return (
              <Fragment>
               <div className="ModbusModal">
                   <Form >
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
                           ? <Form>
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
                               <Form.Item label="IP地址:">
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
                   <Table />
                   <Button style={{ marginTop: '10'}}>选择模板</Button>
               </Fragment>
           )
       }
       if (this.state.modalKey === 2) {
           return (
               <Fragment>
                   <Divider orientation="left">设备列表</Divider>
                   <p>|设备列表</p>
                   <Button type="primary">添加</Button>
                   <Table />
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

    }
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
                    width="600px"
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
                >
                    {this.state.panes.map(pane => (
                        <TabPane
                            tab={pane.inst_name}
                            key={pane.key}
                        >
                            <ModbusPane/>
                        </TabPane>
                    ))}
                </Tabs>
            </div>
        );
    }
}

export default Modbus;