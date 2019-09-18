import React, { PureComponent } from 'react';
import { Icon, message, Menu, Dropdown } from 'antd';
import { withRouter} from 'react-router-dom';
import { _getCookie, isAuthenticated, authenticateClear } from '../../utils/Session';
import http  from '../../utils/Server';

@withRouter
class HeaderBar extends PureComponent {
    UNSAFE_componentWillReceiveProps () {
        if (!isAuthenticated()) {
            this.props.history.push('/login')
        }
    }
    render () {
        const menu1 = (
            <Menu>
                <Menu.Item
                    key="16"
                    style={{lineHeight: '30px'}}
                    onClick={
                        ()=>{
                            window.open('http://help.cloud.thingsroot.com/quick_start/', '_blank')
                        }
                    }
                >
                    <Icon type="monitor" />
                    <span>
                        快速指南
                    </span>
                </Menu.Item>
                <Menu.Item
                    key="16"
                    style={{lineHeight: '30px'}}
                    onClick={
                        ()=>{
                            window.open('http://help.cloud.thingsroot.com/app_api_book/', '_blank')
                        }
                    }
                >
                    <Icon type="read" />
                    <span>
                        应用开发手册
                    </span>
                </Menu.Item>

            </Menu>
        )
        const menu = (
            <Menu style={{width: 160}}>
                <Menu.Item
                    key="12"
                    style={{lineHeight: '30px'}}
                    onClick={
                        ()=>{
                            window.location.href = '/account'
                        }
                    }
                >
                    <Icon type="setting"/>
                    <span>
                        个人设置
                    </span>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                    key="15"
                    style={{lineHeight: '30px'}}
                    onClick={()=>{
                        http.post('/api/user_logout').then(res=>{
                            res;
                            authenticateClear();
                            message.success('退出成功,即将跳转至登录页', 1.5).then(()=>{
                                location.href = '/'
                            })
                        }).catch(err=>{
                            err;
                            message.error('退出失败!!')
                        });
                    }}
                >
                    <Icon type="poweroff" />
                    <span>
                        退出登录
                    </span>
                </Menu.Item>
            </Menu>
        );
        return (
            <div className="headerUser">
                <Dropdown
                    overlay={menu1}
                    placement="bottomRight"
                >
                    <span
                        className="ant-dropdown-link"
                        style={{padding: '10px', cursor: 'pointer'}}
                    >
                        <Icon type="question-circle" />
                    </span>
                </Dropdown>
                <span style={{padding: '0 5px'}}> </span>
                <a onClick={()=>{
                    window.open('https://freeioe.org/', '_blank')
                }}
                >
                    <Icon
                        style={{padding: '0 4px', fontWeight: 800}}
                        type="message"
                    />

                    讨论
                </a>
                <span style={{padding: '0 5px'}}> </span>
                <Dropdown
                    overlay={menu}
                    placement="bottomRight"
                    style={{marginRight: 20}}
                >
                    <span
                        className="ant-dropdown-link"
                        style={{padding: '10px', cursor: 'pointer'}}
                    >
                        <Icon type="user"/>
                        {
                            decodeURI(_getCookie('full_name').split(' ')[0])
                        }
                    </span>
                </Dropdown>
            </div>
        );
    }
}
export default HeaderBar;