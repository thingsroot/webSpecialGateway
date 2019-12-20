import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import {notification } from 'antd';
import { Switch, withRouter} from 'react-router-dom';
import LoadableComponent from '../../utils/LoadableComponent';
import PrivateRoute from '../PrivateRoute';
import { doUpdate } from '../../utils/Action';
import { isDeveloper } from '../../utils/Session'
const AppDetails = LoadableComponent(()=>import('../../router/AppDetails'));
const GatewayList = LoadableComponent(()=>import('../../router/GatewayList'));
const UserSettings = LoadableComponent(()=>import('../../router/UserSettings'));
const Gateway = LoadableComponent(()=>import('../../router/Gateway'));
const AppsInstall = LoadableComponent(()=>import('../../router/AppsInstall'));
const TemplateDetails = LoadableComponent(()=>import('../../router/TemplateDetails'));

let timer;
const openNotification = (title, message) => {
    notification.open({
        message: title,
        description: message,
        placement: 'buttonRight'
    });
};

@inject('store')
@observer
class ContentMain extends Component {
    componentDidMount (){
        this.startTimer()

        // Make sure we have the csrf_token
        // refreshToken()

        isDeveloper()
    }
    componentWillUnmount (){
        clearInterval(timer);
    }
    startTimer (){
       timer = setInterval(() => {
            let action_store = this.props.store.action;
            const { actions } = this.props.store.action;
            doUpdate(actions, function (action, status, data){
                action_store.setActionStatus(action.id, status, data.message)
                if (status === 'done') {
                    openNotification(action.title + '成功', data.message)
                }
                if (status === 'failed') {
                    openNotification(action.title + '失败', data.message)
                }
                if (status === 'timeout') {
                    openNotification(action.title + '超时', data.message)
                }
            })
        }, 1000);
    }
    render (){
        return (
            <Switch>
                <PrivateRoute
                    path="/gateways"
                    component={GatewayList}
                    title={'我的网关'}
                />
                <PrivateRoute
                    path="/gateway/:sn"
                    component={Gateway}
                    title={'网关详情'}
                />
                 <PrivateRoute
                     path="/appdetails/:name/:action?"
                     component={AppDetails}
                     title={'应用详情'}
                 />
                <PrivateRoute
                    path="/appsinstall/:sn/:app?/:step?"
                    component={AppsInstall}
                    title={'安装应用'}
                />
                <PrivateRoute
                    path="/template/:app/:name/:version?/:action?"
                    component={TemplateDetails}
                    title={'模板详情'}
                />
                <PrivateRoute
                    path="/account"
                    component={UserSettings}
                    title={'用户信息'}
                />
                <PrivateRoute
                    path="/"
                    component={GatewayList}
                    title={'我的网关'}
                />
            </Switch>
        );
    }
}

export default withRouter(ContentMain);