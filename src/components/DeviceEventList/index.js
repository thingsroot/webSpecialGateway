import React, { Component } from 'react';
import {Table, Input, Select, Button, message, Icon, Alert } from 'antd'
import './style.scss'
import http from '../../utils/Server';
import axios from 'axios';
import {inject, observer} from 'mobx-react';
import SonTables from './SonTables';

const InputGroup = Input.Group;
const Option = Select.Option;
const disposed = {
    color: '#367fa9',
    fontWeight: '600'
};
const posed = {
    color: 'rgba(0, 0, 0, 0.65)',
    fontWeight: 'normal'
};

const AllColumns = [
    {
        title: '标题',
        dataIndex: 'title',
        width: '25%',
        render: (text, record) => (
            <span
                className="cursor"
                style={record.disposed === 0 ? disposed : posed}
            >{text}
            </span>
        )
    }, {
        title: '网关序列号',
        dataIndex: 'device',
        width: '35%',
        render: (text, record) => (
            <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
        )
    }, {
        title: '发生时间',
        dataIndex: 'creation',
        width: '20%',
        render: (text, record) => (
            <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
        )
    }, {
        title: '事件类型',
        dataIndex: 'event_type_str',
        width: '10%',
        render: (text, record) => (
            <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
        )
    }, {
        title: '事件等级',
        dataIndex: 'event_level_str',
        width: '10%',
        render: (text, record) => (
            <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
        )
    }
]

const NoSNColumns = [
    {
        title: '标题',
        dataIndex: 'title',
        width: '60%',
        render: (text, record) => (
            <span
                className="cursor"
                style={record.disposed === 0 ? disposed : posed}
            >{text}
            </span>
        )
    }, {
        title: '发生时间',
        dataIndex: 'creation',
        width: '20%',
        render: (text, record) => (
            <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
        )
    }, {
        title: '事件类型',
        dataIndex: 'event_type_str',
        width: '10%',
        render: (text, record) => (
            <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
        )
    }, {
        title: '事件等级',
        dataIndex: 'event_level_str',
        width: '10%',
        render: (text, record) => (
            <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
        )
    }
]

@inject('store')
@observer
class DeviceEventList extends Component {
    state = {
        category: '',
        user: '',
        showUnDisposed: false,
        gateway: undefined,
        limitTime: 1,
        limitStart: 0,
        limitLength: 100,
        tableData: [],
        allData: [],
        filterColumn: '',
        filterType: '',
        filterLevel: '',
        filterText: '',
        columns: [],
        loading: false,
        selectedRowKeys: [],
        messageCount: 0,
        unconfirmed: 0,
        sync: false
    };
    componentDidMount (){
        const {gateway, limitTime, limitLength, limitStart, showUnDisposed} = this.props
        let default_time_limit = 24
        if (gateway !== undefined){
            default_time_limit = 168
        }

        this.setState({
            category: 'user',
            name: this.props.store.session.user_id,
            gateway: gateway,
            showUnDisposed: showUnDisposed,
            columns: gateway ? NoSNColumns : AllColumns,
            limitTime: limitTime ? limitTime : default_time_limit,
            limitStart: limitStart ? limitStart : 0,
            limitLength: limitLength ? limitLength : 1000
        }, ()=>{
            this.fetchAll();
        })
    }
    UNSAFE_componentWillReceiveProps (nextProps){
        const {gateway, limitTime} = nextProps
        if (gateway !== this.state.gateway) {
            this.setState({
                gateway: gateway,
                limitTime: limitTime
            }, ()=>{
                this.fetchAll()
            })
        }
    }
    onSelectChange = (selectedRowKeys) => {
        this.setState({ selectedRowKeys });
    };

