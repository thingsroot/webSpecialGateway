import React, { Component } from 'react';
import { withRouter} from 'react-router-dom';
import {Button, Alert, Input, Select, Empty} from 'antd';
import {inject, observer} from 'mobx-react';
import http from '../../../utils/Server';
import './style.scss';
import ReactList from 'react-list';

const Search = Input.Search;
const Option = Select.Option;

const noData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDEiIHZpZXdCb3' +
    'g9IjAgMCA2NCA0MSIgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGcgdHJhbnNmb' +
    '3JtPSJ0cmFuc2xhdGUoMCAxKSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj4KICAgIDxlbGxp' +
    'cHNlIGZpbGw9IiNGNUY1RjUiIGN4PSIzMiIgY3k9IjMzIiByeD0iMzIiIHJ5PSI3Ii8+CiAgICA8ZyBmaWx' +
    'sLXJ1bGU9Im5vbnplcm8iIHN0cm9rZT0iI0Q5RDlEOSI+CiAgICAgIDxwYXRoIGQ9Ik01NSAxMi43Nkw0NC' +
    '44NTQgMS4yNThDNDQuMzY3LjQ3NCA0My42NTYgMCA0Mi45MDcgMEgyMS4wOTNjLS43NDkgMC0xLjQ2LjQ3N' +
    'C0xLjk0NyAxLjI1N0w5IDEyLjc2MVYyMmg0NnYtOS4yNHoiLz4KICAgICAgPHBhdGggZD0iTTQxLjYxMyAx' +
    'NS45MzFjMC0xLjYwNS45OTQtMi45MyAyLjIyNy0yLjkzMUg1NXYxOC4xMzdDNTUgMzMuMjYgNTMuNjggMzU' +
    'gNTIuMDUgMzVoLTQwLjFDMTAuMzIgMzUgOSAzMy4yNTkgOSAzMS4xMzdWMTNoMTEuMTZjMS4yMzMgMCAyLj' +
    'IyNyAxLjMyMyAyLjIyNyAyLjkyOHYuMDIyYzAgMS42MDUgMS4wMDUgMi45MDEgMi4yMzcgMi45MDFoMTQuN' +
    'zUyYzEuMjMyIDAgMi4yMzctMS4zMDggMi4yMzctMi45MTN2LS4wMDd6IiBmaWxsPSIjRkFGQUZBIi8+CiAg' +
    'ICA8L2c+CiAgPC9nPgo8L3N2Zz4K'


