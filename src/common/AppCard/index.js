import React, { Component } from 'react';
import { Card, Icon, Avatar } from 'antd';
import './style.scss';

const { Meta } = Card;

class AppCard extends Component {
    state = {
        key: 'tab1',
        noTitleKey: 'app'
    };

    onTabChange = (key, type) => {
        //console.log(key, type);
        this.setState({ [type]: key });
    };

    render () {
        return (
            <div className="AppCard">
            <Card
                style={{ width: 300 }}
                cover={
                    <img
                        alt="example"
                        src="https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png"
                    />
                } 
                actions={[
                    <Icon
                        type="setting"
                        key="setting"
                    />,
                    <Icon
                        type="edit"
                        key="edit"
                    />,
                    <Icon
                        type="ellipsis"
                        key="ellipsis"
                    />
                ]}
            >
            <Meta
                avatar={<Avatar src="https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png" />}
                title="Card title"
                description="This is the description"
            />
            </Card>
            </div>
        );
    }
}


export default AppCard;