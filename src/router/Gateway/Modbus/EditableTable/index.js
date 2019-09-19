import React from 'react'
import {Table, Input, Button, Popconfirm, Form, InputNumber, Select} from 'antd';
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
        editing: false
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
                            message: `${title} is required.`
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
    getInput = ()=> {
        console.log(this.props)
        const {dataIndex} = this.props;
        if (dataIndex === 'address') {
           return (
                <InputNumber
                    min={0}
                    max={255}
                    key={dataIndex}
                    ref={node => (this.input = node)}
                    onPressEnter={this.save}
                    onBlur={this.save}
                    disabled={this.props.disabled}
                />
           )
        }
        if (dataIndex === 'device' || dataIndex === 'number') {
            return (
                <Input
                    ref={node => (this.input = node)}
                    onPressEnter={this.save}
                    onBlur={this.save}
                    disabled={this.props.disabled}
                    autoComplete="off"
                />
            )
        }
        if (dataIndex === 'template') {
            return (
                <Select
                    ref={node => (this.input = node)}
                    onPressEnter={this.save}
                    onBlur={this.save}
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

    }
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
                title: 'operation',
                dataIndex: 'operation',
                render: (text, record) =>
                    this.state.dataSource.length >= 1 ? (
                        <Popconfirm title="Sure to delete?"
                            onConfirm={() => this.handleDelete(record.key)}
                        >
                            <Button type="danger"
                                disabled={this.props.disable}
                            >Delete</Button>
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
                    key,
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

    handleAdd = () => {
        const {count, dataSource} = this.state;
        const newData = {
            key: count,
            template: '选择模板',
            number: 0,
            address: 0,
            device: '设备名称'
        };
        this.setState({
            dataSource: [...dataSource, newData],
            count: count + 1
        }, ()=>{
            this.props.getdevs(this.state.dataSource)
        });
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
                            disabled={disabled}
                            {...restProps}
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
                    components={components}
                    rowClassName={() => 'editable-row'}
                    bordered
                    dataSource={dataSource}
                    columns={columns}
                />
                <Button
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