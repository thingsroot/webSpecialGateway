import React, { Component } from 'react';
import { Tabs, Button } from 'antd';

const { TabPane } = Tabs;
class Mqtt extends Component {
    constructor (props) {
        super(props);
        this.newTabIndex = 0;
        const panes = [
          { title: 'Mqtt配置1', content: 'Content of Tab Pane 1', key: '1' },
          { title: 'Mqtt配置2', content: 'Content of Tab Pane 2', key: '2' }
        ];
        this.state = {
          activeKey: panes[0].key,
          panes
        };
      }
      onChange = activeKey => {
        this.setState({ activeKey });
      };
      onEdit = (targetKey, action) => {
          console.log(targetKey, action)
        this[action](targetKey);
      };
      add = () => {
        const { panes } = this.state;
        const activeKey = `newTab${this.newTabIndex++}`;
        const title = 'Mqtt配置' + (this.state.panes.length + 1);
        panes.push({ title, content: 'New Tab Pane' + activeKey, key: activeKey });
        this.setState({ panes, activeKey });
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
      render () {
        return (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Button onClick={this.add}>ADD</Button>
            </div>
            <Tabs
                hideAdd
                onChange={this.onChange}
                activeKey={this.state.activeKey}
                type="editable-card"
                onEdit={this.onEdit}
            >
              {this.state.panes.map(pane => (
                <TabPane
                    tab={pane.title}
                    key={pane.key}
                >
                  {pane.content}
                </TabPane>
              ))}
            </Tabs>
          </div>
        );
      }
}

export default Mqtt;