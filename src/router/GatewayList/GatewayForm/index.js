import React, { Component } from 'react';
import http from '../../../utils/Server';
import {  Button, message, Modal, Input, Select } from 'antd';
import { inject, observer } from 'mobx-react';

@inject('store')
@observer
class GatewayForm extends Component {
    constructor (props){
        super(props)
        this.state = {
            sn: '',
            dev_name: '',
            description: '',
            longitude: '116.3252',
            latitude: '40.045103',
            owner_type: 'User',
            owner_id: '',
            loading: false
        }
    }
    componentDidMount (){
        if (this.props.type !== 'create' && this.props.gatewayInfo && this.state.sn !== this.props.gatewayInfo.sn) {
            this.setState({
                sn: this.props.gatewayInfo.sn,
                dev_name: this.props.gatewayInfo.dev_name,
                description: this.props.gatewayInfo.description,
                longitude: this.props.gatewayInfo.longitude,
                latitude: this.props.gatewayInfo.latitude,
                owner_type: this.props.gatewayInfo.owner_type,
                owner_id: this.props.gatewayInfo.owner_id
           })
        }
    }
    UNSAFE_componentWillReceiveProps (nextProps){
        if (this.props.type !== 'create' && nextProps.gatewayInfo && this.state.sn !== nextProps.gatewayInfo.sn) {
            this.setState({
                sn: nextProps.gatewayInfo.sn,
                dev_name: nextProps.gatewayInfo.dev_name,
                description: nextProps.gatewayInfo.description,
                longitude: nextProps.gatewayInfo.longitude,
                latitude: nextProps.gatewayInfo.latitude,
                owner_type: nextProps.gatewayInfo.owner_type,
                owner_id: nextProps.gatewayInfo.owner_id
            })
        }
    }
    onChanges = (e, type) => {
        const events = e || event;
        const value = events.target.value.trim()
        this.setState({
            [type]: value,
            record: {...this.state.record, [type]: value}
        })
    }
    handleOk = () => {
        const { sn, dev_name, description, longitude, latitude, owner_type, owner_id } = this.state;
        if (sn === '') {
            message.error('请填写网关序列号')
            return
        }
        if (dev_name === '') {
            message.error('请填写网关名称')
            return
        }
        if (description === '') {
            message.error('请填写网关描述')
            return
        }
        const {user_groups} = this.props;
        const data = {
            'name': sn,
            'dev_name': dev_name,
            'description': description,
            'longitude': longitude,
            'latitude': latitude,
            'owner_type': user_groups.length === 0 ? 'User' : owner_type,
            'owner_id': user_groups.length === 0 ? this.props.store.session.user_id : owner_id
        };
        this.setState({
            loading: true
        }, ()=>{
            if (this.props.type === 'create'){
                http.post('/api/gateways_create', data).then(res=>{
                    this.setState({loading: false})
                    if (res.ok) {
                        message.success('添加成功')
                        this.props.onOK()
                    } else {
                        message.error(res.error)
                    }
                })
            } else {
                http.post('/api/gateways_update', data).then(res=>{
                    this.setState({loading: false})
                    if (res.ok) {
                        message.success('更改成功')
                        this.props.onOK()
                    } else {
                        message.error(res.error)
                    }
                })
            }
        });
    }
    handleCancel = (name) => {
        this.setState({
            [name]: false
        });
    }
    render (){
        const { sn, dev_name, description, longitude, latitude, owner_type, owner_id, loading } = this.state;
        owner_id;
        const {type, gatewayInfo, visible, user_groups, onOK, onCancel} = this.props;
        onOK, gatewayInfo;
        return (
            <Modal
                title={type === 'create' ? '添加网关' : '网关设置'}
                visible={visible}
                // okText="确定"
                // cancelText="取消"
                maskClosable={false}
                onOk={()=>{
                    this.handleOk('create')
                }}
                onCancel={onCancel}
                confirmLoading={loading}
            >
                <div className="inputs">
                    <span>序号：</span>
                    <Input
                        value={sn}
                        placeholder="必填"
                        disabled={type !== 'create'}
                        onChange={(e)=>{
                            this.onChanges(e, 'sn')
                        }}
                    />
                </div>
                <div className="inputs">
                    <span>名称：</span>
                    <Input
                        value={dev_name}
                        placeholder="必填"
                        onChange={(e)=>{
                            this.onChanges(e, 'dev_name')
                        }}
                    />
                </div>
                <div className="inputs">
                    <span>描述：</span>
                    <Input
                        value={description}
                        placeholder="选填"
                        onChange={(e)=>{
                            this.onChanges(e, 'description')
                        }}
                    />
                </div>
                <div className="inputs">
                    <span>经度：</span>
                    <Input
                        value={longitude}
                        placeholder="选填"
                        onChange={(e)=>{
                            this.onChanges(e, 'longitude')
                        }}
                    />
                </div>
                <div className="inputs">
                    <span>纬度：</span>
                    <Input
                        value={latitude}
                        placeholder="选填"
                        onChange={(e)=>{
                            this.onChanges(e, 'latitude')
                        }}
                    />
                </div>
                <div className="inputs"
                    style={{ display: user_groups.length !== 0 ? 'block' : 'none' }}
                >
                    <span>所属：</span>
                    <div>
                        <Button
                            type={owner_type !== 'User' ? 'primary' : ''}
                            onClick={()=>{
                                this.setState({
                                    owner_type: 'Cloud Company Group',
                                    owner_id: user_groups[0].name
                                })
                            }}
                        >公司</Button>
                        <Button
                            type={owner_type === 'User' ? 'primary' : ''}
                            onClick={()=>{
                                this.setState({
                                    owner_type: 'User',
                                    owner_id: this.props.store.session.user_id
                                })
                            }}
                        >个人</Button>
                    </div>
                </div>
                <div className="inputs"
                    style={{ display: owner_type !== 'User' ? 'block' : 'none' }}
                >
                    <span>组名：</span>
                    <Select
                        style={{width: '100%'}}
                        disabled
                        value={user_groups.length > 0 ? user_groups[0].name : ''}
                    >
                    </Select>
                </div>
            </Modal>
        );
    }
}
export default GatewayForm;