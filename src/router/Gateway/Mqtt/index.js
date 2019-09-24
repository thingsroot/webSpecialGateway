import React, {Component} from 'react';
import http from '../../../utils/Server';
import MqttPane from './MqttForm';
import {
    Tabs,
    Button,
    Modal,
    Form,
    Row,
    Col,
    Input,
    // Divider,
    Checkbox,
    // Upload,
    Icon,
    Collapse,
    Popconfirm,
    message,
    // InputNumber,
    Table,
    Empty
} from 'antd';
import './index.css';
import { inject, observer} from 'mobx-react';
const {Panel} = Collapse;
const { confirm } = Modal;
const coustomPanelStyle = {
    background: '#f7f7f7',
    borderRadius: 4,
    marginBottom: 24,
    border: 0,
    overflow: 'hidden'
}
const {TabPane} = Tabs;
@inject('store')
@observer
class Mqtt extends Component {
    constructor (props) {
        super(props);
        this.newTabIndex = 0;
        const panes = [];
        const NUMBER_CYCLE = 60;
        const NUMBER_MAXDATE = 300
        const NUMBER_MAXQUANTITY = 1024
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
            activeKey: '0',
            panes,
            loading: true,
            modalKey: 0,
            app_list: [],
            userMessage: '',
            seniorIndeterminate: false, //高级选项
            visible: false,
            applist: [],
            dataSource: [],
            count: 0,
            fileList: [],
            fileList1: [],
            fileList2: [],
            serial_opt: {
                cycle: NUMBER_CYCLE,
                maxDate: NUMBER_MAXDATE,
                maxQuantity: NUMBER_MAXQUANTITY
            },
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
        this.fetch()
        this.upgradeFreeioe()
        // this.t1 = setInterval(() => {
        //     this.fetch()
        // }, 10000);
        this.t1 = setInterval(() => {
            this.upgradeFreeioe()
        }, 3000);
    }
    UNSAFE_componentWillReceiveProps (nextProps) {
        if (nextProps.match.params.sn !== this.props.match.params.sn) {
            this.fetch(nextProps.match.params.sn)
            this.setState({loading: true})
            clearInterval(this.t1)
            this.t1 = setInterval(() => {
                this.upgradeFreeioe()
            }, 3000);
        }
    }
    componentWillUnmount (){
        clearInterval(this.t1)
    }
    onGatewayUpgrade (version, skynet_version) {
        if (version === undefined && skynet_version === undefined) {
            message.error('错误的升级请求')
            return
        }

        const { gatewayInfo } = this.props.store;
        this.setState({upgrading: true})
        const data = {
            name: gatewayInfo.sn,
            no_ack: 1,
            id: `sys_upgrade/${gatewayInfo.sn}/${new Date() * 1}`
        }
        if (version !== undefined) {
            data.version = version
        }
        if (skynet_version !== undefined) {
            data.skynet_version = skynet_version
        }
        http.post('/api/gateways_upgrade', data).then(res=>{
            if (res.ok) {
                this.props.store.action.pushAction(res.data, '网关固件升级', '', data, 30000,  (result)=> {
                    if (result.ok){
                        this.setState({showUpgrade: false})
                    } else {
                        this.setState({upgrading: false})
                    }
                })
            } else {
                message.error('网关固件升级失败！ 错误:' + res.error)
                this.confirm()
                this.setState({upgrading: false})
            }
        }).catch((err)=>{
            message.error('网关固件升级失败！ 错误:' + err)
            this.confirm()
            this.setState({upgrading: false})
        })
    }
    showConfirm = () => {
        const $this = this;
        confirm({
          title: '该网关设备系统版本过低，请升级。',
          content: '是否升级？如不升级将无法使用MQTT配置！',
          okText: '升级',
          cancelText: '取消',
          onOk () {
                $this.getVersionlatest().then(data=>{
                    $this.onGatewayUpgrade(data.freeioe_version, data.skynet_version)
                })
          },
          onCancel () {
              $this.props.history.push(`/gateway/${$this.props.match.params.sn}/devices`)
          }
        });
      }
    getVersionlatest = () =>{
        return new Promise((resolve, reject)=>{
            const {gatewayInfo} = this.props.store;
            const data = {

            }
            http.get('/api/applications_versions_latest?app=freeioe&beta=' + (gatewayInfo.data.enable_beta ? 1 : 0)).then(res=>{
                if (res.ok) {
                    data.freeioe_version = res.data;
                    http.get('/api/applications_versions_latest?app=bin/openwrt/18.06/x86_64/skynet&beta=' + (gatewayInfo.data.enable_beta ? 1 : 0)).then(response=>{
                        if (response.ok) {
                            data.skynet_version = response.data;
                            resolve(data)
                        } else {
                            reject('skyneterror')
                        }
                    })
                }
            })
        })
    }
    upgradeFreeioe = () => {
        const { version } = this.props.store.gatewayInfo.data;
        if (version !== 0 && version < 1273) {
            clearInterval(this.t1)
            console.log('需要升级Freeioe')
            this.showConfirm()
        }
        if (version !== 0 && version >= 1273) {
            clearInterval(this.t1)
        }
    }
    setActiveKey = (key)=>{
        this.setState({activeKey: key})
    }
    fetch = (sn) => {
        const vsn = sn ? sn : this.props.match.params.sn;
        http.get('/api/applications_read?app=APP00000259').then(res=>{
            if (res.ok) {
                this.setState({app_info: res.data})
            }
        })
        http.get('/api/gateways_app_list?gateway=' + vsn + '&beta=0').then(res=>{
            if (res.ok){
                const app_list = [];
                if (res.data && res.data.length > 0) {
                    res.data.map(item=>{
                        if (item.inst_name.toLowerCase().indexOf('mqtt') !== -1) {
                            app_list.push(item)
                        }
                    })
                }
                this.setState({app_list, loading: false})
            } else {
                message.error(res.error)
            }
        })
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
            this.setSetting('mqttForm', targetNum, 'contentText')
        }
        return false;
    };
    getTextInfo1 = (file) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = (result) => {
            let targetNum = result.target.result;
            this.setSetting('mqttForm', targetNum, 'contentClient')
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
            this.setSetting('mqttForm', targetNum, 'contentClientPw')
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
    handleAdd = () => {
        const {count, dataSource} = this.state;
        const newDate = {
            key: count,
            name: ' '
        };
        this.setState({
            dataSource: [...dataSource, newDate],
            count: count + 1
        })
    };
    handleSave = row => {
        const newDate = [...this.state.dataSource]
        const index = newDate.findIndex(item => row.key === item.key);
        const item = newDate[index];
        newDate.splice(index, 1, {
            ...item,
            ...row
        });
        this.setSetting('mqttForm', newDate, 'dataSource')
    }

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
    changeGroup = (checkedValues) => {
        this.setSetting('mqttForm', [...checkedValues], 'groupList' )
    };

    moreChange () {
        if (this.state.seniorIndeterminate) {
            return (
                <Collapse
                    bordered={false}
                    expandIcon={({isActive}) =>
                        <Icon
                            type="caret-right"
                            rotate={isActive ? 90 : 0}
                        />}
                >
                    <Panel
                        header="更多"
                        key="1"
                        style={coustomPanelStyle}
                    >
                        <Form.Item>
                                <Row className="highSenior">
                                    <Col span={24}>
                                        <Checkbox
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
                                        <span style={{lineHeight: '30px'}}>事件上送（最小等级）：</span>
                                        <Input
                                            style={{width: 150}}
                                            value={this.state.options_ex.upload_event}
                                            onChange={(e)=>{
                                                this.setSetting('options_ex', e.target.value, 'upload_event')
                                            }}
                                        />
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox
                                            // value="禁止设备输出"
                                            checked={this.state.options_ex.disable_output}
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
                                            onChange={(e)=>{
                                                this.setSetting('options_ex', e.target.checked, 'diable_command')
                                            }}
                                        >禁止设备指令：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox
                                            value="禁止设备信息上送"
                                            checked={this.state.options_ex.disable_devices}
                                            onChange={(e)=>{
                                                this.setSetting('options_ex', e.target.checked, 'disable_devices')
                                            }}
                                        >禁止设备信息上送：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox
                                            value="禁止上送紧急数据"
                                            checked={this.state.options_ex.disable_data_em}
                                            onChange={(e)=>{
                                                this.setSetting('options_ex', e.target.checked, 'disable_data_em')
                                            }}
                                        >禁止上送紧急数据：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox
                                            value="禁止压缩（调试使用"
                                            checked={this.state.options_ex.disable_compress}
                                            onChange={(e)=>{
                                                this.setSetting('options_ex', e.target.checked, 'disable_compress')
                                            }}
                                        >禁止压缩（调试使用）：</Checkbox>
                                    </Col>
                                </Row>
                            {/* </Checkbox.Group> */}
                        </Form.Item>
                    </Panel>

                </Collapse>
            )
        }
    }
    onChange = activeKey => {
        this.setState({activeKey});
    };
    onEdit = (targetKey, action) => {
        this[action](targetKey);
    };
    add = () => {
        let inst_name = '';
        if (!this.state.app_list.some(function (item) {
            if (item.inst_name === 'mqtt_1') {
                return true
            }
        })) {
            inst_name = 'mqtt_1'
        } else {
            inst_name = 'mqtt_2'
        }
        const data = {
            inst_name: inst_name,
            status: 'Not installed',
            conf: {
                has_options_ex: 'no',
                mqtt: {
                    enable_tls: false
                },
                options: {
                    data_upload_dpp: 1024,
                    period: 60
                },
                dev: [],
                options_ex: {
                    diable_command: false,
                    diable_data: false,
                    disable_compress: false,
                    disable_data_em: false,
                    disable_devices: false,
                    disable_output: false,
                    upload_event: 0

                }
            }
        }
        const { app_list } = this.state;
        app_list.push(data)
        this.setState({
            app_list
        })
    };

    handleCancel = () => {
        this.setState({
            visible: false,
            modalKey: 0
        })
    }
    installMqtt = () => {
        if (!this.state.serial_opt.contentText) {
            message.info('请先上传CA证书！')
            return false;
        }
        const { serial_opt } = this.state;
        const { app_list} = this.state;
        let flag = false;
        if (app_list && app_list.length > 0) {
            app_list.map(item=>{
                if (item.inst_name === 'mqtt_1'){
                    flag = true
                }
            })
        }
        const devs = serial_opt.dataSource;
        const arr = [];
        devs && devs.length > 0 && devs.map((item) =>{
            arr.push({
                key: item.key,
                sn: item.name
            })
        })
        const inst_name = flag ? 'mqtt_2' : 'mqtt_1';
        const data = {
                gateway: this.props.match.params.sn,
                inst: inst_name,
                app: 'APP00000259',
                version: this.state.app_info.versionLatest,
                conf: {
                    mqtt: {
                        server: serial_opt.address,
                        port: serial_opt.port,
                        username: serial_opt.user,
                        password: serial_opt.password,
                        client_id: serial_opt.userId,
                        enable_tls: serial_opt.tls,
                        tls_cert: serial_opt.contentText,
                        client_cert: serial_opt.contentClient,
                        client_key: serial_opt.contentClientPw
                    },
                    options: {
                        period: serial_opt.cycle,
                        ttl: serial_opt.maxDate,
                        data_upload_dpp: serial_opt.maxQuantity,
                        enable_data_cache: serial_opt.openLazy
                    },
                    devs: arr,
                    has_options_ex: this.state.seniorIndeterminate ? 'yes' : 'no',
                    options_ex: this.state.options_ex
                },
                id: 'app_install/' + this.props.match.params.sn + '/' + inst_name + '/APP00000259/' + new Date() * 1
            }
            this.setState({
                visible: false
            })
            http.post('/api/gateways_applications_install', data).then(res=>{
                if (res.ok) {
                    let title = '安装应用' + data.inst + '请求成功!'
                    message.info(title + '等待网关响应!')
                    this.props.store.action.pushAction(res.data, title, '', data, 10000,  ()=> {
                        this.fetch()
                        this.setState({
                            modalKey: 0
                        })
                    })
                } else {
                    message.error(res.error)
                }
            })
    }
    removeNotInstall = (record) =>{
        const app_list = this.state.app_list;
        app_list.map((item, key) => {
            if (item.inst_name === record) {
                app_list.splice(key, 1)
            }
        })

        this.setState({
            app_list,
            activeKey: '0'
        })
    }
    render () {
        return (
            <div className="parents-mqtt">
                {
                    !this.state.loading && this.state.app_list.length === 0
                    ? <Button
                        onClick={this.add}
                      >
                        新增Modbus通道
                    </Button>
                    : ''
                }
                <div style={{marginBottom: '16px'}}>
                </div>
                    {
                    !this.state.loading
                    ? this.state.app_list && this.state.app_list.length > 0
                    ? <Tabs
                        hideAdd={this.state.app_list.length >= 2}
                        onChange={this.onChange}
                        activeKey={this.state.activeKey}
                        type="editable-card"
                        onEdit={this.onEdit}
                      >
                    {
                        this.state.app_list.map((pane, key) => (
                            <TabPane
                                tab={pane.inst_name.indexOf('_') !== -1 ? pane.inst_name.replace('_', '通道') : pane.inst_name}
                                key={key}
                                closable={false}
                            >
                                <MqttPane
                                    removenotinstall={this.removeNotInstall}
                                    pane={pane}
                                    fetch={this.fetch}
                                    setActiveKey={this.setActiveKey}
                                    app_info={this.state.app_info}
                                />
                            </TabPane>
                        ))
                    }
                      </Tabs>
                    : <Empty/>
                    : <Table loading/>
                    }
            </div>
        );
    }
}

export default Mqtt;
