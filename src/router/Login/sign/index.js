import React, { PureComponent } from 'react';
import { Link, withRouter } from 'react-router-dom';
import {
    Form, Icon, Input, Button, Checkbox, message
} from 'antd';
import http  from '../../../utils/Server';
import { authenticateSuccess } from '../../../utils/Session';

@withRouter
class Sign extends PureComponent {
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                http.postNoToken('/api/user_login', {
                    username: values.userName,
                    password: values.password
                }).then(res=>{
                    if (res.ok) {
                        console.log(res.data)
                        authenticateSuccess(res.data)
                        message.success('登录成功，正在跳转, 请稍后...', 3).then(()=>{
                            //console.log(_getCookie('user_id'))
                            location.href = '/';
                        })
                    } else {
                        message.info('账号密码错误，请重新输入')
                    }
                }).catch(function (error){
                    if (error){
                        message.info('账号密码错误，请重新输入')
                    }
                })
            }
        });
    }
    render () {
        const { getFieldDecorator } = this.props.form;
        return (
            <div>
                <p className="title">密码登录</p>
                <Form onSubmit={this.handleSubmit}
                    className="login-form"
                >
                    <Form.Item>
                        {getFieldDecorator('userName', {
                            rules: [{ required: true, message: '请输入用户名' }]
                        })(
                            <Input prefix={
                                <Icon type="user"
                                    style={{ color: 'rgba(0,0,0,.25)' }}
                                />}
                                placeholder="Username"
                            />
                        )}
                    </Form.Item>
                    <Form.Item>
                        {getFieldDecorator('password', {
                            rules: [{ required: true, message: '请输入密码!' }]
                        })(
                            <Input prefix={
                                <Icon type="lock"
                                    style={{ color: 'rgba(0,0,0,.25)' }}
                                />}
                                type="password"
                                placeholder="Password"
                            />
                        )}
                    </Form.Item>
                    <Form.Item>
                        {getFieldDecorator('remember', {
                            valuePropName: 'checked',
                            initialValue: true
                        })(
                            <Checkbox>记住我！</Checkbox>
                        )}
                        <Link className="login-form-forgot"
                            style={{float: 'right'}}
                            to="/login/retrieve"
                        >忘记密码</Link>
                        <Button type="primary"
                            htmlType="submit"
                            className="login-form-button"
                            style={{width: '100%'}}
                        >登录</Button>
                        <Link to="/login/register"
                            style={{display: 'block', height: '60px', float: 'right'}}
                        >免费注册</Link>
                    </Form.Item>
                </Form>
            </div>

        );
    }
}
export default Form.create({ name: 'normal_login' })(Sign);