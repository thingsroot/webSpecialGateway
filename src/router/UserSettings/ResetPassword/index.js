import React, { PureComponent } from 'react';
import {
    Modal, Form, Input
} from 'antd';
import http from '../../../utils/Server';

const ResetPasswordCreateForm = Form.create({ name: 'resetPassword' })(
    class extends PureComponent {
        state = {
            oldPassword: '',
            num: '',
            newPassword: ''
        };

        render () {
            const {
                visible, onCancel, onCreate, form
            } = this.props;
            const { getFieldDecorator } = form;
            //旧密码验证
            const verifyPassword = (rule, value, callback) => {
                http.post('/apis/api/method/iot_ui.iot_api.verify_password', {password: value})
                    .then(res=> {
                        res;
                        callback()
                    })
                    .catch(err=>{
                        err;
                        callback('旧密码不正确！')
                    })
                // callback(value)
            };
            //  密码验证
            const passwordValidator = (rule, value, callback) => {
                const { getFieldValue } = this.props.form;
                if (value && value !== getFieldValue('password')) {
                    callback('两次输入不一致！')
                }
                callback();
            };

            return (
                <Modal
                    visible={visible}
                    title="修改密码"
                    okText="确定"
                    cancelText="取消"
                    onCancel={onCancel}
                    onOk={onCreate}
                >
                    <Form layout="vertical">
                        <Form.Item label="旧密码">
                            {getFieldDecorator('oldPassword', {
                                rules: [{ required: true, message: '不能为空' }, {
                                    validator: verifyPassword
                            }]
                            })(
                                <Input type="password"/>
                            )}
                        </Form.Item>
                        <Form.Item label="新密码">
                            {getFieldDecorator('password', {
                                rules: [{ required: true, message: '请输入密码!' }, {
                                    pattern: /^(?![a-zA-z]+$)(?!\d+$)(?![!@_#$%^&*]+$)[a-zA-Z\d!_@#$%^&*]{6,12}$/,
                                    message: '长度最低6位，密码须包含字母，数字或特殊字符'
                                }]
                            })(
                                <Input
                                    type="password"
                                />
                            )}
                        </Form.Item>
                        <Form.Item label="确认新密码">
                            {getFieldDecorator('passwordComfire', {
                                rules: [{ required: true, message: '请再次输入密码!' }, {
                                    validator: passwordValidator
                                }]
                            })(
                                <Input
                                    type="password"
                                />
                            )}
                        </Form.Item>
                    </Form>
                </Modal>
            );
        }
    }
);
export default ResetPasswordCreateForm;
