import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { inject, observer} from 'mobx-react';
import http from '../../../../utils/Server';
import {Table, Button, Modal, Input, message, notification, Tooltip} from 'antd';
import './style.scss';

function formatTime (date, fmt) {
    var o = {
        'M+': date.getMonth() + 1,     //月份
        'd+': date.getDate(),     //日
        'h+': date.getHours(),     //小时
        'm+': date.getMinutes(),     //分
        's+': date.getSeconds(),     //秒
        'q+': Math.floor((date.getMonth() + 3) / 3), //季度
        'S': date.getMilliseconds()    //毫秒
    }
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
        }
    }
    return fmt;
}

const openNotification = (title, message) => {
    notification.open({
        message: title,
        description: message,
        placement: 'buttonRight'
    });
};
const { TextArea } = Input;

@withRouter
@inject('store')
@observer
class CommandList extends Component {
    state = {
        data: [],
        visible: false,
        record: {},
        value: '{}',
        columns: [{
            title: '名称',
            render: (record)=>{
                return (
                    <Tooltip placement="topLeft"
                        title={record.name}
                    >
                        {record.name}
                    </Tooltip>
                )
            }
        }, {
            title: '描述',
            render: (record)=>{
                return (
                    <Tooltip placement="topLeft"
                        title={record.desc}
                    >
                        {record.desc}
                    </Tooltip>
                )
            }
        }, {
            title: '下置反馈',
            render: (record)=>{
                return (
                    <Tooltip placement="topLeft"
                        title={record.result}
                    >
                        {record.result}
                    </Tooltip>
                )
            }
        }, {
            title: '反馈时间',
            width: '130px',
            dataIndex: 'result_tm'
        }, {
            title: '触发时间',
            width: '130px',
            dataIndex: 'action_tm'
        }, {
            title: '操作',
            width: '100px',
            render: (record)=>{
                return (
                    <Button
                        disabled={!this.props.store.gatewayInfo.actionEnable}
                        onClick={()=>{
                        this.showModal(record)
                    }}
                    >发送</Button>
                )
            }
        }]
    }
    componentDidMount (){
        this.setState({data: this.props.commands})

        const { regFilterChangeCB } = this.props;
        if (regFilterChangeCB) {
            regFilterChangeCB(()=>{
                this.applyFilter()
            })
        }
    }

    applyFilter = ()=>{
        const { filterText, commands } = this.props;
        let newData = [];
        commands && commands.length > 0 && commands.map((item)=>{
            if (item.name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1 ||
                (item.desc && item.desc.toLowerCase().indexOf(filterText.toLowerCase()) !== -1) ) {
                newData.push(item)
            }
        });
        this.setState({data: newData})
    }

    showModal = (record) => {
        this.setState({
            record: record,
            visible: true
        });
    }
    inputChange = (e)=>{
        let value = e.target.value;
        this.setState({value})
    }
    handleOk = () => {
        const { sn, vsn } = this.props;
        const { record, value } = this.state;
        const id = `send_command/${sn}/${vsn}/${record.name}/${new Date() * 1}`
        let param = undefined;
        try {
            param = JSON.parse(value);
        } catch (e) {
            message.error('请输入合法的JSON字符串! ' + e)
            return;
        }
        let params = {
            gateway: sn,
            name: vsn,
            command: record.name,
            param: param,
            id: id
        };
        let command_record = record;
        http.post('/api/gateways_dev_commands', params).then(res=>{
            if (res.ok && res.data === id){
                openNotification('提交设备指令成功', '网关:' + sn + '\n设备:' + vsn + '\n参数:' + value);
                command_record.action_tm = formatTime(new Date(), 'hh:mm:ss S')
                this.props.store.action.pushAction(res.data, '设备指令执行', '', params, 10000, (result, data)=>{
                    if (result) {
                        command_record.result = '下置成功'
                        command_record.result_tm = formatTime(new Date(data.timestamp * 1000), 'hh:mm:ss S')
                    } else {
                        command_record.result = data.message
                        command_record.result_tm = formatTime(new Date(data.timestamp * 1000), 'hh:mm:ss S')
                    }
                })
            } else {
                message.error(res.error)
            }
        }).catch(req=>{
            req;
            message.error('发送请求失败')
        })
        this.setState({
            visible: false
        });
    }
    handleCancel = () => {
        this.setState({
            visible: false
        });
    }
    render () {
        const { data, record, columns, visible } = this.state;
        return (
            <div>
                <Table
                    bordered
                    rowKey="name"
                    rowClassName={(record, index) => {
                        let className = 'light-row';
                        if (index % 2 === 0) {
                            className = 'dark-row';
                        }
                        return className;
                    }}
                    columns={columns}
                    dataSource={data ? data : []}
                />
                <Modal
                    title="设备指令"
                    visible={visible}
                    okText="确定"
                    cancelText="取消"
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                >
                    <p className="flex">指令名：
                        <Input
                            readOnly
                            value={record.name}
                        />
                    </p>
                    <p className="flex">参数：
                        <TextArea
                            rows={4}
                            defaultValue={'{\n}'}
                            onChange={this.inputChange}
                        />
                    </p>
                </Modal>
            </div>
        );
    }
}

export default CommandList;