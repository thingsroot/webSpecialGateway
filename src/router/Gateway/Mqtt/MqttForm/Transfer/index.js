import { Transfer } from 'antd';
import React from 'react';
import { withRouter } from 'react-router-dom';
import http from '../../../../../utils/Server';
// const mockData = [];
// for (let i = 0; i < 20; i++) {
//   mockData.push({
//     key: i.toString(),
//     title: `content${i + 1}`,
//     description: `description of content${i + 1}`
//   });
// }

// const oriTargetKeys = mockData.filter(item => +item.key % 3 > 1).map(item => item.key);
@withRouter
class App extends React.Component {
  state = {
    targetKeys: [],
    selectedKeys: [],
    disabled: false,
    mockData: []
  };
  componentDidMount () {
    console.log(this.props)
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
          // this.props.store.gatewayInfo.setDevices(dev_list);
          // this.setData(dev_list)
          console.log(dev_list)
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
      }, ()=>{
        console.log(this.state.targetKeys)
      })
    })
  }
  handleChange = (nextTargetKeys, direction, moveKeys) => {
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
    console.log('targetKeys: ', nextTargetKeys);
    console.log('direction: ', direction);
    console.log('moveKeys: ', moveKeys);
  };

  handleSelectChange = (sourceSelectedKeys, targetSelectedKeys) => {
    this.setState({ selectedKeys: [...sourceSelectedKeys, ...targetSelectedKeys] });

    console.log('sourceSelectedKeys: ', sourceSelectedKeys);
    console.log('targetSelectedKeys: ', targetSelectedKeys);
  };

//   handleScroll = (direction, e) => {
//     console.log('direction:', direction);
//     console.log('target:', e.target);
//   };

  handleDisable = disabled => {
    this.setState({ disabled });
  };

  render () {
    const { targetKeys, selectedKeys, mockData } = this.state;
    console.log(targetKeys, selectedKeys)
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