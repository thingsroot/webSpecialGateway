import React from 'react'
import {
    Button,
    Checkbox,
    Col,
    Divider,
    Form,
    Icon,
    Input,
    InputNumber, message,
    Popconfirm,
    Row,
    Select,
    Upload,
    Modal,
    Result,
    Progress
} from 'antd';
import { inject, observer} from 'mobx-react';
import { withRouter } from 'react-router-dom';
import http from '../../../../utils/Server';
import AddDevList from './Transfer';
import Zip from 'jszip';
import * as saveAs from 'jszip/vendor/FileSaver';
import './style.scss';
const { Option } = Select;
const { confirm } = Modal;
@withRouter
@inject('store')
@observer
class MqttForm extends React.Component {
    constructor (props) {
        super(props)
        this.columns = [
            {
                title: '设备序号',
                dataIndex: 'name',
                width: '60%',
                editable: true
            },
            {
                title: '操作',
                dataIndex: 'operation',
                render: (text, record) =>
                    this.state.dataSource.length >= 1 ? (
                        <Popconfirm
                            title="确定要删除吗?"
                            onConfirm={() => this.handleDelete(record.key)}
                        >
                            <Button type="primary">Delete</Button>
                        </Popconfirm>
                    ) : null
            }
        ]
        this.state = {
            userMessage: '',
            seniorIndeterminate: false, //高级选项
            CustomAuthentication: false, //自定义认证
            visible: false,
            WhetherTheCA: 'true',
            dataSource: [],
            devs: [],
            count: 0,
            number: 0,
            result: false,
            ShowResult: false,
            fileList: [],
            fileList1: [],
            fileList2: [],
            disabled: true,
            serial_opt: {},
            options: {
                enable_data_cache: true,
                data_upload_dpp: 1024,
                period: 60,
                ttl: 300
            },
            mqtt: {
                enable_tls: true,
                password: '',
                port: '',
                server: '',
                tls_cert: '',
                client_cert: '',
                client_key: '',
                username: ''
            },
            has_options_ex: false,
            options_ex: {
                disable_command: false,
                disable_data: false,
                disable_compress: false,
                disable_data_em: false,
                disable_devices: false,
                disable_output: false,
                upload_event: 0
            }
        };
    }
    componentDidMount () {
        this.setPage()
    }
    setPage = () =>{
        if (this.props.pane.conf) {
            const { conf } = this.props.pane;
            this.setState({
                options: conf.options,
                mqtt: conf.mqtt,
                has_options_ex: conf.has_options_ex === 'yes',
                devs: conf.devs ? conf.devs : []
            })
            console.log(this.props)
            if (this.props.pane.status === 'Not installed') {
                this.setState({
                    disabled: false
                })
            }
            if (conf.mqtt.client_cert || conf.mqtt.client_key) {
                this.setState({
                    WhetherTheCA: 'false'
                })
            }
            if (conf.mqtt.username || conf.mqtt.password || conf.mqtt.client_id) {
                this.setState({CustomAuthentication: true})
            }
            if (conf.has_options_ex === 'yes') {
                this.setState({
                    seniorIndeterminate: true
                })
            }
        }
    }
    setSetting = (type, val, name) => {
            if (type !== 'mqttForm') {
                this.setState({
                    [type]: Object.assign({}, this.state[type], {[name]: val})
                })
            } else {
                this.setState({
                    serial_opt: Object.assign({}, this.state.serial_opt, {[name]: val})
                })
            }
    }
    getTextInfo = (file) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = (result) => {
            let targetNum = result.target.result;
            // targetNum = targetNum.replace(/[\n\r]/g, '');
            // targetNum = targetNum.replace(/[ ]/g, '');
           this.setSetting('mqtt', targetNum, 'tls_cert')
        }
        return false;
    };
    getTextInfo1 = (file) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = (result) => {
            let targetNum = result.target.result;
            this.setSetting('mqtt', targetNum, 'client_cert')
        }
        return false;
    };
    getTextInfo2 = (file) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = (result) => {
            let targetNum = result.target.result;
            // targetNum = targetNum.replace(/[\n\r]/g, '');
            // targetNum = targetNum.replace(/[ ]/g, '');
            this.setSetting('mqtt', targetNum, 'client_key')

        }
        return false;
    };
    handleListChange = info => {
        if (info.file.size / 1024 > 8) {
            message.info('大图标不能超过8kb, 请重新上传!');
            this.setState({fileList: []})
            return false
        }
        let fileList = [...info.fileList];
        fileList = fileList.slice(-1);
        fileList = fileList.map(file => {
            if (file.response) {
                file.url = file.response.url;
            }
            return file;
        });
        this.setState({fileList});
    }
    handleListChange1 = info => {
        if (info.file.size / 1024 > 8) {
            message.info('大图标不能超过8kb, 请重新上传!');
            this.setState({fileList1: []})
            return false
        }
        let fileList1 = [...info.fileList];
        fileList1 = fileList1.slice(-1);
        fileList1 = fileList1.map(file => {
            if (file.response) {
                file.url = file.response.url;
            }
            return file;
        });

        this.setState({fileList1});
    }
    handleListChange2 = info => {
        if (info.file.size / 1024 > 8) {
            message.info('大图标不能超过8kb, 请重新上传!');
            this.setState({fileList2: []})
            return false
        }
        let fileList2 = [...info.fileList];
        fileList2 = fileList2.slice(-1);
        fileList2 = fileList2.map(file => {
            if (file.response) {
                file.url = file.response.url;
            }
            return file;
        });

        this.setState({fileList2});
    }
    handleDelete = key => {
        const dataSource = [...this.state.dataSource];
        this.setState({
            dataSource: dataSource.filter(item => item.key !== key)
        })
    };
    remove = targetKey => {
        let {activeKey} = this.state;
        let lastIndex;
        this.state.panes.forEach((pane, i) => {
            if (pane.key === targetKey) {
                lastIndex = i - 1;
            }
        });
        const panes = this.state.panes.filter(pane => pane.key !== targetKey);
        if (panes.length && activeKey === targetKey) {
            if (lastIndex >= 0) {
                activeKey = panes[lastIndex].key;
            } else {
                activeKey = panes[0].key;
            }
        }
        this.setState({panes, activeKey});
    };
    seniorChange = () => {
        this.setState({seniorIndeterminate: !this.state.seniorIndeterminate})
    };

    moreChange () {
        if (this.state.seniorIndeterminate) {
            return (
                        <Form.Item>
                                <Row className="highSenior">
                                    <Col span={24}>
                                        <Checkbox
                                            disabled={this.state.disabled}
                                            value="禁止数据上送"
                                            checked={this.state.options_ex.diable_data}
                                            onChange={(e)=>{
                                                this.setSetting('options_ex', e.target.checked, 'diable_data')
                                            }}
                                        >禁止数据上送：</Checkbox>
                                    </Col>
                                    <Col
                                        span={24}
                                        style={{display: 'flex'}}
                                    >
                                        <span style={{lineHeight: '30px', marginLeft: '6px'}}>事件上送（最小等级）：</span>
                                        <InputNumber
                                            disabled={this.state.disabled}
                                            min={1}
                                            max={100}
                                            defaultValue={this.state.options_ex.upload_event}
                                            onChange={(value)=>{
                                                this.setSetting('options_ex', value, 'upload_event')
                                            }}
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox
                                            checked={this.state.options_ex.disable_output}
                                            disabled={this.state.disabled}
                                            onChange={(e)=>{
                                                this.setSetting('options_ex', e.target.checked, 'disable_output')
                                            }}
                                        >
                                        禁止设备输出：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox
                                            value="禁止设备指令"
                                            checked={this.state.options_ex.diable_command}
                                            disabled={this.state.disabled}
                                            onChange={(e)=>{
                                                this.setSetting('options_ex', e.target.checked, 'diable_command')
                                            }}
                                        >禁止设备指令：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox
                                            value="禁止设备信息上送"
                                            checked={this.state.options_ex.disable_devices}
                                            disabled={this.state.disabled}
                                            onChange={(e)=>{
                                                this.setSetting('options_ex', e.target.checked, 'disable_devices')
                                            }}
                                        >禁止设备信息上送：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox
                                            value="禁止上送紧急数据"
                                            checked={this.state.options_ex.disable_data_em}
                                            disabled={this.state.disabled}
                                            onChange={(e)=>{
                                                this.setSetting('options_ex', e.target.checked, 'disable_data_em')
                                            }}
                                        >禁止上送紧急数据：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox
                                            value="禁止压缩（调试使用"
                                            checked={this.state.options_ex.disable_compress}
                                            disabled={this.state.disabled}
                                            onChange={(e)=>{
                                                this.setSetting('options_ex', e.target.checked, 'disable_compress')
                                            }}
                                        >禁止压缩（调试使用）：</Checkbox>
                                    </Col>
                                </Row>
                        </Form.Item>
            )
        }
    }
    setDevs = (value) =>{
        console.log(value)
        this.setState({
            devs: value
        })
    }
    addaccout = () =>{
        const number = this.state.number;
        if (number <= 89) {
            this.setState({
                number: number + 8
            }, () => {
                setTimeout(() => {
                    this.addaccout()
                }, 200);
            })
        }
    }
    appConf = (status) => {
        if (this.props.pane.status === 'Not installed' && status === 'install') {
            // this.startChannel()
            this.setState({
                pressVisible: true,
                number: 0,
                result: false,
                action: 'install'
            }, ()=>{
                this.addaccout()
            })
            setTimeout(() => {
                this.installMqtt()
            }, 3000);
            return false;
        }
        if (status === 'remove') {
            this.setState({
                pressVisible: true,
                number: 0,
                result: false,
                action: 'remove'
            }, ()=>{
                this.addaccout()
            })
            setTimeout(() => {
                this.uninstall()
            }, 2000);
            return false;
        }
    }
    toggleDisable = () => {
        const regIp =  /^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5]))$/;
        const reg = /(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})/;
        if (regIp.test(this.state.mqtt.server) === false && reg.test(this.state.mqtt.server) === false && !this.state.disabled) {
            message.info('MQTT地址不合法，请重新输入！')
            return false;
        }
        if (this.state.devs.length === 0 && !this.state.disabled) {
            message.info('请选择上传设备后重试！')
            return false;
        }
        console.log(this.state)
        if (this.state.mqtt.enable_tls && !this.state.mqtt.tls_cert && !this.state.disabled) {
            message.info('请先上传CA证书！')
            return false;
        }
        if (!this.state.disabled && this.props.pane.status === 'Not installed') {
            this.appConf('install')
            return false;
        }
        if (!this.state.disabled) {
            const data = {
                gateway: this.props.match.params.sn,
                inst: this.props.pane.inst_name,
                conf: {
                    devs: this.state.devs,
                    has_options_ex: this.state.seniorIndeterminate ? 'yes' : 'no',
                    mqtt: this.state.mqtt,
                    options: this.state.options,
                    options_ex: this.state.options_ex
                },
                id: `/gateways/${this.props.match.params.sn}/config/${this.props.pane.inst_name}/${new Date() * 1}`
            }
            console.log(data.conf)
            http.post('/api/gateways_applications_conf', data).then(res=>{
                if (res.ok) {
                    let title = '配置应用' + data.inst + '请求'
                    message.info(title + '等待网关响应!')
                    this.props.store.action.pushAction(res.data, title, '', data, 10000,  ()=> {
                        this.props.fetch()
                    })
                }
            })
        }
        this.setState({disabled: !this.state.disabled})
    };
    installMqtt = () => {
        const { devs } = this.state;
        const data = {
                gateway: this.props.match.params.sn,
                inst: this.props.pane.inst_name,
                app: 'APP00000259',
                version: this.props.app_info.versionLatest,
                conf: {
                    mqtt: this.state.mqtt,
                    options: this.state.options,
                    devs,
                    has_options_ex: this.state.seniorIndeterminate ? 'yes' : 'no',
                    options_ex: this.state.options_ex
                },
                id: 'app_install/' + this.props.match.params.sn + '/' + this.props.pane.inst_name + '/APP00000259/' + new Date() * 1
            }
            this.setState({
                visible: false
            })
            http.post('/api/gateways_applications_install', data).then(res=>{
                if (res.ok) {
                    let title = '安装应用' + data.inst + '请求成功!'
                    message.info(title + '等待网关响应!')
                    this.props.store.action.pushAction(res.data, title, '', data, 10000,  (action)=> {
                        this.props.fetch(undefined, 'success')
                        if (action) {
                            this.setState({
                                disabled: true,
                                number: 100,
                                result: true,
                                ShowResult: true
                            })
                        } else {
                            this.setState({result: false, ShowResult: true, number: 99})
                        }
                    })
                } else {
                    message.error(res.error)
                }
            })
    }
    removeApp = () =>{
        if (this.props.pane.status === 'Not installed') {
            this.props.removenotinstall(this.props.pane.inst_name)
            return false;
        }
        this.setState({
            ShowResult: false
        }, () => {
            this.appConf('remove');
        })
    }
    uninstall = () => {
        const data = {
            gateway: this.props.match.params.sn,
            inst: this.props.pane.inst_name,
            id: `app_remove/${this.props.match.params.sn}/${this.props.pane.inst_name}/${new Date() * 1}`
        }
        http.post('/api/gateways_applications_remove', data).then(res=>{
            if (res.ok) {
                let title = '卸载应用' + data.inst + '请求'
                message.info(title + '等待网关响应!')
                this.props.store.action.pushAction(res.data, title, '', data, 10000,  (action)=> {
                    this.props.fetch()
                    this.props.setActiveKey('0')
                    if (action) {
                        this.setState({
                            disabled: true,
                            number: 100,
                            result: true,
                            ShowResult: true
                        })
                    } else {
                        this.setState({result: true, ShowResult: true, number: 99})
                    }
                })
            }
        })
    }
    showTitle = () => this.props.pane.status === 'Not installed' ? '确定要取消安装MQTT通道吗？' : '确定要删除应用MQTT吗?'
    showConfirm =() => {
        confirm({
            title: this.props.pane.status === 'Not installed' ? '确定要取消安装MQTT通道吗？' : '确定要删除应用MQTT吗?',
            content: '',
            okText: '确定',
            cancelText: '取消',
            onOk: ()=> {
                this.removeApp()
            },
            onCancel () {
            }
        })
    }
    funDownload = () => {
        const sn = this.props.match.params.sn;
        const { inst_name } = this.props.pane
        const zip = new Zip();
        const {tls_cert, client_cert, client_key} = this.props.pane.conf.mqtt;
        tls_cert && zip.file('CA.crt', tls_cert);
        client_cert && zip.file('Client.crt', client_cert);
        client_key && zip.file('Client.key', client_key);
        zip.generateAsync({type: 'blob'})
            .then(function (content) {
                saveAs(content, sn + '-' + inst_name + '证书.zip');
});
    }
    render () {
        const { fileList, fileList1, fileList2, disabled, mqtt, options, CustomAuthentication} = this.state;
        return (
            <div>
                <Form
                    className="login-form login-form-mqtt"
                >
                    <Row gutter={24}>
                        <Col span={24}>
                            <div style={{display: 'flex'}}>
                                <Button
                                    style={{marginLeft: '10pxs', marginRight: '20px'}}
                                    type="primary"
                                    onClick={this.toggleDisable}
                                >
                                    {
                                        this.props.pane.status !== 'Not installed'
                                        ? !this.state.disabled ? '保存' : '编辑'
                                        : '安装'
                                    }
                                </Button>
                                {/* <Popconfirm
                                    title={this.props.pane.status === 'Not installed' ? '确定要取消安装MQTT通道吗？' : '确定要删除应用MQTT吗?'}
                                    onConfirm={this.removeApp}
                                    // onCancel={cancel}
                                    okText="删除"
                                    cancelText="取消"
                                > */}
                                    <Button
                                        style={{marginLeft: '10pxs'}}
                                        type="danger"
                                        onClick={this.showConfirm}
                                    >
                                        {
                                            this.props.pane.status === 'Not installed'
                                                ? '取消添加'
                                                : '删除'
                                        }
                                    </Button>
                                {/* </Popconfirm> */}
                            {
                                !disabled && this.props.pane.status !== 'Not installed'
                                ? <Button
                                    style={{
                                        marginLeft: '20px'
                                    }}
                                    onClick={()=>{
                                        this.setState({disabled: true}, ()=>{
                                            this.setPage()
                                        })
                                    }}
                                  >
                                        取消编辑
                                    </Button>
                                : ''
                            }
                            </div>
                            <Divider orientation="left">服务器信息</Divider>
                        </Col>
                        <div className="mqttwrapper">
                            <div className="flex">
                                <span>MQTT地址：</span>
                                <Input
                                    style={{width: 200}}
                                    allowClear={!disabled}
                                    autoComplete="off"
                                    disabled={disabled}
                                    value={mqtt && mqtt.server ? mqtt.server : ''}
                                    onChange={(e) => {
                                    this.setSetting('mqtt', e.target.value, 'server')
                                }}
                                />
                            </div>
                            <div className="flex">
                                <span>MQTT端口：</span>
                                <InputNumber
                                    style={{width: 200}}
                                    allowClear={!disabled}
                                    min={1}
                                    max={65535}
                                    autoComplete="off"
                                    disabled={disabled}
                                    value={mqtt && mqtt.port ? mqtt.port : ''}
                                    onChange={(value) => {
                                        console.log(value)
                                        if (value > 65535 || value < 1) {
                                            return false;
                                        } else {
                                            this.setSetting('mqtt', value, 'port')
                                        }
                                    }}
                                />
                            </div>
                            <div style={{padding: '8px 3px'}}>
                                <span>
                                    使用自定义认证方式:
                                </span>
                                <Checkbox
                                    disabled={disabled}
                                    checked={CustomAuthentication}
                                    onChange={(e)=>{
                                        this.setState({CustomAuthentication: e.target.checked})
                                    }}
                                />
                            </div>
                            {
                                CustomAuthentication
                                ? <div>
                                    <div className="flex">
                                        <span>
                                            MQTT用户：
                                        </span>
                                        <Input
                                            style={{  width: 200 }}
                                            allowClear={!disabled}
                                            autoComplete="off"
                                            disabled={disabled}
                                            value={mqtt && mqtt.username ? mqtt.username : ''}
                                            onChange={(e) => {
                                                this.setSetting('mqtt', e.target.value, 'username')
                                            }}
                                        />
                                    </div>
                                    <div className="flex">
                                        <span>
                                            MQTT密码：
                                        </span>
                                        <Input
                                            style={{  width: 200 }}
                                            allowClear={!disabled}
                                            autoComplete="off"
                                            disabled={disabled}
                                            value={mqtt && mqtt.password ? mqtt.password : ''}
                                            onChange={(e) => {
                                                this.setSetting('mqtt', e.target.value, 'password')
                                            }}
                                        />
                                    </div>
                                    <div className="flex">
                                        <span>
                                            客户端ID：&nbsp;&nbsp;&nbsp;
                                        </span>
                                        <Input
                                            allowClear={!disabled}
                                            style={{  width: 200 }}
                                            autoComplete="off"
                                            disabled={disabled}
                                            value={mqtt && mqtt.client_id ? mqtt.client_id : ''}
                                            onChange={(e) => {
                                                this.setSetting('mqtt', e.target.value, 'client_id')
                                            }}
                                        />
                                    </div>
                                </div>
                                : ''
                            }
                        </div>
                        <div className="marle20"
                            style={{
                                padding: '5px, 1px'
                            }}
                        >
                            <span>
                                使用SSL/TLS：
                            </span>
                            <Checkbox
                                disabled={disabled}
                                checked={this.state.mqtt.enable_tls}
                                onChange={(e) => {
                                    this.setSetting('mqtt', e.target.checked, 'enable_tls')
                                }}
                            />
                        </div>
                        <div className="marle20">
                            {
                                this.state.mqtt.enable_tls
                                ? <div>
                                    <div className="mqttpagelist">
                                        <div style={{ padding: '5px 0'}}>
                                            <span>
                                                SSL/TLS类型：
                                            </span>
                                            <Select
                                                disabled={disabled}
                                                value={this.state.WhetherTheCA}
                                                style={{ width: 200 }}
                                                onChange={(val)=>{
                                                    this.setState({
                                                        WhetherTheCA: val
                                                    })
                                                }}
                                            >
                                                <Option value="true">CA证书</Option>
                                                <Option value="false">自签名证书</Option>
                                            </Select>
                                        </div>
                                        <div style={{ lineHeight: '40px', marginLeft: '50px'}}>
                                            <span>
                                                非安全SSL/TLS：
                                            </span>
                                            <Checkbox
                                                disabled={disabled}
                                                checked={mqtt.tls_insecure}
                                                onChange={(e)=>{
                                                    this.setSetting('mqtt', e.target.checked, 'tls_insecure')
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <Col
                                        span={6}
                                        style={{paddingLeft: 0}}
                                    >
                                <div>
                                    <div style={{padding: '5px 0'}}>
                                        <span>
                                            CA证书：
                                        </span>
                                        <Upload
                                            action=""
                                            name="file1"
                                            beforeUpload={this.getTextInfo}
                                            fileList={fileList}
                                            onChange={this.handleListChange}
                                        >
                                            <Button disabled={disabled}>
                                                <Icon type="upload"/> 点击上传
                                            </Button>
                                        </Upload>
                                    </div>
                                    {
                                        this.state.mqtt.tls_cert && this.state.disabled
                                        ? <Button
                                            onClick={this.funDownload}
                                          >
                                            <Icon type="download" />点击下载
                                        </Button>
                                        : ''
                                    }
                                </div>
                            </Col>
                            {
                                this.state.WhetherTheCA === 'false'
                                ? <div>
                                    <Col span={6}>
                                        <span>Client证书：</span>
                                        <Upload
                                            action=""
                                            name="file2"
                                            beforeUpload={this.getTextInfo1}
                                            fileList={fileList1}
                                            onChange={this.handleListChange1}
                                        >
                                            <Button disabled={disabled}>
                                                <Icon type="upload"/> 点击上传
                                            </Button>
                                        </Upload>
                                    </Col>
                                    <Col span={6}>
                                            <span>Client密钥：</span>
                                            <Upload
                                                action=""
                                                beforeUpload={this.getTextInfo2}
                                                name="file3"
                                                fileList={fileList2}
                                                onChange={this.handleListChange2}
                                            >
                                                <Button disabled={disabled}>
                                                    <Icon type="upload"/> 点击上传
                                                </Button>
                                            </Upload>
                                    </Col>
                                </div>
                                : ''
                            }
                                </div>
                                : ''
                            }
                        </div>
                        <Divider
                            orientation="left"
                            style={{ paddingTop: '15px'}}
                        >数据传输选项</Divider>
                        <Col span={3}>
                            <Form.Item label="上送周期(秒)：">
                                <InputNumber
                                    value={options && options.period ? options.period : ''}
                                    disabled={disabled}
                                    min={1}
                                    max={3600}
                                    onChange={(e) => {
                                        this.setSetting('options', e, 'period')
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Form.Item label="最大打包数量：">
                                <InputNumber
                                    min={10}
                                    max={4096}
                                    value={options && options.data_upload_dpp ? options.data_upload_dpp : ''}
                                    disabled={disabled}
                                    onChange={(value) => {
                                        this.setSetting('options', value, 'data_upload_dpp')
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={3}>
                            <Form.Item label="开启短线缓存：">
                            <Checkbox
                                disabled={disabled}
                                defaultChecked={options && options.enable_data_cache ? options.enable_data_cache : false}
                                onChange={(e) => {
                                    this.setSetting('options', e.target.checked, 'enable_data_cache')
                                }}
                            />
                            </Form.Item>
                        </Col>
                        <Divider orientation="left">高级选项</Divider>
                        <Col span={4}>
                            <Form.Item>
                                <span>高级选项：</span>
                                <Checkbox
                                    checked={this.state.seniorIndeterminate}
                                    onChange={this.seniorChange}
                                    disabled={disabled}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item>
                                {this.moreChange()}
                            </Form.Item>
                        </Col>
                        <Divider orientation="left">需要上传的设备列表</Divider>
                        <Col span={24}>
                            <AddDevList
                                status={this.props.pane.status}
                                devs={this.props.pane.conf.devs}
                                setdevs={this.setDevs}
                                disabled={this.state.disabled}
                            />
                        </Col>
                    </Row>
                    <div style={{display: 'flex', marginTop: '20px'}}>
                                <Button
                                    style={{marginLeft: '10pxs', marginRight: '20px'}}
                                    type="primary"
                                    onClick={this.toggleDisable}
                                >
                                    {
                                        this.props.pane.status !== 'Not installed'
                                        ? !this.state.disabled ? '保存' : '编辑'
                                        : '安装'
                                    }
                                </Button>
                                <Popconfirm
                                    title="确定要删除应用吗?"
                                    onConfirm={this.removeApp}
                                    // onCancel={cancel}
                                    okText="删除"
                                    cancelText="取消"
                                >
                                    <Button
                                        style={{marginLeft: '10pxs'}}
                                        type="danger"
                                    >
                                        {
                                            this.props.pane.status === 'Not installed'
                                                ? '取消添加'
                                                : '删除'
                                        }
                                    </Button>
                                </Popconfirm>
                                {
                                    !disabled && this.props.pane.status !== 'Not installed'
                                    ? <Button
                                        style={{
                                            marginLeft: '20px'
                                        }}
                                        onClick={()=>{
                                            this.setState({disabled: true}, ()=>{
                                                this.setPage()
                                            })
                                        }}
                                        disabled={this.state.checkIp}
                                      >
                                            取消编辑
                                        </Button>
                                    : ''
                                }
                            </div>
                    </Form>
                    <Modal
                        title={!this.state.isShow ? this.state.action === 'install' ? '新增通道进度' : '卸载通道进度' : '查看日志'}
                        visible={this.state.pressVisible}
                        footer={null}
                        closable={false}
                    >
                            {<div>
                                {
                                    this.state.ShowResult
                                    ? this.state.result && this.state.number === 100
                                    ? <div>
                                        <Result
                                            status="success"
                                            title={this.state.action === 'install' ? '新增MQTT通道成功' : '卸载MQTT通道成功'}
                                            subTitle=""
                                            extra={[
                                            <Button
                                                key="buy"
                                                onClick={()=>{
                                                    this.setState({pressVisible: false})
                                                }}
                                            >关闭窗口</Button>
                                            ]}
                                        />
                                    </div>
                                    : <div>
                                        <Result
                                            status="warning"
                                            title={this.state.action === 'install' ? '新增MQTT通道失败' : '卸载MQTT通道失败'}
                                            extra={
                                            <Button
                                                key="buy"
                                                onClick={()=>{
                                                    this.setState({pressVisible: false})
                                                }}
                                            >关闭窗口</Button>
                                            }
                                        />
                                    </div>
                                    : this.state.number === 99
                                    ? <div>
                                    <Result
                                        status="warning"
                                        title="新增MQTT通道失败！"
                                        extra={
                                        <Button
                                            key="buy"
                                            onClick={()=>{
                                                this.setState({pressVisible: false})
                                            }}
                                        >关闭窗口</Button>
                                        }
                                    />
                                </div>
                                    : <Progress
                                        style={{
                                            marginLeft: '50%',
                                            transform: 'translate(-50%, 0)'
                                        }}
                                        type="circle"
                                        strokeColor={{
                                            '0%': '#108ee9',
                                            '100%': '#87d068'
                                        }}
                                        percent={this.state.number}
                                      />
                                }
                            </div>
                            }
                </Modal>
            </div>
        )
    }
}

export default MqttForm;