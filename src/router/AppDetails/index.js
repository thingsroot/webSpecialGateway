import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Icon, Tabs, message } from 'antd';
import './style.scss';
import http from '../../utils/Server';
import VersionList from './VersionList';
import TemplateList from './TemplateList';
import AppDescription from './Description';
import {inject, observer} from 'mobx-react';

const TabPane = Tabs.TabPane;
const block = {
    display: 'inline-block',
    margin: '0 10px',
    textDecoration: 'none'
};
const none = {
    display: 'none'
};
@withRouter
@inject('store')
@observer
class AppDetails extends Component {
    state = {
        user: '',
        app_info: '',
        versionList: [],
        versionLatest: 0,
        time: '',
        app: '',
        desc: '',
        groupName: '',
        newTemplateVisiable: false,
        name: ''
    };
    UNSAFE_componentWillMount () {
        this.setState({
            name: this.props.match.params.name.replace(/\*/g, '/')
        })
    }
    componentDidMount (){
        this.loadApp(this.state.name)
    }
    UNSAFE_componentWillReceiveProps (nextProps){
        if (nextProps.location.pathname !== this.props.location.pathname){
            this.loadApp(this.state.name)
        }
    }
    loadApp = (name) => {
        let user = this.props.store.session.user_id;
        let app = name ? name : this.state.name;
        let action = this.props.match.params.action ? this.props.match.params.action : 'description'
        if (action === 'new_template') {
            this.setState( {activeKey: 'templates', newTemplateVisiable: true} )
        } else {
            this.setState( {activeKey: action})
        }
        this.setState({
            user: user,
            app: app
        }, ()=>{
            this.getDetails();
        })
    }
    getDetails = ()=>{
        const {name} = this.state;
        http.get('/api/applications_read?app=' + name).then(res=>{
            if (res.data.data.name.indexOf('/') !== -1) {
                res.data.data.name = res.data.data.name.replace(/\//g, '*')
            }
            if (!res.ok) {
                message.error('无法获取应用信息')
                this.props.history.push('/myapps')
                return
            }

            this.setState({
                app_info: res.data.data,
                versionList: res.data.versionList,
                versionLatest: res.data.versionLatest,
                desc: res.data.data.description,
                time: res.data.data.modified.substr(0, 11)
            });
            sessionStorage.setItem('app_name', res.data.data.app_name);
        });
    };
    updateVersionList = ()=> {
        http.get('/api/versions_list?app=' + this.state.name).then(res=>{
            if (res.ok && res.data) {
                this.setState({
                    versionList: res.data
                })
            }
        });
    }
    callback = (key)=>{
        this.setState({activeKey: key})
    };
    render () {
        let { app, app_info, time, user, desc } = this.state;
        return (
            <div className="myAppDetails">
                <div className="header">
                    <span><Icon type="appstore" />{app_info.app_name}</span>
                    <span
                        onClick={()=>{
                            this.props.history.go(-1)
                        }}
                    >
                    <Icon type="rollback"/></span>
                </div>
                <div className="details">
                    <div className="appImg">
                        <img
                            src={`/store_assets${app_info.icon_image}`}
                            alt="图片"
                        />
                    </div>
                    <div className="appInfo">
                        <p className="appName">{app_info.app_name}</p>
                        <p className="info">
                            <span>    发布者：{app_info.owner}</span>
                            <span>创建时间：{time}</span><br/>
                            <span>应用分类：{app_info.category === null ? '----' : app_info.category}</span>
                            <span>通讯协议：{app_info.protocol === null ? '----' : app_info.protocol}</span><br/>
                            <span>适配型号：{app_info.device_serial === null ? '----' : app_info.device_serial}</span>
                            <span>设备厂商：{app_info.device_supplier === null ? '----' : app_info.device_supplier}</span>
                        </p>
                    </div>
                    <div className="btnGroup">

                        <Link
                            className="button"
                            style={app_info.owner === user ? block : none}
                            to={`/appedit/${app_info.name}`}
                        >
                            <Icon type="setting" />
                            设置
                        </Link>
                        <Link
                            className="button"
                            style={app_info.owner === user ? block : none}
                            to={`/appeditorcode/${app_info.name}/${app_info.app_name}`}
                        >
                            <Icon type="edit" />
                            代码编辑
                        </Link>
                        {
                            this.props.store.gatewayList.FirstGateway
                                ? <Link
                                    className="button"
                                    to={`/appsinstall/${this.props.store.gatewayList.FirstGateway.sn}/${app_info.name}/install`}
                                >
                                    <Icon type="download" />
                                    安装此应用
                                </Link> : ''
                        }
                        <Link
                            className="button"
                            style={app_info.fork_from ? block : none}
                            to={`/appdetails/${app_info.fork_from}`}
                        >
                            <Icon type="share-alt" />
                            分支
                        </Link>
                    </div>
                </div>
                <Tabs
                    onChange={this.callback}
                    type="card"
                    activeKey={this.state.activeKey}
                >
                    <TabPane
                        tab="描述"
                        key="description"
                    >
                        <AppDescription source={desc}/>
                    </TabPane>
                    <TabPane
                        tab="版本列表"
                        key="versions"
                    >
                        <VersionList
                            app={app}
                            initialVersion={this.state.versionLatest}
                            dataSource={this.state.versionList}
                            onUpdate={this.updateVersionList}
                            user={app_info.owner === user ? true : false}
                        />
                    </TabPane>
                    <TabPane
                        tab="模板列表"
                        key="templates"
                    >
                        <TemplateList
                            app={app}
                            newTemplateVisiable={this.state.newTemplateVisiable}
                        />
                    </TabPane>
                </Tabs>

            </div>
        );
    }
}

export default AppDetails;