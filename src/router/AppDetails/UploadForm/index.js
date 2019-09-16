import React, { Component } from 'react';
import {Modal, Form, Input, Checkbox, Upload, Icon, Button, message} from 'antd';
import { withRouter } from 'react-router-dom';
import reqwest from 'reqwest';
const { TextArea } = Input;

const CollectionCreateForm = Form.create()(
    @withRouter
    class extends Component {
        state = {
            fileList: [],
            uploading: false,
            initialVersion: this.props.initialValue + 1
        };
        handleCreate = () => {
            const { fileList } = this.state;
            const formData = new FormData();
            if (fileList.length > 1) {
                message.error('不能上传多个文件')
                return
            }
            if (fileList.length === 0) {
                message.error('请选择要上传的文件')
                return
            }
            fileList.forEach((file) => {
                formData.append('app_file', file);
            });
            const form = this.props.form;
            form.validateFields((err, values) => {
                if (err) {
                    return;
                }
                formData.append('app', this.props.app);
                formData.append('version', values.version);
                formData.append('comment', values.comment);
                reqwest({
                    url: '/api/applications_versions_create',
                    method: 'post',
                    processData: false,
                    data: formData,
                    success: () => {
                        this.setState({
                            fileList: [],
                            uploading: false
                        });
                        message.success('上传成功.');
                        this.setState({
                            initialVersion: values.version + 1
                        })
                        this.props.onSuccess()
                    },
                    error: () => {
                        this.setState({
                            uploading: false
                        });
                        message.error('上传失败.');
                    }
                });
                form.resetFields();
            });
        };

        checkChange = (e)=>{
            console.log(e.target.checked);
            console.log(this)
        };

        render () {
            const { visible, onCancel, form, initialVersion } = this.props;
            initialVersion;
            const { fileList } = this.state;
            const { getFieldDecorator } = form;
            const isChecked = (rule, value, callback) => {
                if (value !== true) {
                    callback('请您同意使用条款！')
                }
                callback();
            };
            const props = {
                multiple: false,
                action: '/api/api/v1/applications.versions.create',
                onRemove: (file) => {
                    this.setState((state) => {
                        const index = state.fileList.indexOf(file);
                        const newFileList = state.fileList.slice();
                        newFileList.splice(index, 1);
                        return {
                            fileList: newFileList
                        };
                    });
                },
                beforeUpload: (file) => {
                    this.setState(state => ({
                        fileList: [...state.fileList, file]
                    }));
                    return false;
                },
                fileList
            };
            return (
                <Modal
                    visible={visible}
                    title="上传新版本"
                    okText="确定"
                    cancelText="取消"
                    maskClosable={false}
                    onCancel={onCancel}
                    onOk={this.handleCreate}
                >
                    <Form layout="vertical">
                        <Form.Item label="版本">
                            {getFieldDecorator('version', { initialValue: this.state.initialVersion }, {
                                rules: [{ required: true, message: '新版本号大于旧版本号！' }]
                            })(
                                <Input
                                    type="number"
                                    min={1}
                                />
                            )}
                        </Form.Item>
                        <Form.Item label="上传文件">
                            {getFieldDecorator('app_file', {
                                rules: [{ required: true, message: '请上传文件！' }]
                            })(
                                <Upload {...props}>
                                    <Button>
                                        <Icon type="upload" /> Select File
                                    </Button>
                                </Upload>
                            )}
                        </Form.Item>
                        <Form.Item label="更新日志">
                            {getFieldDecorator('comment', {
                                rules: [{ required: true, message: '请填写日志！' }]
                            })(
                                <TextArea rows={4} />
                            )}
                        </Form.Item>
                        <Form.Item>
                            {getFieldDecorator('agreement', {
                                rules: [{ validator: isChecked}]
                            })(
                                <Checkbox
                                    wrappedComponentRef={(btn) => this.form = btn}
                                    onChange={this.checkChange}
                                >我同意使用条款</Checkbox>
                            )}
                        </Form.Item>
                    </Form>
                </Modal>
            );
        }
    });
export default CollectionCreateForm;