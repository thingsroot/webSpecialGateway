import React, {Fragment} from 'react'
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
    Table,
    Upload
} from 'antd';
import {inject, observer} from 'mobx-react';
import {withRouter} from 'react-router-dom';
import http from '../../../../utils/Server';

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

function cancel () {
    message.error('取消卸载应用');
}

@withRouter
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
            visible: false,
            dataSource: [],
            count: 0,
            fileList: [],
            fileList1: [],
            fileList2: [],
            disabled: true,
            openDefault: false,
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
            const {conf} = this.props.pane;
            this.setState({
                options: conf.options,
                mqtt: conf.mqtt,
                has_options_ex: conf.has_options_ex === 'yes'
            })
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
        this.setState({dataSource: newDate})
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
        this.setSetting('mqttForm', [...checkedValues], 'groupList')
    };

    moreChange () {
        if (this.state.seniorIndeterminate) {
            return (
                <Form.Item>
                    {/* <Checkbox.Group
                                style={{width: '100%'}}
                                onChange={this.changeGroup}
                            > */}
                    <Row className="highSenior">
                        <Col span={24}>
                            <Checkbox
                                disabled={this.state.disabled}
                                value="禁止数据上送"
                                checked={this.state.options_ex.diable_data}
                                onChange={(e) => {
                                    this.setSetting('options_ex', e.target.checked, 'diable_data')
                                }}
                            >禁止数据上送：</Checkbox>
                        </Col>
                        <Col
                            span={24}
                            style={{display: 'flex'}}
                        >
                            <label
                                className={this.state.disabled ? 'disableColor' : ''}
                                style={{lineHeight: '30px', marginLeft: '7px'}}
                            >事件上送（最小等级）：</label>
                            <Input
                                style={{width: 150}}
                                value={this.state.options_ex.upload_event}
                                disabled={this.state.disabled}
                                onChange={(e) => {
                                    this.setSetting('options_ex', e.target.value, 'upload_event')
                                }}
                            />
                        </Col>
                        <Col span={24}>
                            <Checkbox
                                // value="禁止设备输出"
                                checked={this.state.options_ex.disable_output}
                                disabled={this.state.disabled}
                                onChange={(e) => {
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
                                onChange={(e) => {
                                    this.setSetting('options_ex', e.target.checked, 'diable_command')
                                }}
                            >禁止设备指令：</Checkbox>
                        </Col>
                        <Col span={24}>
                            <Checkbox
                                value="禁止设备信息上送"
                                checked={this.state.options_ex.disable_devices}
                                disabled={this.state.disabled}
                                onChange={(e) => {
                                    this.setSetting('options_ex', e.target.checked, 'disable_devices')
                                }}
                            >禁止设备信息上送：</Checkbox>
                        </Col>
                        <Col span={24}>
                            <Checkbox
                                value="禁止上送紧急数据"
                                checked={this.state.options_ex.disable_data_em}
                                disabled={this.state.disabled}
                                onChange={(e) => {
                                    this.setSetting('options_ex', e.target.checked, 'disable_data_em')
                                }}
                            >禁止上送紧急数据：</Checkbox>
                        </Col>
                        <Col span={24}>
                            <Checkbox
                                value="禁止压缩（调试使用"
                                checked={this.state.options_ex.disable_compress}
                                disabled={this.state.disabled}
                                onChange={(e) => {
                                    this.setSetting('options_ex', e.target.checked, 'disable_compress')
                                }}
                            >禁止压缩（调试使用）：</Checkbox>
                        </Col>
                    </Row>
                    {/* </Checkbox.Group> */}
                </Form.Item>
            )
        }
    }

    toggleDisable = () => {
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
            http.post('/api/gateways_applications_conf', data).then(res => {
                if (res.ok) {
                    let title = '配置应用' + data.inst + '请求'
                    message.info(title + '等待网关响应!')
                    this.props.store.action.pushAction(res.data, title, '', data, 10000, () => {
                        this.props.fetch()
                    })
                }
            })
        }
        this.setState({disabled: !this.state.disabled})
    };
    removeApp = () => {
        const data = {
            gateway: this.props.match.params.sn,
            inst: this.props.pane.inst_name,
            id: `app_remove/${this.props.match.params.sn}/${this.props.pane.inst_name}/${new Date() * 1}`
        }
        http.post('/api/gateways_applications_remove', data).then(res => {
            if (res.ok) {
                let title = '卸载应用' + data.inst + '请求'
                message.info(title + '等待网关响应!')
                this.props.store.action.pushAction(res.data, title, '', data, 10000, () => {
                    this.props.fetch()
                    this.props.setActiveKey('0')
                })
            }
        })
    }

    render () {
        // const {getFieldDecorator} = this.props.form;
        const {dataSource, fileList, fileList1, fileList2, disabled, mqtt, options} = this.state;
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
            <Form
                layout="inline"
                className="login-form login-form-mqtt"
            >
                <Button
                    style={{marginLeft: '10pxs', marginRight: '20px'}}
                    type="primary"
                    onClick={this.toggleDisable}
                >
                    {!this.state.disabled ? '保存' : '编辑'}
                </Button>
                {
                    !disabled
                        ? <Button
                            style={{
                                marginRight: '20px'
                            }}
                            onClick={() => {
                                this.setState({disabled: true})
                            }}
                        >
                            取消编辑
                        </Button>
                        : ''
                }

                <Popconfirm
                    title="确定要删除应用吗?"
                    onConfirm={this.removeApp}
                    onCancel={cancel}
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
                <Divider>服务器信息</Divider>
                <Row>
                    <Col span={8}>
                    <Form.Item label="MQTT地址：">
                        <Input
                            allowClear={!disabled}
                            autoComplete="off"
                            disabled={disabled}
                            value={mqtt && mqtt.server ? mqtt.server : ''}
                            onChange={(e) => {
                                this.setSetting('mqtt', e.target.value, 'server')
                            }}
                        />
                    </Form.Item>
                    </Col>
                    <Col span={8}>
                    <Form.Item label="MQTT端口：">
                        <Input
                            allowClear={!disabled}
                            autoComplete="off"
                            disabled={disabled}
                            value={mqtt && mqtt.port ? mqtt.port : ''}
                            onChange={(e) => {
                                this.setSetting('mqtt', e.target.value, 'port')
                            }}
                        />
                    </Form.Item>
                    </Col>
                    <Col span={8}>
                    <Form.Item label="???：">
                        <Checkbox
                            disabled={disabled}
                            checked={this.state.openDefault}
                            onChange={(e) => {
                                this.setState({
                                    openDefault: e.target.checked
                                })
                            }}
                        />
                    </Form.Item>
                    </Col>
                    {
                        this.state.openDefault
                            ? <Fragment>
                                <Col span={8}>
                                <Form.Item label="MQTT用户：">
                                    <Input
                                        allowClear={!disabled}
                                        autoComplete="off"
                                        disabled={disabled}
                                        value={mqtt && mqtt.username ? mqtt.username : ''}
                                        onChange={(e) => {
                                            this.setSetting('mqtt', e.target.value, 'username')
                                        }}
                                    />
                                </Form.Item>
                                </Col>
                                <Col span={8}>
                                <Form.Item label="MQTT密码：">
                                    <Input
                                        allowClear={!disabled}
                                        autoComplete="off"
                                        disabled={disabled}
                                        value={mqtt && mqtt.password ? mqtt.password : ''}
                                        onChange={(e) => {
                                            this.setSetting('mqtt', e.target.value, 'password')
                                        }}
                                    />
                                </Form.Item>
                                </Col>
                                <Col span={8}>
                                <Form.Item label="客户端ID：">
                                    <Input
                                        allowClear={!disabled}
                                        autoComplete="off"
                                        disabled={disabled}
                                        value={mqtt && mqtt.client_id ? mqtt.client_id : ''}
                                        onChange={(e) => {
                                            this.setSetting('mqtt', e.target.value, 'client_id')
                                        }}
                                    />
                                </Form.Item>
                                </Col>
                            </Fragment> : null
                    }
                    <Col span={24}>
                    <Form.Item label="使用TLS：">
                        <Checkbox
                            disabled={disabled}
                            checked={this.state.tls_cert}
                            onChange={(e) => {
                                this.setState({
                                    tls_cert: e.target.checked
                                })
                            }}
                        />
                    </Form.Item>
                    </Col>
                    <Col span={8}>
                    <Form.Item label="CA证书(文本)：">
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
                    </Form.Item>
                    </Col>
                    {
                        this.state.tls_cert
                            ? <Fragment>
                                <Col span={8}>
                                <Form.Item label="Client证书(文本)：">
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
                                </Form.Item>
                                </Col>
                                <Col span={8}>
                                <Form.Item label="Client密钥(文本)：">
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
                                </Form.Item>
                                </Col>
                            </Fragment> : null
                    }
                </Row>
                <Divider>数据传输选项</Divider>
                <Col span={6}>
                <Form.Item label="上送周期(秒)：">
                    <InputNumber
                        value={options && options.period ? options.period : ''}
                        disabled={disabled}
                        onChange={(e) => {
                            this.setSetting('options', e, 'period')
                        }}
                    />
                </Form.Item>
                </Col>
                <Col span={6}>
                <Form.Item label="最大数据间隔(秒)：">
                    <InputNumber
                        value={options && options.ttl ? options.ttl : ''}
                        disabled={disabled}
                        onChange={(value) => {
                            this.setSetting('options', value, 'ttl')
                        }}
                    />
                </Form.Item>
                </Col>
                <Col span={6}>
                <Form.Item label="最大打包数量：">
                    <InputNumber
                        value={options && options.data_upload_dpp ? options.data_upload_dpp : ''}
                        disabled={disabled}
                        onChange={(value) => {
                            this.setSetting('options', value, 'data_upload_dpp')
                        }}
                    />
                </Form.Item>
                </Col>
                <Col span={6}>
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
                <Divider>需要上传的设备列表</Divider>
                <Form.Item label="需要上传的设备列表">
                    <div>
                        <Button
                            onClick={this.handleAdd}
                            type="primary"
                            style={{marginBottom: 16}}
                            disabled={disabled}
                        >Add</Button>
                        <Table
                            components={components}
                            rowClassName={() => 'editable-row'}
                            bordered
                            dataSource={dataSource}
                            columns={columns}
                        />
                    </div>
                </Form.Item>
                <Divider>高级选项</Divider>
                <Form.Item>
                    <span>高级选项：</span>
                    <Checkbox
                        checked={this.state.seniorIndeterminate}
                        onChange={this.seniorChange}
                        disabled={disabled}
                    />
                </Form.Item>
                <Form.Item>
                    {this.moreChange()}
                </Form.Item>
                <br/>
                <Button
                    style={{marginLeft: '10pxs', marginRight: '20px'}}
                    type="primary"
                    onClick={this.toggleDisable}
                >
                    {!this.state.disabled ? '保存' : '编辑'}
                </Button>
                {
                    !disabled
                        ? <Button
                            style={{
                                marginRight: '20px'
                            }}
                            onClick={() => {
                                this.setState({disabled: true})
                            }}
                        >
                            取消编辑
                        </Button>
                        : ''
                }

                <Popconfirm
                    title="确定要删除应用吗?"
                    onConfirm={this.removeApp}
                    onCancel={cancel}
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
            </Form>
        )
    }
}

export default MqttForm;