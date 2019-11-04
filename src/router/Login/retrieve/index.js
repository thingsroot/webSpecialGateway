import React, { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import {
    Form, Icon, Input, Button, message
} from 'antd';
import http from '../../../utils/Server';
class Retrieve extends PureComponent {
    state = {
        disabled: false
    };
    handleSubmit = (e) => {
        this.setState({
            disabled: true
        })
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            const data = {
                email: values.password
            };
            if (!err) {
                http.post('/api/user_reset_password', data).then(res=>{
                    if (res.error) {
                        if (res.error === 'user_not_found') {
                            message.info('用户不存在')
                            this.setState({
                                disabled: false
                            })
                        }
                    }
                    if (res.ok){
                        if (res.info === 'password_reset_email_sent'){
                            message.info('申请重置成功，请登录邮箱' + values.password + '完成密码重置')
                        }
                    }
                }).catch(function (error){
                    if (error){
                        message.info('提交错误')
                        this.setState({
                            disabled: false
                        })
                    }
                })
            }
        });
    }
    render () {
        const { getFieldDecorator } = this.props.form;
        return (
            <div>
                <p className="title">找回密码</p>
                <Form onSubmit={this.handleSubmit}
                    className="login-form"
                >
                    <Form.Item>
                        {getFieldDecorator('password', {
                            rules: [{ required: true, message: '请输入邮箱!' }, {
                                pattern: /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/,
                                message: '邮箱格式不正确！'
                            }]
                        })(
                            <Input prefix={
                                <Icon type="mail"
                                    style={{ color: 'rgba(0,0,0,.25)' }}
                                />}
                                placeholder="email"
                            />
                        )}
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="login-form-button"
                            style={{width: '100%'}}
                            disabled={this.state.disabled}
                        >
                            {this.state.disabled ? '已发送' : '确定'}
                        </Button>
                        <Link to="/login"
                            style={{display: 'inlineBlock', width: '91%', height: '60px', float: 'left'}}
                        >返回</Link>
                        <Link to="/login/register"
                            style={{display: 'inlineBlock', width: '9%', height: '60px', float: 'right'}}
                        >注册</Link>
                    </Form.Item>
                </Form>
            </div>
        );
    }
}
export default Form.create({ name: 'normal_retrieve' })(Retrieve);