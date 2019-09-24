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
    Upload
} from 'antd';
import { inject, observer} from 'mobx-react';
import { withRouter } from 'react-router-dom';
import http from '../../../../utils/Server';
import AddDevList from './Transfer';
import Zip from 'jszip';
import * as saveAs from 'jszip/vendor/FileSaver';
import './style.scss';
const { Option } = Select;
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
            count: 0,
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
                diable_command: false,
                diable_data: false,
                disable_compress: false,
                disable_data_em: false,
                disable_devices: false,
                disable_output: false,
                upload_event: 0
            }
        };
    }
    componentDidMount () {
        if (this.props.pane.conf) {
            const { conf } = this.props.pane;
            this.setState({
                options: conf.options,
                mqtt: conf.mqtt,
                has_options_ex: conf.has_options_ex === 'yes'
            })
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
            targetNum = targetNum.replace(/[\n\r]/g, '');
            targetNum = targetNum.replace(/[ ]/g, '');
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
        this.setState({
            devs: value
        })
    }
    toggleDisable = () => {
        if (!this.state.disabled && this.props.pane.status === 'Not installed') {
            this.installMqtt()
            return false;
        }
        if (!this.state.disabled) {
            const data = {
                gateway: this.props.match.params.sn,
                inst: this.props.pane.inst_name,
                conf: {
                    devs: this.state.devs,
                    has_options_ex: this.state.has_options_ex ? 'yes' : 'no',
                    mqtt: this.state.mqtt,
                    options: this.state.options,
                    options_ex: this.state.options_ex
                },
                id: `/gateways/${this.props.match.params.sn}/config/${this.props.pane.inst_name}/${new Date() * 1}`
            }
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
        if (this.state.mqtt.enable_tls && !this.state.serial_opt.contentText) {
            message.info('请先上传CA证书！')
            return false;
        }
        const { serial_opt } = this.state;
        const devs = serial_opt.dataSource;
        const arr = [];
        devs && devs.length > 0 && devs.map((item) =>{
            arr.push({
                key: item.key,
                sn: item.name
            })
        })
        const data = {
                gateway: this.props.match.params.sn,
                inst: this.props.pane.inst_name,
                app: 'APP00000259',
                version: this.props.app_info.versionLatest,
                conf: {
                    mqtt: this.state.mqtt,
                    options: this.state.options,
                    devs: arr,
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
                    this.props.store.action.pushAction(res.data, title, '', data, 10000,  ()=> {
                        this.props.fetch()
                        this.setState({
                            disabled: true
                        })
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
        const data = {
            gateway: this.props.match.params.sn,
            inst: this.props.pane.inst_name,
            id: `app_remove/${this.props.match.params.sn}/${this.props.pane.inst_name}/${new Date() * 1}`
        }
        http.post('/api/gateways_applications_remove', data).then(res=>{
            if (res.ok) {
                let title = '卸载应用' + data.inst + '请求'
                message.info(title + '等待网关响应!')
                this.props.store.action.pushAction(res.data, title, '', data, 10000,  ()=> {
                    this.props.fetch()
                    this.props.setActiveKey('0')
                })
            }
        })
    }
    funDownload = () => {
        const zip = new Zip();
        const {tls_cert, client_cert, client_key} = this.props.pane.conf.mqtt;
        tls_cert && zip.file('CA证书.txt', tls_cert);
        client_cert && zip.file('Client证书.txt', client_cert);
        client_key && zip.file('Client秘钥.txt', client_key);
        zip.generateAsync({type: 'blob'})
            .then(function (content) {
                saveAs(content, '证书.zip');
});
    }
    render () {
        const { fileList, fileList1, fileList2, disabled, mqtt, options, CustomAuthentication} = this.state;
        return (
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
                                {!this.state.disabled ? '保存' : '编辑'}
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
                                    删除
                                </Button>
                            </Popconfirm>
                        {
                            !disabled
                            ? <Button
                                style={{
                                    marginLeft: '20px'
                                }}
                                onClick={()=>{
                                    this.setState({disabled: true})
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
                            <Input
                                style={{width: 200}}
                                allowClear={!disabled}
                                autoComplete="off"
                                disabled={disabled}
                                value={mqtt && mqtt.port ? mqtt.port : ''}
                                onChange={(e) => {
                                    this.setSetting('mqtt', e.target.value, 'port')
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
                                {!this.state.disabled ? '保存' : '编辑'}
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
                                    删除
                                </Button>
                            </Popconfirm>
                        {
                            !disabled
                            ? <Button
                                style={{
                                    marginLeft: '20px'
                                }}
                                onClick={()=>{
                                    this.setState({disabled: true})
                                }}
                              >
                                    取消编辑
                                </Button>
                            : ''
                        }
                        </div>
            </Form>
        )
    }
}

export default MqttForm;