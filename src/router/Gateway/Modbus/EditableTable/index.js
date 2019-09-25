import React from 'react'
import {Table, Input, Button, Popconfirm, Form, InputNumber, Select, message} from 'antd';
import { inject, observer} from 'mobx-react';
const EditableContext = React.createContext();
const { Option } = Select;
import './index.scss'
const EditableRow = ({form, index, ...props}) => (
    <EditableContext.Provider
        value={form}
        index={index}
    >
        <tr {...props} />
    </EditableContext.Provider>

);
const EditableFormRow = Form.create()(EditableRow);
@inject('store')
@observer
class EditableCell extends React.Component {
    state = {
        editing: false,
        parentDisabled: false
    }
    toggleEdit = () => {
        const editing = !this.state.editing;
        this.setState({editing}, () => {
            if (editing) {
                this.input.focus();
            }
        });
    };

    save = e => {
        e;
        const {record, handleSave} = this.props;
        console.log(record, handleSave)
        console.log(this.state.parentDisabled, 'parent') //false 重复
        this.form.validateFields((error, values) => {
            // if (error && error[e.currentTarget.id]) {
            if (error) {
                return;
            }
            this.toggleEdit();
            handleSave({...record, ...values});
        });
        // const value = e.target.value;
        // const {record, handleSave, datasource, dataIndex} = this.props;
        // let detection = false;
        // // this.props.toFatherValue(this.state.parentDisabled)
        // console.log(this.state.parentDisabled, 'parent')
        // datasource.map(item=>{
        //     console.log(item[dataIndex], value, record)
        //     if (item[dataIndex] === value && item.key !== record.key) {
        //         detection = true;
        //     }
        // })
        // console.log(detection)
        // if (!detection) {
        //     this.form.validateFields((error, values) => {
        //         if (error && error[e.currentTarget.id]) {
        //             return;
        //         }
        //         this.toggleEdit();
        //         handleSave({...record, ...values});
        //     });
        // } else {
        //     message.info('设备值不能重复，请重新输入')
        // }
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
                            message: `${title} is required.`
                        },
                        {
                            pattern: /^[0-9a-zA-Z_]+$/,
                            message: `${title}请输入正确内容`
                        },
                        {
                            validator: this.checkUnName()
                        }
                    ],
                    initialValue: record[dataIndex]
                })(this.getInput())}
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
    checkUnName () {
        return (rule, value, callback)=> {
            rule, value;
            if (rule.field === 'address') {
                if (this.address(value)) {
                    this.setState({parentDisabled: true})
                    callback('重复')
                } else {
                    callback()
                }
            }
            if (rule.field === 'device') {
                if (this.device(value)) {
                    this.setState({parentDisabled: true})
                    callback('重复')
                } else {
                    callback()
                }
            }
            if (rule.field === 'number') {
                if (this.number(value)) {
                    this.setState({parentDisabled: true})
                    callback('重复')
                } else {
                    callback()
                }
            }
        }
    }
    address = value =>this.props.datasource.some(item=>item.address === value)
    device = value =>this.props.datasource.some(item=>item.device === value)
    number = value =>this.props.datasource.some(item=>item.number === value)
    getInput = ()=> {
        const {dataIndex} = this.props;
        if (dataIndex === 'address') {
            return (
                    <InputNumber
                        min={0}
                        max={247}
                        key={dataIndex}
                        ref={node => (this.input = node)}
                        // onPressEnter={this.save}
                        onChange={this.save}
                        disabled={this.props.disabled}
                    />
            )
        }
        if (dataIndex === 'device' || dataIndex === 'number') {
            return (
                <Input
                    ref={node => (this.input = node)}
                    // onPressEnter={this.save}
                    onChange={this.save}
                    disabled={this.props.disabled}
                    autoComplete="off"
                />
            )
        }
        if (dataIndex === 'template') {
            return (
                <Select
                    ref={node => (this.input = node)}
                    // onPressEnter={this.save}
                    onChange={this.save}
                    initialValue=""
                    disabled={this.props.disabled}
                    style={{ width: 120 }}
                >
                    {
                        this.props.list && this.props.list.length > 0
                            ? this.props.list.map((item, key) => {
                                return (
                                    <Option
                                        value={item.id}
                                        key={key}
                                    >{item.name}</Option>
                                )
                            })
                            : ''
                    }
                </Select>
            )
        }

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
        dataIndex, title, record, index, handleSave;
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

class EditableTable extends React.Component {
    constructor (props) {
        super(props);
        this.columns = [
            {
                title: '地址',
                dataIndex: 'address',
                editable: true
            },
            {
                title: '设备名称',
                dataIndex: 'device',
                editable: true

            },
            {
                title: '设备序列号',
                dataIndex: 'number',
                editable: true
            },
            {
                title: '模板',
                width: '30%',
                dataIndex: 'template',
                editable: true
            },
            {
                title: '操作',
                dataIndex: 'operation',
                render: (text, record) =>
                    this.state.dataSource.length >= 1 ? (
                        <Popconfirm
                            title="确定要删除吗?"
                            okText="确定"
                            cancelText="取消"
                            onConfirm={() => this.handleDelete(record.key)}
                        >
                            <Button
                                type="danger"
                                disabled={this.props.disable}
                            >删除</Button>
                        </Popconfirm>
                    ) : null
            }
        ];
        this.state = {
            dataSource: [
                // {
                //     key: '0',
                //     number: '0',
                //     template: '选择模板',
                //     address: '0',
                //     device: '设备名称'
                // }
            ],
            count: 0
        };
    }
    componentDidMount () {
        if (this.props.devs && this.props.devs.length > 0) {
            const arr = [];
            this.props.devs.map((item, key)=>{
                const obj = {
                    key: key,
                    number: item.sn,
                    template: item.tpl,
                    address: item.unit,
                    device: item.name
                }
                arr.push(obj)
            })
            this.setState({dataSource: arr})
        }
    }
    handleDelete = key => {
        const dataSource = [...this.state.dataSource];
        this.setState({dataSource: dataSource.filter(item => item.key !== key)}, ()=>{
            this.props.getdevs(this.state.dataSource)
        });
    };
    ForeachName = (names, arr) => {
        let name = names
        console.log(name, arr)
        let list = [];
        list = arr.filter(item=> item.device === name);
        let num = Number(name.split('device')[1]) + 1 + Math.floor(Math.random() * 100);
        // console.log(name.split('device'))
        if (list.length > 0) {
            name = 'device' + num;
                return name;
        } else {
            return name;
        }
    }
    handleAdd = () => {
        const {count, dataSource} = this.state;
        if (this.props.templateList.length) {
            const device = this.ForeachName(`device${count + 1}`, dataSource);
            console.log(device)
            const newData = {
                key: dataSource.length + 1,
                template: this.props.templateList[0].name,
                number: parseInt(Math.random() * 147),
                address: parseInt(Math.random() * 100),
                device
            };
            this.setState({
                dataSource: [...dataSource, newData],
                count: count + 1
            }, ()=>{
                this.props.getdevs(this.state.dataSource)
            });
        } else {
            message.info('请先选择模板，再添加设备列表')
            return false
        }
    };

    handleSave = row => {
        const newData = [...this.state.dataSource];
        const index = newData.findIndex(item => row.key === item.key);
        const item = newData[index];
        newData.splice(index, 1, {
            ...item,
            ...row
        });
        this.setState({dataSource: newData}, ()=>{
            this.props.getdevs(this.state.dataSource)
        });
    };
    render () {
        const list = this.props.templateList;
        const disabled = this.props.disable;
        const {dataSource} = this.state;
        const components = {
            body: {
                row: EditableFormRow,
                // cell: EditableCell
                cell: function (restProps) {
                    return (
                        <EditableCell
                            list={list}
                            datasource={dataSource}
                            disabled={disabled}
                            {...restProps}
                            // toFatherValue={this.getChildValue}
                        />
                    )
                }
            }
        };
        const columns = this.columns.map(col => {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: record => {
                    return  ({
                        record,
                        editable: col.editable,
                        dataIndex: col.dataIndex,
                        title: col.title,
                        handleSave: this.handleSave
                    })
                }
            }
        });
        return (
            <div className="editableTable">
                <Table
                    rowKey="key"
                    components={components}
                    rowClassName={() => 'editable-row'}
                    bordered
                    dataSource={dataSource}
                    columns={columns}
                    pagination={false}
                />
                <Button
                    style={{marginTop: '10px'}}
                    onClick={this.handleAdd}
                    disabled={this.props.disable}
                    type="primary"
                >
                    添加设备列表
                </Button>
            </div>
        );
    }
}

export default EditableTable;