import React, { Component } from 'react';
import {withRouter} from 'react-router-dom'
import {Select, Table, Button, InputNumber, Checkbox, Form, Divider  } from 'antd';
// import Slide from 'react-slick'

import './style.scss';
const { Option } = Select;
@withRouter
class ModbusPane extends Component {
    state = {
        // conf: {
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
        // }
    }
    componentDidMount () {
        console.log(this.refs)
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

    }
    render (){
        const  { loop_gap, apdu_type, channel_type, serial_opt} = this.state;
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
                <Form >
                    <Divider  orientation="left">应用配置信息</Divider>
                    <Form.Item label="采集间隔:">
                        <InputNumber
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
                            defaultValue={channel_type}
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
                    channel_type === 'socket'
                        ? <Form>
                            <Divider  orientation="left">串口设定</Divider>
                            <Form.Item label="端口：">
                                <Select
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
                                    defaultValue={serial_opt.stop_bits}
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
                        : <div>
                            <Form.Item label="IP地址:">
                                <Select
                                    defaultValue={serial_opt.flow_control}
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
                                    defaultValue={serial_opt.flow_control}
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

                <Divider orientation="left">设备模板选择</Divider>
                <Table />
                <Button style={Mt10}>选择模板</Button>
                <Divider orientation="left">设备列表</Divider>
                <p>|设备列表</p>
                <Button type="primary">添加</Button>
                <Table />
                {/* </Carousel> */}
            </div>
        );
    }
}

export default ModbusPane;