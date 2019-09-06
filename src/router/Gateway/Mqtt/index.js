import React, {Component} from 'react';
import {
    Tabs,
    Button,
    Modal
} from 'antd';
import './index.css'
import MqttForm from './MqttForm'

const {TabPane} = Tabs;
class Mqtt extends Component {
    constructor (props) {
        super(props);
        this.newTabIndex = 0;
        const panes = [
            {title: 'Mqtt配置1', content: <MqttForm wrappedComponentRef={(form) => this.formRef = form} />, key: '1'},
            {title: 'Mqtt配置2', content: <MqttForm wrappedComponentRef={(form) => this.formRef = form} />, key: '2'}
        ];
        this.state = {
            activeKey: panes[0].key,
            panes
        };
    }
    onChange = activeKey => {
        this.setState({activeKey});
    };
    onEdit = (targetKey, action) => {
        console.log(targetKey, action)
        this[action](targetKey);
    };
    add = () => {
        const {panes} = this.state;
        const activeKey = `newTab${this.newTabIndex++}`;
        const title = 'Mqtt配置' + (this.state.panes.length + 1);
        // panes.push({title, content: 'New Tab Pane' + activeKey, key: activeKey});
         panes.push({title, content: <MqttForm wrappedComponentRef={(form) => this.formRef = form} />, key: activeKey});
        this.setState({panes, activeKey, visible: true});
    };
    handleSubmit = () => {
        //this.setState({visible: false})
      console.log(this.formRef.getItemsValue())
    };
    handleCancel = () => {
        this.setState({visible: false})
    };
    render () {
        return (
            <div className="parents-mqtt">
                <div style={{marginBottom: 16}}>
                    <Button onClick={this.add}>ADD</Button>
                    <Modal
                        title="ADD"
                        width="800px"
                        visible={this.state.visible}
                        onOk={this.handleSubmit}
                        onCancel={this.handleCancel}
                    >
                        <MqttForm
                            wrappedComponentRef={(form) => this.formRef = form}
                        />
                    </Modal>
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
