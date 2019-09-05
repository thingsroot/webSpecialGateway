import React, { Component } from 'react';
import { Tabs, Button, message, Modal } from 'antd';
import {withRouter} from 'react-router-dom'
import http from '../../../utils/Server';
import ModbusPane from './ModbusPane';
import {ConfigStore} from '../../../utils/ConfigUI'

const { TabPane } = Tabs;
function MatchTheButton (key) {
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
    return name;
}
@withRouter
class Modbus extends Component {
    constructor (props) {
        super(props);
        this.newTabIndex = 0;
        const panes = [
          // { title: 'Modbus配置1', content: 'Content of Tab Pane 1', key: '1' },
          // { title: 'Modbus配置2', content: 'Content of Tab Pane 2', key: '2' }
        ];
        this.state = {
          activeKey: '0',
          panes,
          data: undefined,
          visible: false,
          modalKey: 0,
          app_info: {},
          configStore: new ConfigStore()
        };
      }
      componentDidMount () {
          this.fetch()
      }
      showModal = () => {
        this.setState({
          visible: true
        });
      };

      handleOk = e => {
        console.log(e);
        this.setState({
          visible: false
        });
      };

      handleCancel = e => {
        console.log(e);
        this.setState({
          visible: false,
          modalKey: 0
        });
      };
      onChange = activeKey => {
        this.setState({ activeKey });
      };
      onEdit = (targetKey, action) => {
          console.log(targetKey, action)
        this[action](targetKey);
      };
      add = () => {
        const { data } = this.state;
        const activeKey = `newTab${this.newTabIndex++}`;
        const inst_name = 'Modbus配置' + (this.state.data.length + 1);
        data.push({ inst_name, content: 'New Tab Pane' + activeKey, key: activeKey });
        this.setState({ data, activeKey });
      };
      remove = targetKey => {
        let { activeKey } = this.state;
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
        this.setState({ panes, activeKey });
      };
      fetch = () => {
        // const {gatewayInfo} = this.props.store
        // let enable_beta = gatewayInfo.data.enable_beta
        // if (enable_beta === undefined) {
        //     enable_beta = 0
        // }
        console.log('22')
        http.get('/api/applications_read?app=APP00000025').then(res=>{
          console.log(res)
          if (res.ok) {
            this.setState({app_info: res.data})
          }
        })
        http.get('/api/gateways_app_list?gateway=' + this.props.match.params.sn + '&beta=0').then(res=>{
            if (res.ok){
                const app_list = [];
                if (res.data && res.data.length > 0) {
                    res.data.map(item=>{
                        if (item.inst_name.toLowerCase().indexOf('modbus') !== -1) {
                            app_list.push(item)
                        }
                    })
                // this.props.store.gatewayInfo.setApps(app_list)
                }
                this.setData(app_list)
            } else {
                message.error(res.error)
            }
        })
    }
    setData = (apps)=> {
        this.setState({
            panes: apps
        })
    }
      render () {
          console.log(this.state.data)
        return (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Button onClick={this.showModal}>ADD</Button>
            </div>
            <Modal
                title="Basic Modal"
                visible={this.state.visible}
                onOk={this.handleOk}
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
                        onClick={()=>{
                            if (this.state.modalKey > 0) {
                                this.setState({modalKey: this.state.modalKey - 1})
                            }
                        }}
                    >
                    上一步
                </Button>,
                    <Button
                        key="2"
                        onClick={()=>{
                            if (this.state.modalKey < 2) {
                                this.setState({modalKey: this.state.modalKey + 1})
                            }
                        }}
                    >
                        {
                            MatchTheButton(this.state.modalKey)
                        }
                    </Button>
                  ]}
            >
            </Modal>
            <Tabs
                hideAdd
                onChange={this.onChange}
                activeKey={this.state.activeKey}
                type="editable-card"
                onEdit={this.onEdit}
            >
                {this.state.panes.map(pane => (
                  <TabPane
                      tab={pane.inst_name}
                      key={pane.key}
                  >
                    <ModbusPane/>
                  </TabPane>
                ))}
              </Tabs>
          </div>
        );
      }
}

export default Modbus;