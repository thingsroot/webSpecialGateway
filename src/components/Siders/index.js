import React, { PureComponent } from 'react';
import { Menu, Icon } from 'antd';
import { Link, withRouter } from 'react-router-dom';
const maxSider = {
    width: '200px',
    height: '100%',
    backgroundColor: '#001529',
    zIndex: 1999,
    transition: 'background 0.3s, left 0.2s'
};
const minSider = {
    width: '80px',
    height: '100%',
    backgroundColor: '#001529',
    zIndex: 1999,
    transition: 'background 0.3s, left 0.2s'
}
@withRouter
class Siders extends PureComponent {
    constructor (props){
        super(props)
        this.state = {
            collapsed: this.props.collapsed,
            key: '1'
        }
    }
    UNSAFE_componentWillMount () {
        const pathname = this.props.location.pathname.toLowerCase();
        if (pathname.indexOf('/gateways') !== -1){
            this.setState({
                key: '2'
            })
        }
    }
    UNSAFE_componentWillReceiveProps (props){
        this.setState({
            collapsed: props.collapsed
        })
    }
    render (){
        return (
            <div className="siders"
                style={this.props.collapsed ? minSider : maxSider}
            >
                {
                    !this.props.collapsed
                        ? <div className="logo"
                            style={{width: '200px',
                                transition: 'background 0.3s, width 0.2s'}}
                          >
                              <b>冬笋云</b>
                          </div>
                        : <div className="logo"
                            style={{width: '80px',
                                transition: 'background 0.3s, width 0.2s'}}
                          >
                              <b>冬</b>
                          </div>
                }
                <Menu theme="dark"
                    mode="inline"
                    defaultSelectedKeys={[this.state.key]}
                >
                    <Menu.Item key="2">
                    <Link to="/gateways">
                        <Icon type="laptop" />
                        <span>我的网关</span>
                    </Link>
                    </Menu.Item>
                </Menu>
            </div>
        );
    }
}
export default Siders;