import React, {Component, Fragment} from 'react';
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
    Divider,
    Checkbox,
    Upload,
    Icon,
    Collapse,
    Popconfirm,
    message,
    InputNumber,
    Table
} from 'antd';
import './index.css'
// import MqttForm from './MqttForm'
import { inject, observer} from 'mobx-react';
const EditableContext = React.createContext();

const EditableRow = ({form, index, ...props}) => (
    <EditableContext.Provider
        value={form}
        index={index}
    >
        <tr {...props} />
    </EditableContext.Provider>
);
const EditableFormRow = Form.create()(EditableRow);

const {Panel} = Collapse;
const coustomPanelStyle = {
    background: '#f7f7f7',
    borderRadius: 4,
    marginBottom: 24,
    border: 0,
    overflow: 'hidden'
}
@inject('store')
@observer
class EditableCell extends React.Component {
    state = {
        editing: true
    };

    toggleEdit = () => {
        const editing = !this.state.editing;
        this.setState({editing}, () => {
            if (editing) {
                this.input.focus();
            }
        });
    };

    save = e => {
        const {record, handleSave} = this.props;
        this.form.validateFields((error, values) => {
            if (error && error[e.currentTarget.id]) {
                return;
            }
            this.toggleEdit();
            handleSave({...record, ...values});
        });
    };

    renderCell = form => {
        this.form = form;
        const {children, dataIndex, record, title} = this.props;
        const {editing} = this.state;
        return editing ? (
            <Form.Item style={{margin: 0}}>
                {form.getFieldDecorator(dataIndex, {
                    rules: [
                        {
                            required: true,
                            message: `${title} 必填项.`
                        }
                    ],
                    initialValue: record[dataIndex]
                })(<Input
                    ref={node => (this.input = node)}
                    onPressEnter={this.save}
                    onBlur={this.save}
                    autoComplete="off"
                   />)}
            </Form.Item>
        ) : (
            <div
                className="editable-cell-value-wrap"
                style={{paddingRight: 24}}
                onClick={this.toggleEdit}
            >
                {children}
            </div>
        );
    };

