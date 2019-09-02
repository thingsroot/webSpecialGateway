import React, { PureComponent } from 'react';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';
import { isAuthenticated } from '../../utils/Session';
import './login.scss'
import Background from '../../assets/images/background.png';
import Sign from './sign'
import Register from './register'
import Retrieve from './retrieve'
import Password from './password'

var sectionStyle = {
    posation: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundImage: `url(${Background})`,
    backgroundSize: '100% 100%'
};
@withRouter
class Login extends PureComponent {

    componentDidMount () {
        if (isAuthenticated()){
            this.props.history.push('/')
        }
    }
    render () {
        const { path } = this.props.match;
        return (
            <div className="login"
                style={sectionStyle}
            >
                <div className="header">
                    <p>
                        <img src=""
                            alt=""
                        />
                        <span>冬笋云</span>
                    </p>
                </div>
                <div className="main">
                    <div className="tabs">
                        <Switch>
                            <Route path={`${path}/sign`}
                                component={Sign}
                                exact
                            />
                            <Route path={`${path}/register`}
                                component={Register}
                                exact
                            />
                            <Route path={`${path}/retrieve`}
                                component={Retrieve}
                                exact
                            />
                            <Route path={`${path}/password`}
                                component={Password}
                                exact
                            />
                            <Redirect
                                from={'/login'}
                                to={`${path}/sign`}
                            />
                        </Switch>
                    </div>
                </div>
            </div>
        );
    }
}
export default Login;