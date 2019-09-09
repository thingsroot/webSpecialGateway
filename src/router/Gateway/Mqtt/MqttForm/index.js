import React from 'react'
import {
    Button,
    Checkbox,
    Col, Collapse,
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

class MqttForm extends React.Component {
    constructor (props) {
        super(props)
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
            userMessage: '',
            seniorIndeterminate: false, //高级选项
            contentText: '',
            visible: false,
            dataSource: [
                // {
                //     key: '0',
                //     name: '',
                // },

            ],
            count: null,
            cycle: NUMBER_CYCLE,
            maxDate: NUMBER_MAXDATE,
            maxQuantity: NUMBER_MAXQUANTITY,
            groupList: [],
            contentClient: '',
            contentClientPw: '',
            fileList: [],
            fileList1: [],
            fileList2: []
        };
    }

    instance = (e) => {
        this.setState({instanceVal: e.target.value})
    }
    getItemsValue = () => {
        const values = this.props.form.getFieldsValue()
        const {cycle, maxDate, maxQuantity, contentText, dataSource, groupList, contentClient, contentClientPw} = this.state
        const result = {
            cycle,
            maxDate,
            maxQuantity,
            contentText,
            dataSource,
            groupList,
            contentClient,
            contentClientPw,
            values
        }

        return result
    }
    handleSubmit = e => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                console.log(values)
            }
        })
    }
    getTextInfo = (file) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = (result) => {
            console.log(result)
            let targetNum = result.target.result;
            // targetNum = targetNum.replace(/[\n\r]/g, '');
            // targetNum = targetNum.replace(/[ ]/g, '');
            this.setState({contentText: targetNum})
        }
        return false;
    };
    getTextInfo1 = (file) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = (result) => {
            let targetNum = result.target.result;
            this.setState({contentClient: targetNum})
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
            this.setState({contentClientPw: targetNum})
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
    onCycle = (values) => {
        this.setState({cycle: values})
    }
    onMaxDate = (values) => {
        this.setState({maxDate: values})
    }
    onMaxQuantity = (values) => {
        this.setState({maxQuantity: values})
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
        this.setState({groupList: [...checkedValues]})
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
                            <Checkbox.Group
                                style={{width: '100%'}}
                                onChange={this.changeGroup}
                            >
                                <Row className="highSenior">
                                    <Col span={24}>
                                        <Checkbox value="禁止数据上送">禁止数据上送：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox value="事件上送(最小等级)">事件上送（最小等级）：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox value="禁止设备输出">禁止设备输出：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox value="禁止设备指令">禁止设备指令：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox value="禁止设备信息上送">禁止设备信息上送：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox value="禁止上送紧急数据">禁止上送紧急数据：</Checkbox>
                                    </Col>
                                    <Col span={24}>
                                        <Checkbox value="禁止压缩（调试使用">禁止压缩（调试使用）：</Checkbox>
                                    </Col>
                                </Row>
                            </Checkbox.Group>
                        </Form.Item>
                    </Panel>

                </Collapse>
            )
        }
    }

    render () {
        const {getFieldDecorator} = this.props.form;
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
            <Form
                ref="form"
                onSubmit={this.handleSubmit}
                className="login-form login-form-mqtt"
            >
                <Row gutter={24}>
                    <Col span={24}>
                        <Form.Item label="实例名：">
                            {getFieldDecorator('instance', {
                                rules: [{message: '请输入实例名!'}]
                            })(
                                <Input
                                    allowClear
                                    autoComplete="off"
                                />
                            )}
                        </Form.Item>
                        <Divider>服务器信息</Divider>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="MQTT地址：">
                            {getFieldDecorator('mqttAddress', {
                                rules: [{message: '请输入MQTT地址!'}]
                            })(
                                <Input
                                    allowClear
                                    autoComplete="off"
                                />,
                            )}
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="MQTT端口：">
                            {getFieldDecorator('mqttPort', {
                                rules: [{message: '请输入MQTT端口'}]

                            })(
                                <Input
                                    allowClear
                                    autoComplete="off"
                                />,
                            )}
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="MQTT用户(留空使用标准规则)：">
                            {getFieldDecorator('mqttUser', {
                                rules: [{message: '请输入MQTT用户'}]

                            })(
                                <Input
                                    allowClear
                                    autoComplete="off"
                                />,
                            )}
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="MQTT密码(留空使用标准规则)：">
                            {getFieldDecorator('mqttPassword', {
                                rules: [{message: '请输入MQTT密码'}]

                            })(
                                <Input
                                    allowClear
                                    autoComplete="off"
                                />,
                            )}
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="客户端ID(留空使用标准规则)：">
                            {getFieldDecorator('username', {
                                rules: [{message: '请输入客户端ID'}]

                            })(
                                <Input
                                    allowClear
                                    autoComplete="off"
                                />,
                            )}
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="使用TLS：">
                            {getFieldDecorator('rememberUse', {
                                valuePropName: 'checked',
                                initialValue: false
                            })(<Checkbox/>)}
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
                    <Divider>数据传输选项</Divider>
                    <Col span={12}>
                        <Form.Item label="上送周期(秒)：">
                            <InputNumber
                                defaultValue={60}
                                onChange={this.onCycle}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="最大数据间隔(秒)：">
                            <InputNumber
                                defaultValue={300}
                                onChange={this.onMaxDate}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="最大打包数量：">
                            <InputNumber
                                defaultValue={1024}
                                onChange={this.onMaxQuantity}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="开启短线缓存：">
                            {getFieldDecorator('shortCache', {
                                valuePropName: 'checked',
                                initialValue: false
                            })(<Checkbox/>)}
                        </Form.Item>
                    </Col>
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
                            {getFieldDecorator('checkedSenior', {
                                valuePropName: 'checkedSenior',
                                initialValue: this.state.seniorIndeterminate
                            })(<Checkbox onChange={this.seniorChange}/>)}
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item>
                            {this.moreChange()}
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        )
    }
}

export default Form.create({name: 'normal_login'})(MqttForm);