    //确认消息
    confMessage = (toData)=>{
        if (toData.length === 0) {
            message.warning('请您先选择要确认的消息！');
        } else {
            this.setState({ loading: true  });

            let arr = []
            let allData = this.state.allData;
            allData && allData.length > 0 && allData.map((v, key)=>{
                key;
                toData.map((c_name)=>{
                    if (v.name === c_name && v.disposed === 0) {
                        arr.push(c_name)
                    }
                });
            });

            if (arr.length === 0) {
                this.setState({  loading: false });
                return
            }

            let params = {
                category: this.state.category,
                events: arr,
                disposed: 1
            };
            http.post('/api/events_dispose', params).then(res=>{
                if (!res.ok) {
                    this.setState({  loading: false });
                    message.error(res.err)
                    return
                }
                let allData = this.state.allData;
                allData && allData.length > 0 && allData.map((w, key)=>{
                    key;
                    arr.map((v)=>{
                        if (w.name === v) {
                            w.disposed = 1
                            w.disposed_by = this.state.name
                        }
                    });
                });
                let tableData = this.state.tableData;
                tableData && tableData.length > 0 && tableData.map((w, key)=>{
                    key;
                    arr.map((v)=>{
                        if (w.name === v) {
                            w.disposed = 1
                            w.disposed_by = this.state.name
                        }
                    });
                });

                this.setState({
                    selectedRowKeys: [],
                    loading: false,
                    allData: allData,
                    tableData: tableData,
                    unconfirmed: this.state.unconfirmed - arr.length
                });
            }).catch(err=>{
                console.log(err)
            })
        }
    };
    //确认所有消息
    confAllMessage = ()=>{
        this.setState({
            loading: true
        });
        let data = [];
        let tableData = this.state.tableData;
        tableData && tableData.length > 0 && tableData.map((v, key)=>{
            key;
            if (v.disposed === 0) {
                data.push(v.name)
            }
        });
        let params = {
            category: this.state.category,
            events: data,
            disposed: 1
        };

        http.post('/api/events_dispose', params).then(res=>{
            if (!res.ok) {
                this.setState({  loading: false });
                message.error(res.err)
                return
            }
            let allData = this.state.allData;
            allData && allData.length > 0 && allData.map((w, key)=>{
                key;
                data.map((v, key1)=>{
                    key1;
                    if (w.name === v) {
                        w.disposed = 1
                        w.disposed_by = this.state.name
                    }
                });
            });
            let tableData = this.state.tableData;
            tableData && tableData.length > 0 && tableData.map((w, key)=>{
                key;
                data.map((v, key1)=>{
                    key1;
                    if (w.name === v) {
                        w.disposed = 1
                        w.disposed_by = this.state.name
                    }
                });
            });
            this.setState({
                selectedRowKeys: [],
                loading: false,
                allData: allData,
                tableData: tableData,
                unconfirmed: this.state.unconfirmed - data.length
            });
        }).catch(err=>{
            console.log(err)
        })
    };

    fetchAll = () => {
        if (this.fetch_timer){
            clearTimeout(this.fetch_timer)
        }
        this.fetch_timer = setTimeout(() => {
            this.getMessageList()
        }, 200);
    }
    //获取消息列表
    getMessageList = ()=>{
        let filters = {
            creation: ['>', this.durationToTime(this.state.limitTime)]
        }
        if (this.state.gateway) {
            filters['device'] = this.state.gateway
        }
        if (this.state.showUnDisposed) {
            filters['disposed'] = 0;
        }
        let params = {
            category: this.state.category,
            name: this.state.name,
            start: this.state.limitStart,
            limit: this.state.limitLength,
            filters: filters
        }

        this.setState({
            loading: true,
            unconfirmed: 0
        });
        axios({
            url: '/api/device_events_list',
            method: 'GET',
            params: params
        }).then(res=>{
            let data = [];
            let message_count = 0;
            let unconfirmed = 0;
            if (res.data.ok === true) {
                let sourceData = res.data.data.list
                message_count = res.data.data.count
                sourceData.map((v)=>{
                    if (v.disposed === 0) {
                        unconfirmed++
                    }
                    let level = '';
                    if (v.event_level === 1) {
                        level = '常规'
                    } else if (v.event_level === 2) {
                        level = '错误'
                    } else if (v.event_level >= 3 && v.event_level < 10) {
                        level = '警告'
                    } else if (v.event_level >= 10) {
                        level = '致命'
                    }
                    let type = '';
                    if (v.event_type === 'COMM') {
                        type = '通讯'
                    } else if (v.event_type === 'DATA') {
                        type = '数据'
                    } else if (v.event_type === 'SYS') {
                        type = '系统'
                    } else if (v.event_type === 'DEV') {
                        type = '设备'
                    } else {
                        type = '未知'
                    }
                    data.push({
                        title: v.event_info,
                        device: v.event_source,
                        creation: v.creation.split('.')[0],
                        disposed: v.disposed,
                        disposed_by: v.disposed_by,
                        name: v.name,
                        data: v.event_data,
                        event_level: v.event_level,
                        event_level_str: level,
                        event_type: v.event_type,
                        event_type_str: type,
                        event_time: v.creation.split('.')[0]
                    });
                });
            } else {
                message.error('获取消息列表失败！')
            }
            this.setState({
                loading: false,
                allData: data,
                messageCount: message_count,
                unconfirmed: unconfirmed,
                sync: false
            }, ()=> {
                this.filterMessages()
            });
        })
    };
    //查看所有、查看未确认
    toggleMessage = ()=>{
        this.setState({
            showUnDisposed: !this.state.showUnDisposed
        }, ()=>{
            this.fetchAll()
        })
    };

