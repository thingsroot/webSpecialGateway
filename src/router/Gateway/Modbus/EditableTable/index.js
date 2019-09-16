import React from 'react'
import {Table, Input, Button, Popconfirm, Form, InputNumber, Select} from 'antd';
import { inject, observer} from 'mobx-react';
const EditableContext = React.createContext();
const { Option } = Select;

const EditableRow = ({form, index, ...props}) => (
    <EditableContext.Provider
        value={form}
        index={index}
    >
        {console.log(props)}
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
        console.log(form, 'form')
        console.log(this.props.store)
        console.log(this.props)
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
        {console.log(record)}
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
        const {dataIndex} = this.props;
        console.log(dataIndex, 'index')
        if (dataIndex === 'address') {
           return (
                <InputNumber
                    min={0}
                    max={255}
                    ref={node => (this.input = node)}
                    onPressEnter={this.save}
                    onBlur={this.save}
                />
           )
        }
        if (dataIndex === 'device' || dataIndex === 'number') {
            return (
                <Input
                    ref={node => (this.input = node)}
                    onPressEnter={this.save}
                    onBlur={this.save}
                />
            )
        }
        if (dataIndex === 'template') {
            console.log(this.props)
            return (
                <Select
                    ref={node => (this.input = node)}
                    onPressEnter={this.save}
                    onBlur={this.save}
                    defaultValue=""
                    style={{ width: 120 }}
                >
                    {
                        this.props.list && this.props.list.length > 0
                        ? this.props.list.map((item, key) => {
                            return (
                                <Option
                                    value={item.name}
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
        console.log(this.props)
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
                            <Button type="danger">Delete</Button>
                        </Popconfirm>
                    ) : null
            }
        ];

        this.state = {
            dataSource: [
                {
                    key: '0',
                    number: '0',
                    template: '选择模板',
                    address: '0',
                    device: '设备名称'
                }
            ],
            count: 0
        };
    }
    componentDidMount (){
        console.log(this.props)
    }

    handleDelete = key => {
        const dataSource = [...this.state.dataSource];
        this.setState({dataSource: dataSource.filter(item => item.key !== key)});
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
        this.setState({dataSource: newData});
    };
    render () {
        const list = this.props.templateList;
        const {dataSource} = this.state;
        const components = {
            body: {
                row: EditableFormRow,
                // cell: EditableCell
                cell: function (restProps) {
                    return (
                        <EditableCell
                            list={list}
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
            console.log(col)
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
        });
        return (
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
        );
    }
}

export default EditableTable;