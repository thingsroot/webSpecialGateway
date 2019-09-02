import React, {PureComponent} from 'react';
import echarts from 'echarts/lib/echarts';
import  'echarts/lib/chart/line';
import  'echarts/lib/chart/pie';
import 'echarts/lib/component/legend';
import 'echarts/lib/component/tooltip';
import { Table, Button, Modal } from 'antd';
import { withRouter } from 'react-router-dom';
import http from '../../../../utils/Server';
import './style.scss';
let myFaultTypeChart;

class ExpandedRowRender extends PureComponent {
    state = {
        allData: [],
        data: [],
        inputsMap: {},
        flag: true,
        visible: false,
        barData: [],
        columns: [
            { title: '类型', dataIndex: 'vt', key: 'vt', width: '60px' },
            { title: '名称', dataIndex: 'name', key: 'name' },
            { title: '描述', dataIndex: 'desc', key: 'desc', render (text) {
                return (<span title={text}>{text}</span>)
            }},
            { title: '单位', dataIndex: 'unit', key: 'unit', width: '60px', render (text) {
                return (<span title={text}>{text}</span>)
            }},
            { title: '数值', dataIndex: 'pv', key: 'pv', render (text) {
                return (<span title={text}>{text}</span>)
            }},
            { title: '时间', dataIndex: 'tm', key: 'tm', width: '180px' },
            { title: '质量戳', dataIndex: 'q', key: 'q', width: '60px' },
            {
                title: '操作',
                dataIndex: 'operation',
                key: 'operation',
                width: '120px',
                render: (record, props) => {
                return (
                    <span className="table-operation">
                    <Button onClick={()=>{
                        this.showModal(props)
                    }}
                    >浏览数据</Button>
                    </span>
                )
                }
            }
        ]
    }

    componentDidMount (){
        myFaultTypeChart = null;
        if (myFaultTypeChart && myFaultTypeChart.dispose) {
            myFaultTypeChart.dispose();
        }
        const { inputs } = this.props;
        const { inputsMap } = this.state;

        inputs && inputs.length > 0 && inputs.map( (item) => {
            inputsMap[item.name] = item;
        })
        this.fetch()
        this.timer = setInterval(() => {
            this.fetch()
        }, 3000);

        const { regRefresh, regFilterChangeCB } = this.props;
        if (regRefresh) {
            regRefresh(()=>{
                this.fetch()
            })
        }
        if (regFilterChangeCB) {
            regFilterChangeCB(()=>{
                this.applyFilter()
            })
        }
    }

    componentWillUnmount (){
        const { regRefresh } = this.props;
        if (regRefresh) {
            regRefresh(undefined)
        }
        clearInterval(this.timer)
    }
    applyFilter = ()=>{
        const { filterText } = this.props;
        const { allData } = this.state;
        let newData = [];
        allData && allData.length > 0 && allData.map((item)=>{
            if (item.name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1 ||
                (item.desc && item.desc.toLowerCase().indexOf(filterText.toLowerCase()) !== -1) ) {
                newData.push(item)
            }
        });
        this.setState({data: newData})
    }
    fetch = ()=>{
        const { sn, vsn, inputs, filterText } = this.props;
        inputs;
        http.get('/api/gateway_devf_data?gateway=' + sn + '&name=' + vsn).then(res=>{
            let allData = res.data;
            let newData = [];
            const { inputsMap } = this.state;
            allData && allData.length > 0 && allData.map((item, ind)=>{
                item.sn = sn;
                item.vsn = vsn;
                item.key = ind;
                item.desc = item.desc || inputsMap[item.name].desc;
                if (item.vt === null){
                    item.vt = 'float';
                }
                if (item.name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1 ||
                    (item.desc && item.desc.toLowerCase().indexOf(filterText.toLowerCase()) !== -1) ) {
                    newData.push(item)
                }
            })
            this.setState({
                allData: allData,
                data: newData,
                flag: false
            })
        })
    }
    showModal = (record) => {
        this.setState({
            visible: true,
            record
        });
        if (record.vt === 'int'){
            record.vt = 'int';
        } else if (record.vt === 'string'){
            record.vt = 'string';
        } else {
            record.vt = 'float';
        }
        const data = {
            sn: this.props.sn,
            vsn: this.props.vsn,
            name: record.name,
            vt: record.vt,
            time_condition: 'time > now() - 1h',
            value_method: 'raw',
            group_time_span: '1h',
            _: new Date() * 1
        }
        http.get(`/api/gateways_historical_data?sn=${data.sn}&vsn=${data.vsn}&tag=${data.name}&vt=${data.vt}&start=-10m&value_method=raw&group_time_span=5s&_=${new Date() * 1}`).then(res=>{
            if (!res.ok) {
                return
            }
            const { myCharts } = this.refs;
            let data = [];
            const date = new Date() * 1;
            const length = res.data.length > 120 ? 120 : res.data.length
            for (var i = 0;i < length;i++){
                const hours = new Date(date - (i * 5000)).getHours()
                const min = new Date(date - (i * 5000)).getMinutes()
                const seconds = new Date(date - (i * 5000)).getSeconds();
                data.unshift(hours + ':' + (min < 10 ? '0' + min : min) + ':' + (seconds < 10 ? '0' + seconds : seconds));
            }
            if (res.data && res.data.length > 0 && this.state.record.vt !== 'string') {
                myFaultTypeChart = echarts.init(myCharts);
                myFaultTypeChart.setOption({
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'cross'
                        }
                    },
                    xAxis: {
                        data: data
                    },
                    yAxis: {},
                    series: [
                      {
                        name: '数值',
                        type: 'line',
                        color: '#37A2DA',
                        data: res.data
                      }
                    ]
            });
            } else if (this.state.record.vt === 'string') {
                myCharts.style.textAlin = 'center'
                myCharts.innerHTML = '暂不支持此类数据，请点击更多历史数据查看更多数据。'
            } else {
                myCharts.style.textAlin = 'center'
                myCharts.innerHTML = '暂未获取到数据'
            }
        })
    }
    handleOk = () => {
        const {record} = this.state;
        this.setState({
            visible: false
        });
        this.props.history.push(`/browsinghistory/${record.sn}/${record.vsn}/${record.name}`)
        if (myFaultTypeChart) {
            myFaultTypeChart.dispose();
        }
    }
    handleCancel = () => {
        this.setState({
            visible: false
        });
        if (myFaultTypeChart) {
            myFaultTypeChart.dispose();
        }
    }
    render () {
        return (
            <div>
                <Table
                    style={{scrollbarWidth: '0'}}
                    size="small"
                    rowKey="key"
                    loading={this.state.flag}
                    columns={this.state.columns}
                    dataSource={this.state.data}
                    pagination={false}
                    rowClassName={(record, index) => {
                        let className = 'light-row';
                        if (index % 2 === 0) {
                            className = 'dark-row';
                        }
                        return className;
                    }}
                    scroll={{x: '100%', y: 500}}
                />
                <Modal
                    title={this.state.record ? '变量' + this.state.record.name + '十分钟内数值变化' : ''}
                    visible={this.state.visible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                    width="50%"
                    footer={[
                        <Button key="back"
                            onClick={this.handleCancel}
                        >关闭</Button>,
                        <Button key="submit"
                            type="primary"
                            onClick={this.handleOk}
                        >
                        更多历史数据
                        </Button>
                    ]}
                >
                    <div
                        id="faultTypeMain"
                        ref="myCharts"
                        style={{width: '100%', height: 400, textAlign: 'center', fontSize: 30}}
                    ></div>
                </Modal>
            </div>
        );
    }
}
export default withRouter(ExpandedRowRender);