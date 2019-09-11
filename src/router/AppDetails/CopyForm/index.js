import React, { Component } from 'react';
import {
    Modal, Form, Input, Radio, message
} from 'antd';
import http from '../../../utils/Server';
import {inject, observer} from 'mobx-react';

const CopyForm = Form.create({ name: 'copy_form' })(
    @inject('store')
    @observer
    class extends Component {
        state = {
            userGroups: []
        }
        componentDidMount () {
            if (!this.props.store.session.companies) {
                return
            }
            http.get('/api/user_groups_list').then(res=>{
                if (res.ok) {
                    this.setState({ userGroups: res.data})
                } else {
                    message.error('获取用户组失败')
                }
            });
        }
        onCreate = ()=>{
            let conf_name = '';
            const form = this.props.form;
            form.validateFields((err, values) => {
                if (err) {
                    return;
                }
                let params = {
                    name: this.props.conf,
                    app: this.props.app,
                    conf_name: values.conf_name,
                    description: values.description,
                    type: values.type,
                    public: values.public,
                    owner_type: values.owner_type
                };
                if (params.owner_type === 'User') {
                    params['owner_id'] = this.props.store.session.user_id
                } else if (params.owner_type === 'Cloud Company Group') {
                    if (this.state.userGroups.length < 0) {
                        return;
                    }
                    params['owner_id'] = this.state.userGroups[0].name
                }
                if (this.props.type === '复制') {
                    http.post('/api/configurations_create', params).then(res=>{

                        if (res.ok === false) {
                            message.error('复制模板信息失败！');
                        } else {
                            if (this.props.copyData.version !== 0) {
                                let conf_info = res.data;
                                conf_name = res.data.name;
                                let params = {
                                    conf: conf_name,
                                    version: 1,
                                    comment: 'V1',
                                    data: this.props.copyData.data
                                };
                                http.post('/api/configurations_versions_create', params)
                                    .then(res=>{
                                        if (res.ok === true) {
                                            message.success('复制模板内容成功！');
                                        } else {
                                            message.error('复制模板内容失败！');
                                        }
                                        this.props.onSuccess(conf_info)
                                        this.props.onOK();
                                    })
                            }
                            message.success('新版本上传成功！');
                        }
                    });
                } else if (this.props.type === '编辑') {
                    params['name'] = this.props.conf;
                    http.post('/api/configurations_update', params)
                        .then(res=>{
                            if (res.ok) {
                                message.success('更新模板信息成功！');
                                this.props.onOK();
                            } else {
                                message.error('更新模板信息失败！');
                            }
                        });
                }
            });
        };

        render () {
            const {
                type, visible, onCancel, form, copyData
            } = this.props;
            const { getFieldDecorator } = form;
            return (
                <Modal
                    visible={visible}
                    title={type + '模板'}
                    okText="确定"
                    cancelText="取消"
                    maskClosable={false}
                    onCancel={onCancel}
                    onOk={this.onCreate}
                >
                    <Form layout="vertical">
                        <Form.Item label="模板名称">
                            {getFieldDecorator('conf_name', { initialValue: copyData.conf_name }, {
                                rules: [{ required: true, message: '请填写模板名称!' }]
                            })(<Input type="text"/>)}
                        </Form.Item>
                        <Form.Item label="描述">
                            {getFieldDecorator('description', { initialValue: copyData.description }, {
                                rules: [{ required: true, message: '请填写描述信息!' }]
                            })(<Input type="textarea" />)}
                        </Form.Item>
                        <Form.Item
                            className="collection-create-form_last-form-item"
                            label="权限"
                        >
                            {getFieldDecorator('owner_type', { initialValue: copyData.owner_type }
                            )(
                                <Radio.Group>
                                    {this.state.userGroups.length > 0 ? <Radio value="Cloud Company Group">公司</Radio> : ''}
                                    <Radio value="User">个人</Radio>
                                </Radio.Group>
                            )}
                        </Form.Item>
                        <Form.Item
                            className="collection-create-form_last-form-item"
                            label="是否公开"
                        >
                            {getFieldDecorator('public', { initialValue: copyData.public === 0 ? '0' : '1' })(
                                <Radio.Group>
                                    <Radio value="0">不公开</Radio>
                                    <Radio value="1">公开</Radio>
                                </Radio.Group>
                            )}
                        </Form.Item>
                    </Form>
                </Modal>
            );
        }
    }
);
export default CopyForm;
