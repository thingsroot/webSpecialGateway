import React, {Component} from 'react';
import { Button } from 'antd';
import UploadForm from '../UploadForm';

const block = {
    display: 'block',
    cursor: 'pointer'
};
const none = {
    display: 'none',
    cursor: 'pointer'
};

class VersionList extends Component {
    state = {
        user: '',
        name: '',
        visible: false
    }
    showModal = () => {
        this.setState({visible: true})
    };

    handleCancel = () => {
        this.setState({visible: false})
    };
    handleSuccess = () => {
        this.setState({visible: false})
        this.props.onUpdate()
    };

    render () {
        let { app, dataSource, onUpdate, initialVersion } = this.props;
        onUpdate;
        return (
            <div className="versionList">
                <div>
                    <Button
                        type="primary"
                        onClick={this.showModal}
                    >
                        上传新版本
                    </Button>
                    <UploadForm
                        visible={this.state.visible}
                        initialValue={initialVersion}
                        onCancel={this.handleCancel}
                        onSuccess={this.handleSuccess}
                        app={app}
                    />
                </div>
                <ul>
                    {
                        dataSource && dataSource.length > 0 && dataSource.map((v, key)=>{
                            return <li key={key}>
                                <div><p>版本号：<span className="fontColor">{v.version}</span>
                                    {
                                        v.beta === 0 ? <span>(正式版)</span> : <span>(测试版)</span>
                                    }
                                </p></div>
                                <div><p>更新时间：<span className="fontColor">{v.modified.substr(0, 19)}</span></p>
                                    {
                                        v.meta === 0 ? '' : <span style={this.state.user ? block : none}>发布为正式版本</span>
                                    }
                                </div>
                                <div><p>更新日志：<span className="fontColor">{v.comment}</span></p></div>
                            </li>
                        })

                    }
                </ul>
                <p
                    className="empty"
                    style={dataSource.length > 0 ? none : block}
                >请先上传版本！</p>
            </div>
        )
    }
}
export default VersionList;
