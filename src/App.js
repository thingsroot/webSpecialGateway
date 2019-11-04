import React, { PureComponent } from 'react'
import { Route, Switch, withRouter } from 'react-router-dom';
import './App.scss';
import Login from './router/Login';
import Index from './components/Index';
import PrivateRoute from './components/PrivateRoute';
class App extends PureComponent {
    render () {
        return (
            <div className="wrapper">
                <Switch>
                    <Route path="/login"
                        component={Login}
                    />
                    <PrivateRoute
                        path="/"
                        component={Index}
                    />
                </Switch>
            </div>
        )
    }
}
export default withRouter(App)