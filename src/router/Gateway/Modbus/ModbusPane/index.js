import React, { Component } from 'react';
import {withRouter} from 'react-router-dom'
import {Select, Table, Button, InputNumber, Checkbox, Form, Divider, Input  } from 'antd';
// import Slide from 'react-slick'

import './style.scss';
const { Option } = Select;
@withRouter
class ModbusPane extends Component {
    state = {
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
                key: 'action'
              }
        ],
        disabled: true

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
    toggleDisable = () => {
        this.setState({disabled: !this.state.disabled})

    };
    render (){
        const  { loop_gap, apdu_type, channel_type, serial_opt, disabled, socket_opt, tpls, devs} = this.state;
        const Mt10 = {
            marginTop: '10px'
        }
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
                    dataSource={tpls}
                    columns={this.state.tplsCloumns}
                    pagination={false}
                />
                <Button
                    style={Mt10}
                    disabled={disabled}
                >选择模板</Button>
                <Divider orientation="left">设备列表</Divider>
                <p>|设备列表</p>
                <Button
                    type="primary"
                    disabled={disabled}
                >添加</Button>
                <Table
                    columns={this.state.devsCloumns}
                    dataSource={devs}
                    pagination={false}
                />
                <div>
                    使用网关sn作为设备sn的前缀:
                    <Checkbox onChange={()=>{
                        this.setSetting('checkbox', 'checkbox')
                        }}
                    />
                </div>
                {/* </Carousel> */}
            </div>
        );
    }
}

export default ModbusPane;