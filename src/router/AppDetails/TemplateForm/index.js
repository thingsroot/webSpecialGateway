import React, { Component } from 'react';
import {
    Modal, Form, Input, Radio, message
} from 'antd';
import http from '../../../utils/Server';
import {inject, observer} from 'mobx-react';

const TemplateForm = Form.create({ name: 'template_form' })(
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
            const form = this.props.form;
            form.validateFields((err, values) => {
                if (err) {
                    return;
                }
                let params = {
                    app: this.props.app,
                    conf_name: values.conf_name,
                    description: values.description,
                    type: 'Template',
                    public: values.public,
                    owner_type: values.owner_type
                };
                if (params.owner_type === 'User') {
                    params['owner_id'] = this.props.store.session.user_id
                } else {
                    if (this.state.userGroups.length < 0) {
                        return;
                    }
                    params['owner_id'] = this.state.userGroups[0].name
                }
                console.log(params);
                http.post('/api/configurations_create', params).then(res=>{
                    if (res.ok === false) {
                        message.error('创建应用模板失败！');
                    } else {
                        message.success('创建应用模板成功！');
                        this.props.onSuccess(res.data)
                    }
                });

                setTimeout(()=>{
                    this.props.onOK();
                    form.resetFields();
                }, 500)
            });
        };

        render () {
            const { visible, onCancel, form, onSuccess } = this.props;
            onSuccess;
            const { getFieldDecorator } = form;
            return (
                <Modal
                    visible={visible}
                    title="新建模板"
                    okText="确定"
                    cancelText="取消"
                    maskClosable={false}
                    onCancel={onCancel}
                    onOk={this.onCreate}
                >
                    <Form layout="vertical">
                        <Form.Item label="模板名称">
                            {getFieldDecorator('conf_name', {
                                rules: [{ required: true, message: '请填写模板名称!' }]
                            })(
                                <Input type="text"/>
                            )}
                        </Form.Item>
                        <Form.Item label="描述">
                            {getFieldDecorator('description', {
                                rules: [{ required: true, message: '请填写描述信息!' }]
                            })(
                                <Input type="textarea" />
                            )}
                        </Form.Item>
                        <Form.Item
                            className="collection-create-form_last-form-item"
                            label="权限"
                        >
                            {getFieldDecorator('owner_type', {
                                initialValue: 'User'
                            })(
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
                            {getFieldDecorator('public', {
                                initialValue: '0'
                            })(
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
export default TemplateForm;