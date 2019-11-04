import React, { Component } from 'react';
import http from '../../../utils/Server';
import { Table, message, Tooltip, Button, Icon } from 'antd';
import { inject, observer} from 'mobx-react';
import { withRouter } from 'react-router-dom';
import Collapses from './Collapses';
import PropTypes from 'prop-types';

import './style.scss';

import {IconIOT} from '../../../utils/iconfont';

const columns = [{
        title: '名称',
        dataIndex: 'meta.inst',
        key: 'meta.inst',
        className: 'cursor'
    }, {
        title: '描述',
        dataIndex: 'meta.description',
        key: 'meta.description',
        className: 'cursor'
    }, {
        title: '输入/输出',
        dataIndex: 'meta.ioc',
        key: 'meta.ioc',
        className: 'cursor'
    }, {
        title: '设备序列号',
        key: 'meta.sn',
        dataIndex: 'meta.sn',
        width: '30%',
        className: 'cursor'
    }, {
        title: '所属通道',
        key: 'meta.app_inst',
        dataIndex: 'meta.app_inst',
        className: 'cursor'
    }
];

@withRouter
@inject('store')
@observer
class DevicesList extends Component {
    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
    }

    state = {
        data: [],
        loading: true,
        uploadOneShort: false,
        dataSanpshotEnable: true,
        dataFlushEnable: true,
        sign: false,
        gateway: this.props.gateway
    }
    componentDidMount (){
        const { gatewayInfo } = this.props.store;
        this.setState({gateway: this.props.gateway}, ()=>{
            this.setData(gatewayInfo.devices)
            gatewayInfo.setDevicesIsShow(true)
            if (gatewayInfo.devices_count !== 0) {
                this.setState({loading: false})
            }
            this.getData()
            this.timer = setInterval(()=>{
                this.getData();
            }, 3000)

            if (!gatewayInfo.data.data_upload) {
                //message.info('网关未开启数据上送，如需查看数据请手工开启临时数据上传!')
            }
        })
    }
    UNSAFE_componentWillReceiveProps (nextProps){
        if (nextProps.gateway !== this.state.gateway){
            this.setState({
                gateway: nextProps.gateway,
                loading: true
            }, ()=>{
                this.getData();
                const { gatewayInfo } = this.props.store;
                if (!gatewayInfo.data.data_upload && this.state.uploadOneShort) {
                    message.info('网关未开启数据上送，临时开启中!')
                    this.enableDataUploadOneShort(60)
                }
            });
        }
    }
    componentWillUnmount (){
        const { gatewayInfo } = this.props.store;
        clearInterval(this.timer)
        clearInterval(this.one_short_timer)
        gatewayInfo.setDevicesIsShow(false)
    }
    getData (){
        http.get('/api/gateways_dev_list?gateway=' + this.state.gateway).then(res=>{
            if (res.ok) {
                const dev_list = [];
                if (res.data && res.data.length > 0) {
                    res.data.map(item=>{
                        if (item.meta.app_inst.toLowerCase().indexOf('modbus') !== -1) {
                            dev_list.push(item)
                        }
                    })
                }
                this.props.store.gatewayInfo.setDevices(dev_list);
                this.setData(dev_list)
            } else {
                message.error(res.error)
            }
            this.setState({
                loading: false,
                sign: false
            })
        })
    }
    setData (devices) {
        let data = [];
        if (devices && devices.length > 0){
            devices.map((item=>{
                item.meta.ioc = '' + (item.inputs ? item.inputs.length : '0') + '/' + (item.outputs ? Object.keys(item.outputs).length : '0');
                if (item.meta.outputs > 0){
                    item.meta.set_data = true
                }
                item.meta.gateway = this.state.gateway;
                data.push(item);
            }))
        }
        this.setState({
            data: data
        })
    }
    enableDataUploadOneShort (duration) {
        const { gatewayInfo } = this.props.store;
        const { gateway } = this.state;
        if (!gatewayInfo.data.data_upload) {
            let params = {
                name: this.state.gateway,
                duration: duration,
                id: `enable_data_one_short/${gateway}/${new Date() * 1}`
            }
            http.post('/api/gateways_enable_data_one_short', params).then(res => {
                if (!res.ok) {
                    message.error('临时数据上送指令失败:' + res.error)
                }
            }).catch( err => {
                message.error('临时数据上送指令失败:' + err)
            })
        }
    }
    dataSnapshot () {
        http.post('/api/gateways_data_snapshot', {name: this.state.gateway}).then(res => {
            if (res.ok) {
                message.success('请求网关数据数据快照成功')
            } else {
                message.error('请求网关数据数据快照失败:' + res.error)
            }
        }).catch( err => {
            message.error('请求网关数据数据快照失败:' + err)
        })
    }
    dataFlush () {
        http.post('/api/gateways_data_flush', {name: this.state.gateway}).then(res => {
            if (res.ok) {
                message.success('请求网关上送周期内数据成功')
            } else {
                message.error('请求网关上送周期内数据失败:' + res.error)
            }
        }).catch( err => {
            message.error('请求网关上送周期内数据失败:' + err)
        })
    }
    render () {
        let { data, loading } = this.state;
        const { gatewayInfo } = this.props.store;
        return (
            <div>
                <div className="toolbar">
                    <p style={{color: '#ccc'}}>
                        {/* {'数据上送周期: ' + gatewayInfo.data.data_upload_period + ' 毫秒'}
                        <span style={{padding: '0 5px'}}></span>
                        {'全量数据上送周期: ' + gatewayInfo.data.data_upload_cov_ttl + ' 秒'} */}
                        {
                            !gatewayInfo.data.data_upload
                            ? <span style={!gatewayInfo.data.data_upload && this.state.uploadOneShort ? {} : {color: 'red'}}>
                            {
                                this.state.uploadOneShort
                                ? '临时数据上传已开启'
                                : '如要查看设备实时数据，请点击右侧“开启临时数据上传”按钮'
                            }
                            </span>
                            : ''
                        }
                    </p>
                    <p>
                        {
                            gatewayInfo.data.data_upload
                            ? null
                            : <Button
                                type={this.state.uploadOneShort ? 'default' : 'primary'}
                                onClick={
                                    ()=>{
                                        this.setState({uploadOneShort: !this.state.uploadOneShort}, ()=>{
                                            if (!this.state.uploadOneShort){
                                                clearInterval(this.one_short_timer);
                                                this.enableDataUploadOneShort(0)
                                            } else {
                                                this.enableDataUploadOneShort(60)
                                                this.one_short_timer = setInterval(()=>{
                                                    this.enableDataUploadOneShort(60)
                                                }, 55000)
                                            }
                                        })
                                    }
                                }
                              >
                                    <Icon
                                        type={this.state.uploadOneShort ? 'close-circle' : 'play-circle'}
                                        theme="filled"
                                    />{this.state.uploadOneShort ? '停止临时数据上传' : '开启临时数据上传'}
                                </Button>
                        }
                        <Tooltip
                            placement="bottom"
                            title="强制网关上送最新数据"
                        >
                            <Button
                                disabled={!this.state.dataFlushEnable}
                                onClick={()=>{
                                    this.setState({dataFlushEnable: false})
                                    this.dataFlush()
                                    setTimeout(()=>{
                                        this.setState({dataFlushEnable: true})
                                    }, 1000)
                                }}
                            >
                                <IconIOT type="icon-APIshuchu"/>强制刷新
                            </Button>
                        </Tooltip>
                    </p>
                </div>
                <Table
                    columns={columns}
                    dataSource={
                        data && data.length > 0 ? data : []
                    }
                    loading={loading}
                    rowKey={(record, index) => {
                        index;
                        return record.meta.sn
                    }}
                    rowClassName={(record, index) => {
                        let className = 'light-row';
                        if (index % 2 === 0) {
                            className = 'dark-row';
                        }
                        return className;
                    }}
                    onRow={()=>{
                        return {
                            onClick: ()=>{
                                if (!this.state.uploadOneShort && !gatewayInfo.data.data_upload) {
                                    message.info('请开启临时数据上送！')
                                }
                            }
                        }
                    }}
                    expandedRowRender={this.state.uploadOneShort || gatewayInfo.data.data_upload ? Collapses : null}
                    expandRowByClick
                    pagination={false}
                />

            </div>
        );
    }
}

export default DevicesList;