    render () {
        const {
            editable,
            dataIndex,
            title,
            record,
            index,
            handleSave,
            children,
            ...restProps
        } = this.props;
        dataIndex, title, record, index, handleSave
        return (
            <td {...restProps}>
                {editable ? (
                    <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
                ) : (
                    children
                )}
            </td>
        );
    }
}
const {TabPane} = Tabs;
@inject('store')
@observer
class Mqtt extends Component {
    constructor (props) {
        super(props);
        this.newTabIndex = 0;
        const panes = [
            // {title: 'Mqtt配置1', content: <MqttForm wrappedComponentRef={(form) => this.formRef = form} />, key: '1'},
            // {title: 'Mqtt配置2', content: <MqttForm wrappedComponentRef={(form) => this.formRef = form} />, key: '2'}
        ];
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
            modalKey: 0,
            app_list: [],
            userMessage: '',
            seniorIndeterminate: false, //高级选项
            visible: false,
            applist: [],
            dataSource: [
                // {
                //     key: '0',
                //     name: '',
                // },

            ],
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
        this.t1 = setInterval(() => {
            this.fetch()
        }, 10000);
    }
    UNSAFE_componentWillReceiveProps (nextProps) {
        if (nextProps.match.params.sn !== this.props.match.params.sn) {
            this.fetch(nextProps.match.params.sn)
        }
    }
    componentWillUnmount (){
        clearInterval(this.t1)
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
                    // this.props.store.gatewayInfo.setApps(app_list)
                }
                this.setState({app_list})
            } else {
                message.error(res.error)
            }
        })
    }
    setSetting = (type, val, name) => {
        if (type !== 'mqttForm') {
            this.setState({
                [type]: Object.assign({}, this.state[type], {[name]: val})
            }, ()=>{
                console.log(this.state[type])
            })
        } else {
            this.setState({
                serial_opt: Object.assign({}, this.state.serial_opt, {[name]: val})
            }, ()=> {
                console.log(this.state.serial_opt)
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

        this.setState({fileList}, ()=>{
            console.log(fileList)
        });
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
                            {/* <Checkbox.Group
                                style={{width: '100%'}}
                                onChange={this.changeGroup}
                            > */}
                                <Row className="highSenior">
                                    {console.log(this.state.options_ex)}
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
        console.log(targetKey, action, this[action](targetKey), this)
        this[action](targetKey);
    };
    add = () => {
        const {panes} = this.state;
        // const activeKey = `newTab${this.newTabIndex++}`;
        // const title = 'Mqtt配置' + (this.state.panes.length + 1);
        // panes.push({title, content: 'New Tab Pane' + activeKey, key: activeKey});
        // panes.push({title, content: <MqttForm wrappedComponentRef={(form) => this.formRef = form} />, key: activeKey});
        this.setState({panes, visible: true});
    };

    handleCancel = () => {
        this.setState({
            visible: false,
            modalKey: 0
        })
    };
    MatchTheButton = (key) => {
        let name = '';
        switch (key) {
            case 0:
                name = '下一步'
                break;
            case 1:
                name = '下一步'
                break;
            case 2:
                name = '安装'
                break;
            default:
                break;
        }
        return name
    };
    installMqtt = () => {
        console.log(this.state)
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
                    })
                } else {
                    message.error(res.error)
                }
            })
    }
    render () {
        const {dataSource, fileList, fileList1, fileList2} = this.state;
        const components = {
            body: {
                row: EditableFormRow,
                cell: EditableCell
            }
        };
        const columns = this.columns.map(col => {
            if (!col.editable) {
                return col
            }
            return {
                ...col,
                onCell: record => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    handleSave: this.handleSave
                })
            }
        })
        return (
            <div className="parents-mqtt">
                <div style={{marginBottom: '16px'}}>
                    <Button
                        onClick={this.add}
                        disabled={this.state.app_list.length >= 2}
                    >安装MQTT</Button>
                    <Modal
                        title="安装应用"
                        width="800px"
                        visible={this.state.visible}
                        onOk={this.handleSubmit}
                        onCancel={this.handleCancel}
                        destroyOnClose="true"
                        footer={[
                            <Button
                                key="0"
                                onClick={this.handleCancel}
                            >
                                取消
                            </Button>,
                            <Button
                                key="1"
                                disabled={this.state.modalKey === 0}
                                onClick={()=> {
                                    if (this.state.modalKey > 0) {
                                        this.setState({
                                            modalKey: this.state.modalKey - 1
                                        })
                                    }
                                }}
                            >
                                上一步
                            </Button>,
                            <Button
                                key="2"
                                onClick={()=> {
                                    if (this.state.modalKey < 2) {
                                        this.setState({
                                            modalKey: this.state.modalKey + 1
                                        })
                                    }
                                    if (this.state.modalKey === 2) {
                                        console.log(this.state)
                                        this.installMqtt()
                                    }
                                }}
                            >
                                {
                                    this.MatchTheButton(this.state.modalKey)
                                }
                            </Button>
                        ]}
                    >
                        {/*<MqttForm*/}
                        {/*    wrappedComponentRef={(form) => this.formRef = form}*/}
                        {/*/>*/}
                        <Form
                            className="login-form login-form-mqtt"
                        >
                            <Row gutter={24}>
                                {this.state.modalKey === 0 && this.state.modalKey !== 1 && this.state.modalKey !== 2
                                    ? <Fragment>
                                        <Col span={24}>
                                            {/* <Form.Item label="实例名：">
                                                    <Input
                                                        allowClear
                                                        autoComplete="off"
                                                        defaultValue={this.state.serial_opt.instance}
                                                        onChange={(e) => {
                                                            this.setSetting('mqttForm', e.target.value, 'instance')
                                                        }}
                                                    />
                                            </Form.Item> */}
                                            <Divider>服务器信息</Divider>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="MQTT地址：">
                                                    <Input
                                                        allowClear
                                                        autoComplete="off"
                                                        defaultValue={this.state.serial_opt.address}
                                                        onChange={(e) => {
                                                            this.setSetting('mqttForm', e.target.value, 'address')
                                                        }}
                                                    />,
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="MQTT端口：">
                                                    <Input
                                                        allowClear
                                                        autoComplete="off"
                                                        defaultValue={this.state.serial_opt.port}
                                                        onChange={(e) => {
                                                            this.setSetting('mqttForm', e.target.value, 'port')
                                                        }}
                                                    />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="MQTT用户(留空使用标准规则)：">
                                                    <Input
                                                        allowClear
                                                        autoComplete="off"
                                                        defaultValue={this.state.serial_opt.user}
                                                        onChange={(e) => {
                                                            this.setSetting('mqttForm', e.target.value, 'user')
                                                        }}
                                                    />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="MQTT密码(留空使用标准规则)：">
                                                    <Input
                                                        allowClear
                                                        autoComplete="off"
                                                        defaultValue={this.state.serial_opt.password}
                                                        onChange={(e) => {
                                                            this.setSetting('mqttForm', e.target.value, 'password')
                                                        }}
                                                    />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="客户端ID(留空使用标准规则)：">
                                                    <Input
                                                        allowClear
                                                        autoComplete="off"
                                                        defaultValue={this.state.serial_opt.userId}
                                                        onChange={(e) => {
                                                            this.setSetting('mqttForm', e.target.value, 'userId')
                                                        }}
                                                    />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="使用TLS：">
                                               <Checkbox
                                                   onChange={(e) => {
                                                       this.setSetting('mqttForm', e.target.checked, 'tls')
                                                   }}
                                               />
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item label="CA证书(文本)：">
                                                <Upload
                                                    action=""
                                                    name="file1"
                                                    beforeUpload={this.getTextInfo}
                                                    fileList={fileList}
                                                    onChange={this.handleListChange}
                                                >
                                                    <Button>
                                                        <Icon type="upload"/> 点击上传
                                                    </Button>
                                                </Upload>
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item label="Client证书(文本)：">
                                                <Upload
                                                    action=""
                                                    name="file2"
                                                    beforeUpload={this.getTextInfo1}
                                                    fileList={fileList1}
                                                    onChange={this.handleListChange1}
                                                >
                                                    <Button>
                                                        <Icon type="upload"/> 点击上传
                                                    </Button>
                                                </Upload>
                                            </Form.Item>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item label="Client密钥(文本)：">
                                                <Upload
                                                    action=""
                                                    beforeUpload={this.getTextInfo2}
                                                    name="file3"
                                                    fileList={fileList2}
                                                    onChange={this.handleListChange2}
                                                >
                                                    <Button>
                                                        <Icon type="upload"/> 点击上传
                                                    </Button>
                                                </Upload>
                                            </Form.Item>
                                        </Col>
                                    </Fragment>
                                    : <div/>
                                }
                                {this.state.modalKey === 1 && this.state.modalKey !== 0 && this.state.modalKey !== 2
                                    ? <Fragment>
                                        <Divider>数据传输选项</Divider>
                                        <Col span={12}>
                                            <Form.Item label="上送周期(秒)：">
                                                <InputNumber
                                                    defaultValue={60}
                                                    onChange={(e) => {
                                                        this.setSetting('mqttForm', e, 'onCycle')
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="最大数据间隔(秒)：">
                                                <InputNumber
                                                    defaultValue={300}
                                                    onChange={(value) => {
                                                        this.setSetting('mqttForm', value, 'onMaxDate')
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="最大打包数量：">
                                                <InputNumber
                                                    defaultValue={1024}
                                                    onChange={(value) => {
                                                        this.setSetting('mqttForm', value, 'onMaxQuantity')
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item label="开启短线缓存：">
                                                <Checkbox
                                                    onChange={(e) => {
                                                        this.setSetting('mqttForm', e.target.checked, 'openLazy')
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Fragment>
                                    : <div/>
                                }
                                {this.state.modalKey === 2 && this.state.modalKey !== 1 && this.state.modalKey !== 0
                                    ? <Fragment>
                                        <Divider>需要上传的设备列表</Divider>
                                        <Col span={24}>
                                            <Form.Item label="需要上传的设备列表">
                                                <div>
                                                    <Button
                                                        onClick={this.handleAdd}
                                                        type="primary"
                                                        style={{marginBottom: 16}}
                                                    >
                                                        Add
                                                    </Button>
                                                    <Table
                                                        components={components}
                                                        rowClassName={() => 'editable-row'}
                                                        bordered
                                                        dataSource={dataSource}
                                                        columns={columns}
                                                    />
                                                </div>
                                            </Form.Item>
                                        </Col>
                                        <Divider>高级选项</Divider>
                                        <Col span={4}>
                                            <Form.Item>
                                                <span>高级选项：</span>
                                                <Checkbox
                                                    checked={this.state.seniorIndeterminate}
                                                    onChange={this.seniorChange}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item>
                                                {this.moreChange()}
                                            </Form.Item>
                                        </Col>
                                    </Fragment>
                                    : <div/>
                                }
                            </Row>
                        </Form>
                    </Modal>
                </div>
                <Tabs
                    hideAdd
                    onChange={this.onChange}
                    activeKey={this.state.activeKey}
                    type="card"
                    onEdit={this.onEdit}
                >
                    {this.state.app_list.map((pane, key) => (
                        <TabPane
                            tab={pane.inst_name && pane.inst_name.replace('__', '通道')}
                            key={key}
                        >
                            <MqttPane
                                pane={pane}
                                fetch={this.fetch}
                            />
                        </TabPane>
                    ))}
                </Tabs>
            </div>
        );
    }
}

export default Mqtt;
