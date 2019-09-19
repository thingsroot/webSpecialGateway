import { Transfer } from 'antd';
import React from 'react';
import { withRouter } from 'react-router-dom';
import http from '../../../../../utils/Server';
@withRouter
class App extends React.Component {
  state = {
    targetKeys: [],
    selectedKeys: [],
    disabled: false,
    mockData: []
  };
  componentDidMount () {
    const { devs } = this.props;
    http.get('/api/gateways_dev_list?gateway=' + this.props.match.params.sn).then(res=>{
      if (res.ok) {
          const dev_list = [];
          if (res.data && res.data.length > 0) {
              res.data.map(item=>{
                  if (item.meta.app_inst.toLowerCase().indexOf('modbus') !== -1) {
                      dev_list.push({
                        key: item.meta.sn,
                        title: item.meta.sn,
                        description: item.meta.description
                      })
                  }
              })
          }
          this.setState({
            mockData: dev_list
          })
      }
      const arr = [];
      devs && devs.length > 0 && devs.map(item=>{
        arr.push(item.sn)
      })
      this.setState({
          loading: false,
          sign: false,
          targetKeys: arr
      })
    })
  }
  handleChange = (nextTargetKeys, direction, moveKeys) => {
    direction, moveKeys;
    this.setState({ targetKeys: nextTargetKeys });
    const arr = [];
    if (nextTargetKeys.length > 0) {
      nextTargetKeys.map((item, key)=>{
        const obj = {
          key: key + 1,
          sn: item
        }
        arr.push(obj)
      })
    }
    this.props.setdevs(arr)
  };

  handleSelectChange = (sourceSelectedKeys, targetSelectedKeys) => {
    this.setState({ selectedKeys: [...sourceSelectedKeys, ...targetSelectedKeys] });
  };
  handleDisable = disabled => {
    this.setState({ disabled });
  };

  render () {
    const { targetKeys, selectedKeys, mockData } = this.state;
    return (
      <div>
        <Transfer
            dataSource={mockData}
            titles={['设备列表', '上传设备列表']}
            targetKeys={targetKeys}
            selectedKeys={selectedKeys}
            onChange={this.handleChange}
            onSelectChange={this.handleSelectChange}
            // onScroll={this.handleScroll}
            render={item => item.title}
            listStyle={{width: '300px'}}
            disabled={this.props.disabled}
            locale={{ itemsUnit: '项'}}
        />
      </div>
    );
  }
}
export default App;