@withRouter
@inject('store')
@observer
class Logviewer extends Component {
    constructor (props){
        super(props);
        this.mqtt_topic = '/log'
        this.search_timer = null
        this.state = {
            type: '',
            title: '',
            gateway: '',
            filterText: ''
        }
    }
    componentDidMount (){
        const pathname = this.props.location.pathname.toLowerCase();
        if (pathname.indexOf('comms') !== -1){
            this.setState({
                title: '报文',
                type: '/comm'
            })
        } else {
            this.setState({
                title: '日志',
                type: '/log'
            })
        }
        if (this.props.isVserial) {
            this.props.mqtt.connect(this.props.gateway, 'v1/vspax/VSPAX_STREAM/#', true)
        }
        this.setState({ gateway: this.props.gateway })
        const { mqtt } = this.props;
        mqtt.log_channel.setShow(true)
        this.setState({filterText: mqtt.log_channel.filter})
    }
    UNSAFE_componentWillReceiveProps (nextProps) {
        if (nextProps.gateway !== this.state.gateway){
            this.stopChannel()
            this.setState({
                gateway: nextProps.gateway
            })
        }
    }
    componentWillUnmount (){
        const { mqtt } = this.props;
        clearInterval(this.t1)
        if (mqtt.log_channel.Active) {
            this.tick(180)
            mqtt.log_channel.setShow(false)
        }
    }
    tick (time){
        const { mqtt } = this.props;
        mqtt.tick(time)

        const data = {
            duration: time || 60,
            name: this.state.gateway,
            id: `sys_enable_log/${this.state.gateway}/${new Date() * 1}`
        }
        http.post('/api/gateways_enable_log', data)
    }
    handleChange = (value)=> {
        const { mqtt } = this.props;
        if (value !== undefined && value.key !== undefined && value.key !== '') {
            mqtt.log_channel.setSearchType(value.key)
        }
    }
    filter = (e)=>{
        let text = e.target.value;
        this.setState({filterText: text})
        const value = text.toLowerCase();

        if (this.search_timer){
            clearTimeout(this.search_timer)
        }
        this.search_timer = setTimeout(() => {
            const { mqtt } = this.props;
            if (value !== undefined && value !== '') {
                mqtt.log_channel.setFilter(value)
            } else {
                mqtt.log_channel.clearFilter()
            }
        }, 200)
    }
    startChannel =()=>{
        const { mqtt } = this.props;
        this.tick(60)
        this.t1 = setInterval(()=>this.tick(60), 59000);
        mqtt.connect(this.state.gateway, this.mqtt_topic)
    }
    stopChannel =()=>{
        const { mqtt } = this.props;
        mqtt.unsubscribe(this.mqtt_topic)
        clearInterval(this.t1)
        const data = {
            duration: 0,
            name: this.state.gateway,
            id: `sys_enable_log/${this.state.gateway}/${new Date() * 1}`
        }
        http.post('/api/gateways_enable_log', data)
    }
    onClose = ()=>{
        this.setState({maxNum: false})
    }
    render () {
        const { mqtt } = this.props;
        const { gateway } = this.state;
        gateway;
        return (
            <div style={{position: 'relative'}}>
                <div className="toolbar">
                    <div>
                        {
                            mqtt.log_channel.Active
                            ? <Button
                                type="danger"
                                onClick={
                                    this.stopChannel
                                }
                              >
                                取消订阅
                            </Button>
                            : <Button
                                type="primary"
                                onClick={
                                    this.startChannel
                                }
                              >
                                订阅{this.state.title}
                            </Button>
                        }
                        <span style={{padding: '0 5px'}} />
                        <Button
                            type="danger"
                            onClick={()=>{
                                mqtt.log_channel.clearData()
                            }}
                        >清除</Button>
                        <span style={{padding: '0 5px'}} />
                        <span>当前数量：{mqtt.log_channel.Data.length} </span>
                        <span style={{padding: '0 5px'}} />
                        <span>总数： {mqtt.log_channel.AllData.length}</span>
                    </div>
                    <div className="searwrap">

                        <Select
                            labelInValue
                            defaultValue={{ key: 'all' }}
                            style={{ width: 140 }}
                            onChange={this.handleChange}
                        >
                            <Option value="all">全部</Option>
                            <Option value="content">内容</Option>
                            <Option value="level">等级</Option>
                            <Option value="id">进程ID</Option>
                            <Option value="inst">进程名称</Option>
                        </Select>
                        <span style={{padding: '0 5px'}} />
                        <Search
                            placeholder="输入搜索内容"
                            value={this.state.filterText}
                            onChange={this.filter}
                            style={{ display: 'inline-block', width: 300 }}
                        />
                    </div>
                </div>
                {
                    this.state.maxNum
                    ? <Alert
                        message="超出最大数量"
                        description="日志最大数量一千条，请清除后再重新订阅！"
                        type="error"
                        closable
                        onClose={this.onClose}
                      />
                    : ''
                }
                <div
                    ref="table"
                    className="logview"
                >
                    <div style={{width: '100%'}}>
                        <div className="tableHeaders">
                            <div style={{backgroundColor: '#f9f9f9', lineHeight: '30px'}}>时间</div>
                            <div style={{backgroundColor: '#f9f9f9', lineHeight: '30px'}}>等级</div>
                            <div style={{backgroundColor: '#f9f9f9', lineHeight: '30px'}}>进程ID</div>
                            <div style={{backgroundColor: '#f9f9f9', lineHeight: '30px'}}>进程名称</div>
                            <div style={{backgroundColor: '#f9f9f9', lineHeight: '30px'}}>内容</div>
                        </div>
                            <div
                                className="tableContent"
                                id="tbody"
                            >
                                <div
                                    style={{height: 600, overflowY: 'auto'}}
                                >
                                    <ReactList
                                        pageSize={1}
                                        ref="content"
                                        axis="y"
                                        type="simple"
                                        length={mqtt.log_channel.Data.length}
                                        itemRenderer={(key)=>{
                                            return (<div key={key}>
                                                <div className="tableHeaders">
                                                    <div>{mqtt.log_channel.Data[key].time}</div>
                                                    <div>{mqtt.log_channel.Data[key].level}</div>
                                                    <div>{mqtt.log_channel.Data[key].id}</div>
                                                    <div>{mqtt.log_channel.Data[key].inst}</div>
                                                    <div>{mqtt.log_channel.Data[key].content}</div>
                                                </div>
                                            </div>)
                                        }}
                                    />
                                    {
                                        mqtt.log_channel.Data.length === 0
                                        ? <div style={{padding: '50px', borderBottom: '1px solid #e8e8e8'}}>
                                            <Empty
                                                image={noData}
                                            />
                                        </div> : null
                                    }
                                </div>
                            </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Logviewer;