import React, { Component } from 'react';
import http from '../../utils/Server';
import { Table, Tabs, Button, message, Input, Icon, Tag } from 'antd';
import './style.scss';
import { inject, observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import GatewayForm from './GatewayForm'

const Search = Input.Search;
const TabPane = Tabs.TabPane;
let timer;

@inject('store')
@observer
class MyGates extends Component {
    constructor (props){
        super(props)
        this.state = {
            onlinedata: [],
            offlinedata: [],
            alldata: [],
            status: 'online',
            filter_text: '',
            loading: true,
            visible: false,
            visibleEdit: false,
            refreshing: false,
            user_groups: [],
            record: {},
            recordVisible: false,
            columns: [
                {
                title: '名称',
                dataIndex: 'dev_name',
                key: 'dev_name',
                sorter: (a, b) => a.dev_name.length - b.dev_name.length,
                render: (props, record)=>{
                    return (
                        <div style={{lineHeight: '45px'}}>
                            {!record.is_shared && record.owner_type === 'Cloud Company Group' ? <Tag color="cyan" >公司</Tag> : null}
                            {!record.is_shared && record.owner_type === 'User' ? <Tag color="lime" >个人</Tag> : null}
                            {record.is_shared ? <Tag color="orange" >分享</Tag> : null}
                            {record.dev_name}
                        </div>
                    )
                }
              }, {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
                sorter: (a, b) => a.description && b.description && a.description.length - b.description.length
              }, {
                title: '上线时间',
                dataIndex: 'last_updated',
                key: 'last_updated',
                width: '160px',
                sorter: (a, b) => a.last_updated && b.last_updated && new Date(a.last_updated) - new Date(b.last_updated)
              }, {
                title: '状态',
                key: 'device_status',
                dataIndex: 'device_status',
                width: '80px',
                render: (record)=>{
                    if (record === 'ONLINE'){
                        return <span className="online"><b></b>&nbsp;&nbsp;在线</span>
                    } else if (record === 'OFFLINE') {
                        return <span className="offline"><b></b>&nbsp;&nbsp;离线</span>
                    } else {
                        return <span className="notline"><b></b>&nbsp;&nbsp;未连接</span>
                    }
                }
              }, {
                title: '设备数',
                key: 'device_devs_num',
                dataIndex: 'device_devs_num',
                width: '65px'
                }, {
                title: '应用数',
                key: 'device_apps_num',
                dataIndex: 'device_apps_num',
                width: '65px'
                }, {
                title: '操作',
                key: 'action',
                width: '240px',
                render: (text, record, props) => {
                    props;
                  return (
                      <span>
                        <Link to={{
                            pathname: `/gateway/${record.sn}/devices`,
                            state: record
                        }}
                        >
                            <Button key="1">设备</Button>
                        </Link>
                        <span style={{padding: '0 1px'}} />
                        <Link to={{
                            pathname: `/gateway/${record.sn}/modbus`,
                            state: record
                        }}
                        >
                            <Button key="2">modbus</Button>
                        </Link>
                        <Link to={{
                            pathname: `/gateway/${record.sn}/mqtt`,
                            state: record
                        }}
                        >
                            <Button key="3">mqtt</Button>
                        </Link>
                        </span>
                    )
                }
              }
              ]
        }
    }
    componentDidMount (){
        http.get('/api/user_groups_list').then(res=>{
            if (res.ok && res.data[0]){
                this.setState({
                    user_groups: res.data
                })
            }
        });
        let {all, online, offline} = this.props.store.gatewayList;
        let loading = online.length !== 0 ? false : true
        this.setState({
            loading: loading,
            alldata: all,
            onlinedata: online,
            offlinedata: offline
        })

        this.refreshDevicesList();
        timer = setInterval(() => {
            this.refreshDevicesList()
        }, 10000);
    }
    componentWillUnmount () {
        clearInterval(timer)
    }

    refreshDevicesList (){
        let status = this.state.status;
        http.get('/api/gateways_list?status=' + status).then(res=>{
            if (res.ok) {
                const data = status + 'data';
                if (status === 'online') {
                    this.props.store.gatewayList.setOnline(res.data)
                }
                if (status === 'offline') {
                    this.props.store.gatewayList.setOffline(res.data)
                }
                if (status === 'all') {
                    this.props.store.gatewayList.setAll(res.data)
                }
                let arr = this.filterGatewayList(res.data, this.state.filter_text)
                this.setState({
                    loading: false,
                    [data]: arr
                });
            }
        })
    }
    confirm (record) {
        if (record.device_status === 'ONLINE'){
            http.post('/api/gateways_remove', {
                name: record.name
            }).then(res=>{
                if (res.ok){
                    message.success('移除网关成功')
                }
                this.refreshDevicesList()
            })
        }
    }

    filterGatewayList = (data, filter_text) => {
        if (filter_text === undefined || filter_text === '' || data === undefined) {
            return data
        }
        let text = filter_text.toLowerCase()
        let arr = [];
        data.map(item=>{
            if (item.dev_name.toLowerCase().indexOf(text) !== -1 ||
                item.sn.toLowerCase().indexOf(text) !== -1 ||
                ( item.description && item.description.toLowerCase().indexOf(text) !== -1)){
                arr.push(item)
            }
        });
        return arr;
    }
    changeFilter = (text)=>{
        if (this.timer){
            clearTimeout(this.timer)
        }
        this.setState({
            filter_text: text
        }, () => {
            this.timer = setTimeout(() => {
                const name = this.state.status + 'data';
                let data = [];
                const {all, online, offline} = this.props.store.gatewayList;
                if (this.state.status === 'all') {
                    data = all
                }
                if (this.state.status === 'online') {
                    data = online
                }
                if (this.state.status === 'offline') {
                    data = offline
                }
                let arr = this.filterGatewayList(data, this.state.filter_text)
                this.setState({
                    [name]: arr
                })
            }, 200);
        });
    }
    search = (e)=>{
        let text = e.target.value;
        this.changeFilter(text)
    }
    render (){
        let { alldata, onlinedata, offlinedata } = this.state;
        return (
            <div
                style={{
                    position: 'relative'
                }}
            >
                <Button
                    type="primary"
                    onClick={()=>{
                        this.setState({visible: true})
                    }}
                    style={{
                        position: 'absolute',
                        right: 130,
                        top: 0,
                        zIndex: 999
                    }}
                >添加网关</Button>
                <Button
                    type="primary"
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        zIndex: 999
                    }}
                    onClick={()=>{
                        this.props.history.push('/virtualgateways')
                    }}
                >添加虚拟网关</Button>
                <div
                    style={{
                        display: 'flex',
                        position: 'absolute',
                        right: 240,
                        top: 0,
                        zIndex: 999,
                        lineHeight: '30px'
                    }}
                >
                    <Search
                        placeholder="网关名称、描述、序列号"
                        onChange={this.search}
                        style={{ width: 200 }}
                    />
                </div>
                <GatewayForm
                    visible={this.state.visible}
                    type={'create'}
                    user_groups={this.state.user_groups}
                    onOK={()=>{
                        this.setState({visible: false})
                        this.refreshDevicesList()
                    }}
                    onCancel={()=>{
                        this.setState({visible: false})
                    }}
                />
                <GatewayForm
                    visible={this.state.visibleEdit}
                    type={'update'}
                    user_groups={this.state.user_groups}
                    gatewayInfo={this.state.record}
                    onOK={()=>{
                        this.setState({visibleEdit: false})
                        this.refreshDevicesList()
                    }}
                    onCancel={()=>{
                        this.setState({visibleEdit: false})
                    }}
                />
                <div style={{position: 'relative'}}>
                    <Button
                        disabled={this.state.refreshing}
                        style={{position: 'absolute', left: 200, top: 0, zIndex: 999}}
                        onClick={()=>{
                            this.setState({refreshing: true})
                            this.refreshDevicesList()
                            setTimeout(()=> {
                                this.setState({refreshing: false})
                            }, 2000)
                        }}
                    >
                        <Icon type="reload"/>
                    </Button>
                    {
                        <Tabs
                            type="card"
                            activeKey={this.state.status}
                            onChange={(value)=>{
                                let status = value
                                let data = this.state[status + 'data']
                                let loading = data && data.length > 0 ? false : true
                                this.setState({loading: loading, status: status}, ()=>{
                                    this.refreshDevicesList()
                                })
                            }}
                        >
                        <TabPane tab="在线"
                            key="online"
                        >
                            <Table columns={
                                        this.state.columns
                                    }
                                dataSource={
                                    onlinedata && onlinedata.length > 0 ? onlinedata : []
                                }
                                bordered
                                loading={this.state.loading}
                                rowKey="sn"
                                size="small"
                                rowClassName={(record, index) => {
                                    let className = 'light-row';
                                    if (index % 2 === 1) {
                                        className = 'dark-row';
                                    }
                                    return className;
                                }}
                            /></TabPane>
                        <TabPane tab="离线"
                            key="offline"
                        >
                            <Table columns={this.state.columns}
                                dataSource={
                                    offlinedata && offlinedata.length > 0 ? offlinedata : []
                                }
                                rowKey="sn"
                                rowClassName={(record, index) => {
                                    let className = 'light-row';
                                    if (index % 2 === 1) {
                                        className = 'dark-row';
                                    }
                                    return className;
                                }}
                                bordered
                                loading={this.state.loading}
                                size="small "
                            />
                        </TabPane>
                        <TabPane tab="全部"
                            key="all"
                        >
                            <Table columns={this.state.columns}
                                dataSource={
                                    alldata && alldata.length > 0 ? alldata : []
                                }
                                rowClassName={(record, index) => {
                                    let className = 'light-row';
                                    if (index % 2 === 1) {
                                        className = 'dark-row';
                                    }
                                    return className;
                                }}
                                rowKey="sn"
                                bordered
                                loading={this.state.loading}
                                size="small "
                            />
                        </TabPane>
                    </Tabs>
                    }
                </div>
            </div>
        );
    }
}
export default MyGates;