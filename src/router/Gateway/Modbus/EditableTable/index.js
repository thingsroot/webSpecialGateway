import React from 'react'
import './index.scss'
import { Table, Input, Select, Button, Form} from 'antd';

const EditableContext = React.createContext()

class EditableTable extends React.Component {
    constructor (props) {
        super(props);
        this.columns = []
        this.state = {
            count: 0
        };
    }
    componentDidMount () {
        const { dataSource, tableColumns} = this.props;
        if (dataSource !== undefined) {
            let max_key = 0;
            dataSource.map(item => max_key < item.key ? max_key = item.key : max_key)
            this.setState({count: max_key + 1})
        } else {
            this.props.config.setValue([])
        }
        if (tableColumns === undefined) {
            return
        }
        let copy_columns = []
        tableColumns.map((col, index) => {
            index;
            copy_columns.push({
                id: col.id,
                title: col.title,
                dataIndex: col.dataIndex,
                editable: col.editable,
                columnType: col.columnType,
                columnReference: col.columnReference,
                values: col.values,
                depends: col.depends,
                configStore: this.props.configStore
            })
        });
        copy_columns.push({
            title: '操作',
            dataIndex: '__operation',
            render: (text, record)=> {
                return (
                    this.props.dataSource.length >= 1 ? (
                        <Button
                            type="primary"
                            onClick={()=> {
                                this.handleDelete(record.key)
                            }}
                        >
                            删除
                        </Button>
                    ) : null
                )
            }
        });
        this.columns = copy_columns
    }

    handleDelete = key => {
        let newData = [...this.props.dataSource];
        newData = newData.filter(item=> item.key !== key)
        this.props.config.setValue(newData)
        this.props.onChange()
    };

    handleAdd = () => {
        const { count } = this.state;
        const { tableColumns, dataSource } = this.props
    }

    render () {
        const { config, tableColumns, onChange, dataSource } = this.props;
        config, tableColumns, onChange

        const components = {
            body: {
                row: EditableRow,
                cell: EditableCell
            }
        };
        const columns = this.columns.map(col=> {
            if (!col.editable) {
                return col;
            }
            return {
                ...col,
                onCell: record => ({
                    record,
                    editable: col.editable,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    columnType: col.columnType,
                    columnReference: col.columnReference,
                    values: col.values,
                    depends: col.depends,
                    configStore: col.configStore,
                    handleSave: this.handleSave
                })
            };
        });
        return (
            <div>
                <Button
                    onClick={this.handleAdd}
                    type="primary"
                    style={{marginButton: 16}}
                >
                    Add
                </Button>
                <Table
                    rowKey="key"
                    components={components}
                    rowClassName={()=> 'editable-row'}
                    bordered
                    dataSource={dataSource}
                    columns={columns}
                />
            </div>
        )
    }
}
export default EditableTable;