    //时间戳转换
    durationToTime = (duration)=>{
        let date = new Date(Date.parse(new Date()) - duration * 60 * 60 * 1000);
        let Y = date.getFullYear() + '-';
        let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        let D = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate()) + ' ';
        let h = (date.getHours() < 10 ? '0' + (date.getHours()) : date.getHours()) + ':';
        let m = (date.getMinutes() < 10 ? '0' + (date.getMinutes()) : date.getMinutes()) + ':';
        let s = '00';
        return Y + M + D + h + m + s;
    };
    //搜索框改变值
    onFilterColumnChange = (text)=>{
        this.setState({
            filterColumn: text
        }, ()=>{
            this.filterMessages()
        })
    };
    search = (e)=>{
        let text = e.target.value;
        if (this.timer){
            clearTimeout(this.timer)
        }
        this.setState({filterText: text}, () =>{
            this.timer = setTimeout(() => {
                this.filterMessages()
            }, 200);
        })
    }
    filterMessages = ()=>{
        const { filterColumn, allData, filterType, filterLevel, filterText } = this.state
        let newAllData = []
        allData.map( (v) => {
            if (filterType !== '' && v.event_type !== filterType) {
                return
            }
            if (filterLevel !== '' && v.event_level !== parseInt(filterLevel) ) {
                return
            }
            newAllData.push(v)
        })
        let newData = []
        if (filterText && filterText !== '') {
            let text = filterText.toLowerCase()
            newAllData.map((v)=>{
                if (filterColumn !== '') {
                    if (v[filterColumn].toLowerCase().indexOf(text) !== -1) {
                        newData.push(v)
                    }
                } else {
                    if (v.title.toLowerCase().indexOf(text) !== -1 ||
                        v.device.toLowerCase().indexOf(text) !== -1 ||
                        v.data.toLowerCase().indexOf(text) !== -1) {
                        newData.push(v)
                    }
                }
            });
        } else {
            newData = newAllData
        }

        this.setState({
            tableData: newData,
            loading: false
        });
    };
    //最大记录数
    onTotalLengthChange = (value)=>{
        let num = `${value}`
        this.setState({
            limitLength: num
        }, () => {
            this.fetchAll();
        })
    };
    //筛选消息类型
    onTypeChange = (value)=>{
        this.setState({
            filterType: value
        }, () => {
            this.filterMessages()
        })
    };
    //等级筛选
    onLevelChange = (value)=>{
        this.setState({
            filterLevel: value
        }, () => {
            this.filterMessages()
        })
    };
    //时间
    onTotalTimeChange = (value)=>{
        this.setState({
            limitTime: Number(value)
        }, () => {
            this.fetchAll();
        })
    };
    //表格
    onChange = (pagination, filters, sorter)=>{
        console.log('params', pagination, filters, sorter)
    };

    refresh = ()=>{
        this.setState({
            sync: true
        }, ()=>{
            this.fetchAll()
        })
    };

    render () {
        let { selectedRowKeys, columns, showUnDisposed,
            messageCount, unconfirmed } = this.state;
        const rowSelection = {
            selectedRowKeys,
            onChange: this.onSelectChange
        };
        return (
            <div className="deviceEventList">
                <div className="searchBox flex">
                    <div style={{minWidth: 160}}>
                        <Button onClick={()=>{
                            this.confMessage(selectedRowKeys)
                        }}
                        >确认</Button>
                        <span style={{padding: '0 5px'}} />
                        <Button onClick={()=>{
                            this.confAllMessage()
                        }}
                        >确认所有</Button>
                    </div>

                    <div
                        className="flex"
                    >
                        <span>类型:</span>
                        <Select
                            value={this.state.filterType}
                            style={{ width: 100 }}
                            onChange={this.onTypeChange}
                        >
                            <Option value="">全部</Option>
                            <Option value="COMM">通讯</Option>
                            <Option value="DATA">数据</Option>
                            <Option value="APP">应用</Option>
                            <Option value="SYS">系统</Option>
                            <Option value="DEV">设备</Option>
                        </Select>
                        <span style={{padding: '0 3px'}} />
                        <span>等级:</span>
                        <Select
                            value={this.state.filterLevel}
                            style={{ width: 80 }}
                            onChange={this.onLevelChange}
                        >
                            <Option value="">全部</Option>
                            <Option value="1">常规</Option>
                            <Option value="2">错误</Option>
                            <Option value="3">警告</Option>
                            <Option value="99">致命</Option>
                        </Select>
                        <span style={{padding: '0 1px'}} />
                        <Select
                            value={`${this.state.limitLength}`}
                            style={{ width: 80 }}
                            onChange={this.onTotalLengthChange}
                        >
                            <Option value="100">100</Option>
                            <Option value="300">300</Option>
                            <Option value="500">500</Option>
                            <Option value="1000">1000</Option>
                        </Select>
                        <span style={{padding: '0 1px'}} />
                        <Select
                            value={`${this.state.limitTime}`}
                            style={{ width: 100 }}
                            onChange={this.onTotalTimeChange}
                        >
                            <Option value="1">1小时</Option>
                            <Option value="6">6小时</Option>
                            <Option value="12">12小时</Option>
                            <Option value="24">24小时</Option>
                            <Option value="72">三天</Option>
                            <Option value="168">一周</Option>
                        </Select>
                        <span style={{padding: '0 1px'}} />
                        <InputGroup compact>
                            <Select
                                defaultValue=""
                                onChange={this.onFilterColumnChange}
                                style={{width: '100px'}}
                                disabled={this.state.gateway !== undefined}
                            >
                                <Option value="">全部</Option>
                                <Option value="title">标题</Option>
                                <Option value="device">序列号</Option>
                            </Select>
                            <Input
                                style={{ width: 200 }}
                                placeholder="请输入关键字"
                                onChange={this.search}
                            />
                        </InputGroup>
                        <Icon
                            style={{fontSize: '18px', lineHeight: '35px', padding: '5px 0 0 10px'}}
                            type="reload"
                            spin={this.state.sync}
                            onClick={this.refresh}
                        />
                    </div>
                </div>
                <Alert
                    style={{marginBottom: 5}}
                    type="info"
                    showIcon
                    message={
                        <span>
                            全部消息<b>{messageCount}</b>条，列表中未确认消息<b>{unconfirmed}</b>条，
                            <span
                                style={{color: 'blue', cursor: 'pointer'}}
                                onClick={this.toggleMessage}
                            >
                                {showUnDisposed ? '查看所有' : '查看未确认'}
                            </span>
                        </span>
                    }
                />

                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={this.state.tableData}
                    loading={this.state.loading}
                    onChange={this.onChange}
                    rowKey="name"
                    expandRowByClick
                    rowClassName={this.setClassName} //表格行点击高亮
                    expandedRowRender={record => {
                        return (
                            <SonTables
                                data={record}
                                onConfirm={this.confMessage}
                            />
                        )
                    }}
                />
            </div>
        );
    }
}
export default DeviceEventList;