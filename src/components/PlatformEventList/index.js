import React, { Component } from 'react';
import {Table, Input, Select, Button, message, Icon, Alert } from 'antd'
import SonTable from './SonTable';
import './style.scss'
import http from '../../utils/Server';
import axios from 'axios';
import {inject, observer} from 'mobx-react';

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
        width: '30%',
        render: (text, record) => (
            <span
                className="cursor overflow"
                style={record.disposed === 0 ? disposed : posed}
            >
                {text}
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
        title: '消息类型',
        dataIndex: 'operation_str',
        width: '15%',
        render: (text, record) => (
            <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
        )
    }
]

const NoSNColumns = [
    {
        title: '标题',
        dataIndex: 'title',
        width: '65%',
        render: (text, record) => (
            <span
                className="cursor overflow"
                style={record.disposed === 0 ? disposed : posed}
            >
                {text}
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
        title: '消息类型',
        dataIndex: 'operation_str',
        width: '15%',
        render: (text, record) => (
            <span style={record.disposed === 0 ? disposed : posed}>{text}</span>
        )
    }
]

@inject('store')
@observer
class PlatformEvents extends Component {
    state = {
        name: '',
        category: '',
        showUnDisposed: false,
        gateway: undefined,
        limitTime: 1,
        limitStart: 0,
        limitLength: 100,
        tableData: [],
        allData: [],
        selectValue: 'title',
        filterColumn: '',
        filterType: '',
        filterText: '',
        columns: [],
        loading: false,
        selectedRowKeys: [],
        visible: false,
        unconfirmed: 0,
        messageCount: 0,
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
            this.setState({ loading: true });

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
                activities: arr,
                disposed: 1
            };
            http.post('/api/activities_dispose', params).then(res=>{
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
    //确认全部消息
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
            activities: data,
            disposed: 1
        };
        http.post('/api/activities_dispose', params).then(res=>{
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
                unconfirmed: 0
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
    generateTitle = (activity, data) => {
        let sub = '';
        //设备状态
        if (data.hasOwnProperty('device_status')) {
            if (data.device_status === 'ONLINE'){
                sub = '设备上线'
            } else if (data.device_status === 'OFFLINE'){
                sub = '设备离线'
            }
            //设备操作
        } else if (data.hasOwnProperty('action')){
            if (data.channel === 'app') {
                if (data.action === 'option') {   //开机自启动
                    if (data.data.value === 1 || data.data.value === '1') {
                        sub = activity.full_name + '  开启应用' + data.data.inst + '开机自启动'
                    } else if (data.data.value === 0 || data.data.value === '0') {
                        sub = activity.full_name + '  关闭应用' + data.data.inst + '开机自启动'
                    } else {
                        sub = JSON.stringify(data)
                    }
                } else if (data.action === 'restart') {
                    sub = activity.full_name + '    重启应用' + data.data.inst
                } else if (data.action === 'start') {
                    sub = activity.full_name + '    启动应用' + data.data.inst
                } else if (data.action === 'stop') {
                    sub = activity.full_name + '   停止应用' + data.data.inst
                } else if (data.action === 'conf') {
                    sub = activity.full_name + '   更改应用' + data.data.inst + '应用配置'
                } else if (data.action === 'upload_comm') {
                    if (data.data.sec === 0 || data.data.sec === '0') {
                        sub = activity.full_name + '   停止上传应用' + data.data.inst + '报文'
                    } else if (data.data.sec !== 0 || data.data.sec !== '0') {
                        sub = activity.full_name + '   上传应用' + data.data.inst + '报文'
                    } else {
                        sub = JSON.stringify(data)
                    }
                } else if (data.action === 'install') {
                    sub = activity.full_name + '   安装应用' + data.data.name + '实例名' + data.data.inst
                } else if (data.action === 'uninstall') {
                    sub = activity.full_name + '   卸载应用' + data.data.inst
                } else if (data.action === 'query_comm') {
                    sub = activity.full_name + '   查询应用' + data.data.inst + '报文'
                } else if (data.action === 'query_log') {
                    sub = activity.full_name + '   应用查询' + data.data.inst + '日志'
                } else if (data.action === 'list') {
                    sub = activity.full_name + '   刷新应用列表'
                } else if (data.action === 'upgrade') {
                    sub = activity.full_name + '   升级应用' + data.data.inst + '到最新版本'
                } else if (data.action === 'rename') {
                    sub = activity.full_name + '   重命名应用' + data.data.inst + '为' + data.data.new_name
                } else {
                    sub = JSON.stringify(data)
                }
            } else if (data.channel === 'sys') {
                if (data.action === 'enable/beta') {
                    if (data.data === 0 || data.data === '0') {
                        sub = activity.full_name + '    关闭网关beta模式'
                    } else if (data.data !== 0 || data.data !== '0') {
                        sub = activity.full_name + '    开启网关beta模式'
                    } else {
                        sub = JSON.stringify(data)
                    }
                } else if (data.action === 'enable/data') {
                    if (data.data === 0 || data.data === '0') {
                        sub = activity.full_name + '    关闭网关数据上传'
                    } else if (data.data !== 0 || data.data === '0') {
                        sub = activity.full_name + '    开启网关数据上传'
                    } else {
                        sub = JSON.stringify(data)
                    }
                } else if (data.action === 'enable/log') {
                    if (data.data === 0 || data.data === '0') {
                        sub = activity.full_name + '    关闭网关日志上送'
                    } else if (data.data !== 0 || data.data !== '0') {
                        sub = activity.full_name + '    开启网关日志上送'
                    } else {
                        sub = JSON.stringify(data)
                    }
                } else if (data.action === 'enable/comm') {
                    if (data.data === 0 || data.data === '0') {
                        sub = activity.full_name + '    停止网关报文上送'
                    } else if (data.data !== 0 || data.data !== '0') {
                        sub = activity.full_name + '    开启网关报文上送'
                    } else {
                        sub = JSON.stringify(data)
                    }
                } else if (data.action === 'restart') {
                    sub = activity.full_name + '    重启网关IOT程序'
                } else if (data.action === 'reboot') {
                    sub = activity.full_name + '    重启网关设备'
                } else if (data.action === 'cloud_conf') {
                    sub = activity.full_name + '    更新网关云中心配置选项'
                } else if (data.action === 'enable/data_one_short') {
                    if (data.data === 0  || data.data === '0') {
                        sub = activity.full_name + '    关闭网关临时上传数据'
                    } else if (data.data !== 0 || data.data !== '0') {
                        sub = activity.full_name + '    开启网关临时上传数据'
                    } else {
                        sub = JSON.stringify(data)
                    }
                } else if (data.action === 'ext/upgrade') {
                    sub = activity.full_name + '    更新网关扩展库' + data.data.name
                } else if (data.action === 'ext/list') {
                    sub = activity.full_name + '    上传网关扩展库列表'
                } else if (data.action === 'cfg/download') {
                    sub = activity.full_name + '    下载网关IOT固件配置'
                } else if (data.action === 'cfg/upload') {
                    sub = activity.full_name + '    上传网关IOT固件配置'
                } else if (data.action === 'upgrade') {
                    sub = activity.full_name + '    升级网关到最新版本'
                } else if (data.action === 'enable/event') {
                    sub = activity.full_name + '    更改网关事件上传等级'
                } else if (data.action === 'enable/stat') {
                    sub = activity.full_name + '    开启网关统计数据上传'
                } else if (data.action === 'batch_script') {
                    sub = activity.full_name + '    执行网关批量操作'
                } else if (data.action === 'upgrade/ack') {
                    sub = activity.full_name + '    确认升级网关IOT固件'
                } else if (data.action === 'data/query') {
                    sub = activity.full_name + '    请求立刻上传网关数据'
                } else {
                    sub = JSON.stringify(data)
                }
            } else if (data.channel === 'command') {
                sub = activity.full_name + '    执行网关应用设备' + data.data.cmd + '指令'
            } else if (data.channel === 'output') {
                sub = activity.full_name + '    操作网关设备应用' + data.data.output + '数据输出'
            } else if (data.action === 'Delete') {
                sub = activity.full_name + '    删除了一台网关'
            } else if (data.action === 'Add') {
                sub = activity.full_name + '    增加了一台网关'
            } else {
                sub = JSON.stringify(data)
            } //output
        } else {
            sub = JSON.stringify(data)
        }
        return sub
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
            url: '/api/platform_activities_lists',
            method: 'GET',
            params: params
        }).then(res=>{
            let data = [];
            let unconfirmed = 0;
            let message_count = 0;
            if (res.data.ok === true) {
                let sourceData = res.data.data.list
                message_count = res.data.data.count
                //console.log(sourceData)
                sourceData && sourceData.length > 0 && sourceData.map((v)=>{
                    if (v.disposed === 0) {
                        unconfirmed++
                    }
                    let obj = JSON.parse(v.message);
                    let sub = obj ? this.generateTitle(v, obj) : 'UNKNOWN TITLE'
                    let op = ''
                    if (v.operation === 'Owner') {
                        op = '设备维护'
                    } else if (v.operation === 'Action') {
                        op = '设备操作'
                    } else if (v.operation === 'Status') {
                        op = '设备状态'
                    }
                    data.push({
                        title: sub,
                        device: v.device,
                        creation: v.creation.split('.')[0],
                        operation: v.operation,
                        operation_str: op,
                        disposed: v.disposed,
                        name: v.name,
                        status: v.status,
                        message: v.message,
                        user: v.user,
                        fullName: v.full_name,
                        disposed_by: v.disposed_by

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
            }, () => {
                this.filterMessages()
            });
        });
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
        const { filterColumn, allData, filterType, filterText } = this.state
        let newAllData = []
        allData.map( (v) => {
            if (filterType !== '' && v.operation !== filterType) {
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
                        v.message.toLowerCase().indexOf(text) !== -1) {
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
    refresh = ()=>{
        this.setState({
            sync: true
        }, ()=>{
            this.fetchAll()
        })
    };

    render () {
        const { selectedRowKeys, columns, showUnDisposed,
            messageCount, unconfirmed } = this.state;
        const rowSelection = {
            selectedRowKeys,
            onChange: this.onSelectChange
        };
        return (
            <div className="platformEvents">
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
                        <span>类型：</span>
                        <Select
                            value={this.state.filterType}
                            style={{ width: 120 }}
                            onChange={this.onTypeChange}
                        >
                            <Option value="">全部</Option>
                            <Option value="Owner">设备维护</Option>
                            <Option value="Action">设备操作</Option>
                            <Option value="Status">设备状态</Option>
                        </Select>
                        <span style={{padding: '0 1px'}} />
                        <Select
                            value={`${this.state.limitLength}`}
                            style={{ width: 100 }}
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
                            <Option value="72">72小时</Option>
                            <Option value="168">一周</Option>
                        </Select>
                        <span style={{padding: '0 1px'}} />
                        <InputGroup
                            compact
                        >
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
                            <SonTable
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
export default PlatformEvents;