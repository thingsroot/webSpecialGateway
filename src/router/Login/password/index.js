import React, { PureComponent } from 'react';
import {
    Form, Icon, Input, Button, message
} from 'antd';
import { getParam } from '../../../utils/Session';
import http from '../../../utils/Server';


class Password extends PureComponent {
    componentDidMount (){
        let update_key  = getParam('key');
        if (update_key === null){
            this.props.history.push('/');
        }
    }
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const data = {
                    new_password: values.password,
                    logout_all_sessions: 0,
                    key: getParam('key')
                }
                http.post('/api/user_update_password', data).then(res=>{
                    if (res.message) {
                        if (res.home_page === '/desk' && res.message === '/desk') {
                            message.success(res.full_name + '重置密码成功' + '2秒后返回控制台', 2).then(()=>{
                                this.props.history.push('/');
                            })
                        } else {
                            message.error(res.message + '5秒后返回登录页', 5).then(()=>{
                                this.props.history.push('/login');
                            })
                        }
                    }
                })
            }
        });
    };

    render () {
        const { getFieldDecorator } = this.props.form;
        //  密码验证
        const passwordValidator = (rule, value, callback) => {
            const { getFieldValue } = this.props.form;
            if (value && value !== getFieldValue('password')) {
                callback('两次输入不一致！')
            }

            // 必须总是返回一个 callback，否则 validateFields 无法响应
            callback();
        };
        return (
            <div>
                <p className="title">更新密码</p>
                <Form onSubmit={this.handleSubmit}
                    className="login-form"
                >
                    <Form.Item>
                        {getFieldDecorator('password', {
                            rules: [{ required: true, message: '请输入密码!' }, {
                                pattern: /^(?![a-zA-z]+$)(?!\d+$)(?![!@_#$%^&*]+$)[a-zA-Z\d!_@#$%^&*]{6,12}$/,
                                message: '长度最低6位，密码须包含字母，数字或特殊字符'
                            }]
                        })(
                            <Input prefix={
                                <Icon type="lock"
                                    style={{ color: 'rgba(0,0,0,.25)' }}
                                />}
                                type="password"
                                placeholder="password"
                            />
                        )}
                    </Form.Item>
                    <Form.Item>
                        {getFieldDecorator('passwordcomfire', {
                            rules: [{ required: true, message: '请再次输入密码!' }, {
                                validator: passwordValidator
                            }]
                        })(
                            <Input prefix={
                                <Icon type="lock"
                                    style={{ color: 'rgba(0,0,0,.25)' }}
                                />}
                                type="password"
                                placeholder="password"
                            />
                        )}

                    </Form.Item>
                    <Form.Item>
                        <Button type="primary"
                            htmlType="submit"
                            className="login-form-button"
                            style={{width: '100%'}}
                        >
                            确定
                        </Button>
                        <span
                            style={{display: 'inlineBlock', width: '91%', height: '30px', float: 'left'}}
                        >   </span>
                    </Form.Item>
                </Form>
            </div>
        );
    }
}
export default Form.create({ name: 'normal_password' })(Password);