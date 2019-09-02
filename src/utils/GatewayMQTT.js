import {observable, action} from 'mobx'
import Cookie from 'mobx-cookie'
import mqtt from 'mqtt';
import {message} from 'antd'
import { getLocalTime } from './time'


function makeid () {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 8; i++){
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function success (){
    console.log('success')
    message.success('连接服务器成功')
}

function error (){
    console.log('error')
    message.success('连接服务器失败')
}

const newMessageChannel = (topic) => {
    var item = observable({
        // observable 属性:
        topic: topic,
        data: [],
        allData: [],
        filter: undefined,
        searchType: 'all',
        isShow: true,
        LogView: [],
        LogViewFlag: true,
        newArrive: 0,
        active: false,
        serviceNode: undefined,
        serviceState: undefined,
        addPortData: [{}],
        PortLength: [],
        proxy: '',
        is_running: false,
        vnet_config: {},
        // 动作:
        setTopic (value) {
            this.topic = value;
        },
        pushData (value) {
            // console.log(value)
            this.allData.push(value)
            if (this.filter === undefined) {
                this.data.push(value)
            } else {
                if (this.isDataApplyToFilter(value)) {
                    this.data.push(value)
                }
            }
            if (!this.isShow) {
                this.newArrive = this.newArrive + 1
            }
        },
        clearData () {
            this.data.clear()
            this.allData.clear()
            this.newArrive = 0
        },
        isDataApplyToFilter (item) {
            if (this.filter) {
                let text = this.filter.toLowerCase()
                if (this.searchType !== 'all') {
                    return item[this.searchType] && item[this.searchType].toLowerCase().indexOf(text) !== -1;
                }
                return (item.id && item.id.toLowerCase().indexOf(text) !== -1) ||
                    (item.content && item.content.toLowerCase().indexOf(text) !== -1) ||
                    (item.direction && item.direction.toLowerCase().indexOf(text) !== -1) ||
                    (item.level && item.level.toLowerCase().indexOf(text) !== -1) ||
                    (item.inst && item.inst.toLowerCase().indexOf(text) !== -1)
            } else {
                return true
            }
        },
        applyFilter () {
            if (this.filter) {
                let text = this.filter.toLowerCase()
                if (this.searchType !== 'all') {
                    this.data = this.allData.filter(item=> item[this.searchType] &&
                        item[this.searchType].toLowerCase().indexOf(text) !== -1);
                } else {
                    this.data = this.allData.filter(item=> (item.id && item.id.toLowerCase().indexOf(text) !== -1) ||
                        (item.content && item.content.toLowerCase().indexOf(text) !== -1) ||
                        (item.direction && item.direction.toLowerCase().indexOf(text) !== -1) ||
                        (item.level && item.level.toLowerCase().indexOf(text) !== -1) ||
                        (item.inst && item.inst.toLowerCase().indexOf(text) !== -1)
                    );
                }
            } else {
                this.data = this.AllData
            }
        },
        setFilter (value) {
            this.filter = value
            this.applyFilter()
        },
        clearFilter () {
            this.filter = undefined
            this.data = this.allData
        },
        setVserialLogFlag (value) {
            this.LogViewFlag = value;
        },
        setSearchType (value) {
            this.searchType = value
            this.applyFilter()
        },
        setShow (value) {
            this.isShow = value
            if (this.isShow) {
                this.newArrive = 0
            }
        },
        setActive (value) {
            this.active = value
        },
        setLogView (value) {
            if (value) {
                this.LogView.push(value)
            } else {
                this.LogView = [];
            }
        },
        setProxy (value) {
            this.proxy = value;
            if (this.proxy && !this.active){
                this.setActive(true)
            }
        },
        setServiceNode (value){
            this.serviceNode = value;
        },
        setServiceState (value){
            this.serviceState = value
        },

        get Data () {
            return this.data
        },
        get AllData () {
            return this.allData
        },
        get ServiceState (){
            return this.serviceState
        },
        get Filter () {
            return this.filter
        },
        get SearchType () {
            return this.searchType
        },
        get NewArrived ()  {
            return this.newArrive
        },
        get Active () {
            return this.active
        },
        get Size () {
            return this.allData.length
        },
        get Service () {
            return this.serviceNode
        },
        get Proxy (){
            return this.proxy
        }
    }, {
        setTopic: action,
        pushData: action,
        clearData: action,
        setFilter: action,
        clearFilter: action,
        setShow: action,
        setActive: action
    });
    return item;
}

const log_content_regex = new RegExp(/^\[(\w+)\]: ::(\w+)::\s+([\s\S]+)$/);
const log_content_regex_2 = new RegExp(/^\[(\w+)\]:([\s\S]+)$/);


class GatewayMQTT {
    _sid = new Cookie('sid');
    _user_id = new Cookie('user_id');
    @observable timer = null;
    @observable die_time = 0;
    @observable localstor = [];
    @observable max_count = 5000;
    @observable flag = true;
    @observable connected = false;
    @observable gateway = '';
    @observable versionMsg = false;
    @observable newVersionMsg = {};
    @observable new_version = 0;
    @observable auth_code = '';
    @observable comm_channel = newMessageChannel('/comm');
    @observable log_channel = newMessageChannel('/log');
    @observable vserial_channel = newMessageChannel('v1/vspax/#');
    @observable vnet_channel = newMessageChannel('v1/vnet/#');
    CharToHex (str) {
        var out, i, len, c, h;

        out = '';
        len = str.length;
        i = 0;
        while (i < len){
            c = str.charCodeAt(i++);
            h = c.toString(16);
            if (h.length < 2){
              h = '0' + h;
            }
            out += h + ' ';
            /*                out += "\\x" + h + " ";
                            if(i > 0 && i % 8 == 0)
                                out += "\r\n";*/
        }
        return out.toUpperCase();
    }
    strToHexCharCode (str) {
        　　if (str === ''){
                return '';
            }
        　　var hexCharCode = [];
        // 　　hexCharCode.push('0x');
        　　for (var i = 0; i < str.length; i++) {
        　　　　hexCharCode.push((str.charCodeAt(i)).toString(16) + ' ');
        　　}
        　　return hexCharCode.join('');
        }
    base64DecodeChars = new Array(
      -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
      52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
      -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
      15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
      -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
      41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);
    base64decode (str) {
        var c1, c2, c3, c4;
        var i, len, out;

        len = str.length;
        i = 0;
        out = '';
        while (i < len) {
            /* c1 */
            do {
                c1 = this.base64DecodeChars[str.charCodeAt(i++) & 0xff];
            } while (i < len && c1 === -1);
            if (c1 === -1){
                break;
            }

            /* c2 */
            do {
                c2 = this.base64DecodeChars[str.charCodeAt(i++) & 0xff];
            } while (i < len && c2 === -1);
            if (c2 === -1){
                break;
            }

            out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

            /* c3 */
            do {
                c3 = str.charCodeAt(i++) & 0xff;
                if (c3 === 61){
                    return out;
                }
                c3 = this.base64DecodeChars[c3];
            } while (i < len && c3 === -1);
            if (c3 === -1){
                break;
            }

            out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

            /* c4 */
            do {
                c4 = str.charCodeAt(i++) & 0xff;
                if (c4 === 61){
                    return out;
                }
                c4 = this.base64DecodeChars[c4];
            } while (i < len && c4 === -1);
            if (c4 === -1){
                break;
            }
            out += String.fromCharCode(((c3 & 0x03) << 6) | c4);
        }
        return out;
    }

    Uint8ArrayToString (fileData){
        var dataString = '';
        for (var i = 0; i < fileData.length; i++) {
        dataString += String.fromCharCode(fileData[i]);
        }
        return dataString
    }
    // Keep the connection for a time (in seconds)
    tick (time) {
        this.die_time = time + 10;
        // let's say post?
    }

    startTimer (){
        this.timer = setInterval(() => {
            this.die_time = this.die_time - 1
            if (this.die_time <= 0){
                this.disconnect()
            }
        }, 1000);
    }
    stopTimer () {
        if (this.timer !== null) {
            clearInterval(this.timer)
            this.timer = null
        }
    }

    onReceiveCommMsg = (msg) => {
        if (this.comm_channel.Size >= this.max_count) {
            if (this.comm_channel.active) {
                message.error(`报文数量超过${this.max_count}条，订阅停止!!`)
                this.unsubscribe('/comm')
                this.comm_channel.setActive(false)
            }
        }
        const obj = {
            time: getLocalTime(msg[1]),
            direction: msg[0].split('/')[1],
            id: msg[0].split('/')[0],
            content: this.base64decode(msg[2])
        }
        this.comm_channel.pushData(obj)
    }
    onReceiveVserialMsg = (msg) => {
        if (msg && msg.length > 0){
            this.vserial_channel.setServiceNode(msg)
        }
    }
    onReceiveLocalVersionMsg = (value) =>{
        this.versionMsg = value;
    }
    onReceiveVserialLogView = (topic, msg) =>{
        const timestamp = Date.parse(new Date());
        const obj = {
            time: new Date(timestamp).toLocaleString('zh', {hour12: false}),
            type: '串口',
            arr: topic.split('/')[4],
            content: msg
        }
        this.vserial_channel.setLogView(obj)
    }
    onReceivePortLength = (data) => {
        this.vserial_channel.PortLength = data;
    }
    onReceiveVserialVersionMsg = (msg)=>{
        this.vserial_channel.newVersionMsg = msg;
    }
    onReceiveaddPortMsg = (msg) => {
        // console.log(this.vserial_channel.addPortData)
        // if (msg && this.vserial_channel.addPortData && this.vserial_channel.addPortData.length === 0) {
        //     this.vserial_channel.addPortData.push(msg)
        // }
        // if (msg && this.vserial_channel.addPortData.length === 1 && this.vserial_channel.addPortData[0].name === msg.name && this.vserial_channel.addPortData[0] !== msg){
        // }
        // if (msg && this.vserial_channel.addPortData.length === 2 && this.vserial_channel.addPortData[1].name === msg.name && this.vserial_channel.addPortData[1] !== msg){
        //     this.vserial_channel.addPortData[1] = msg;
        // }
        if (msg){
            this.vserial_channel.addPortData[0] = msg;

        } else {
            this.vserial_channel.addPortData[0] = {};
        }
    }
    onReceiveLogMsg = (msg) => {
        if (this.log_channel.Size >= this.max_count) {
            if (this.log_channel.active) {
                message.error(`日志数量超过${this.max_count}条，订阅停止!!`)
                this.unsubscribe('/log')
                this.log_channel.setActive(false)
            }
        }

        const groups = log_content_regex.exec(msg[2])
        if (groups) {
            const obj = {
                time: getLocalTime(msg[1]),
                level: msg[0].toUpperCase(),
                id: groups[1],
                inst: groups[2],
                content: groups[3]
            }
            this.log_channel.pushData(obj)
        } else {
            const groups = log_content_regex_2.exec(msg[2])
            if (groups) {
                const obj = {
                    time: getLocalTime(msg[1]),
                    level: msg[0].toUpperCase(),
                    id: groups[1],
                    inst: 'N/A',
                    content: groups[2]
                }
                this.log_channel.pushData(obj)
            } else {
                console.log('Cannot parse this log!!!!')
                const obj = {
                    time: getLocalTime(msg[1]),
                    level: msg[0].toUpperCase(),
                    id: 'N/A',
                    inst: 'N/A',
                    content: msg[2]
                }
                this.log_channel.pushData(obj)
            }
        }
        // const obj = {
        //     time: getLocalTime(msg[1]),
        //     level: msg[0].toUpperCase(),
        //     id: msg[2].split(']:')[0] + ']',
        //     content: msg[2].split(']:')[1]
        // }
        // this.log_channel.pushData(obj)
    }
    onReceiverVnetServiceName = (data) => {
        const arr = [];
        arr.push({
            name: 'frpc_Vnet_service',
            desc: '隧道服务',
            status: data.frpc_Vnet_service
        })
        arr.push({
            name: 'tinc.tofreeioebridge',
            desc: '桥接服务',
            status: data['tinc.tofreeioebridge']
        })
        arr.push({
            name: 'tinc.tofreeioerouter',
            desc: '路由服务',
            status: data['tinc.tofreeioerouter']
        })
            this.vnet_channel.setServiceNode(arr)
    }
    onReceiverVnetServiceState = (data) =>{
        const datas = Object.assign({}, this.vnet_channel.serviceState, data)
        this.vnet_channel.setServiceState(datas)
    }
    unsubscribe (topic) {
        const topic_real = this.gateway + topic;
        if (this.client && this.connected) {
            this.client.unsubscribe(topic_real)
        }
        if (topic === '/log') {
            this.log_channel.setActive(false)
        }
        if (topic === '/comm') {
            this.comm_channel.setActive(false)
        }
        if (topic === 'v1/vspax/#') {
            this.vserial_channel.setActive(false)
        }
        if (topic === 'v1/vnet/#') {
            this.vnet_channel.setActive(false)
        }
        if (topic === 'v1/vspax/VSPAX_STREAM/#') {
            this.client.unsubscribe(topic)
        }
    }
    disconnect (clear_data) {
        this.stopTimer()
        this.gateway = ''
        this.die_time = 0
        if (this.client){
            this.client.end()
            this.client = null;
            this.connected = false;
            this.log_channel.setActive(false)
            this.comm_channel.setActive(false)
            this.vserial_channel.setActive(false)
            this.vnet_channel.setActive(false)
        }
        if (clear_data) {
            this.log_channel.clearData()
            this.comm_channel.clearData()
            this.vserial_channel.clearData()
            this.vnet_channel.clearData()
        }
    }
    connect (sn, topic, flag){
        this.gateway = sn;
        this.die_time = 120; // 120 seconds
        const options = {
            connectTimeout: 4000, // 超时时间
            // 认证信息
            clientId: 'webclient-' + makeid(),
            username: this._user_id.value,
            password: this._sid.value,
            keepAlive: 6000,
            timeout: 3,
            onSuccess: success,
            onFailure: error
        }
        const topic_real = sn + topic;
        if (this.client && this.connected) {
            this.client.subscribe(topic_real, 1)
            if (topic === '/log') {
                this.log_channel.setActive(true)
            }
            if (topic === '/comm') {
                this.comm_channel.setActive(true)
            }
            if (topic === 'v1/vspax/#') {
                this.vserial_channel.setActive(true)
            }
            if (topic === 'v1/vnet/#') {
                this.vnet_channel.setActive(true)
            }
            return
        }
        const url = flag ? 'ws://127.0.0.1:7884/mqtt' : 'wss://cloud.thingsroot.com/ws';
        this.client = mqtt.connect(url, options)
        this.client.on('connect', ()=>{
            message.success('连接服务器成功')
            this.connected = true
            this.client.subscribe(topic_real, 1)
            if (topic === '/log') {
                this.log_channel.setActive(true)
            }
            if (topic === '/comm') {
                this.comm_channel.setActive(true)
            }
            if (topic === 'v1/vspax/#') {
                this.vserial_channel.setActive(true)
                this.client.subscribe(['v1/update/api/+', 'v1/vspax/#'])
                this.client.publish('v1/update/api/servers_list', JSON.stringify({'id': 'server_list/' + new Date() * 1}))
                this.client.publish('v1/update/api/version', JSON.stringify({'id': 'get_new_version/' + new Date() * 1}))
            }
            if (topic === 'v1/vnet/#'){
                this.vserial_channel.setActive(true)
                this.client.subscribe(['v1/update/api/+', 'v1/vnet/#'])
                this.client.publish('v1/update/api/version', JSON.stringify({'id': 'get_new_version/' + new Date() * 1}))
                this.client.publish('v1/update/api/servers_list', JSON.stringify({'id': 'server_list' + new Date() * 1}))
            }
            this.startTimer()
        })

        this.client.on('message', (msg_topic, msg)=>{
            if (msg_topic === this.gateway + '/comm') {
                const data = JSON.parse(msg.toString());
                this.onReceiveCommMsg(data)
            }
            if (msg_topic === this.gateway + '/log') {
                const data = JSON.parse(msg.toString());
                this.onReceiveLogMsg(data)
            }
            // if (msg_topic === 'v1/update/api/servers_list') {
            //     this.onReceiveLogMsg(data)
            //     this.setServiceNode(data.data)
            //     console.log(this)
            // }
            if (msg_topic.indexOf('v1/vspax/VSPAX_STREAM') !== -1) {
                if (this.vserial_channel.LogViewFlag) {
                    this.onReceiveVserialLogView(msg_topic, msg)
                }
            }
            if (msg_topic === 'v1/update/api/RESULT') {
                const data = JSON.parse(msg.toString());
                if (data.result && data.data && data.data.length > 0){
                    this.onReceiveVserialMsg(data.data)
                }
                if (data.id.indexOf('get_new_version') !== -1 && data.result){
                    this.new_version = parseInt(data.data.new_version);
                    this.onReceiveVserialVersionMsg(data.data)
                    if (parseInt(data.data.new_version) === parseInt(data.data.version)){
                        this.onReceiveLocalVersionMsg(true)
                    }
                    if (parseInt(data.data.new_version) > parseInt(data.data.version)){
                        this.onReceiveLocalVersionMsg(false)
                    }
                }
            }
            if (msg_topic === 'v1/vspax/api/RESULT') {
                const data = JSON.parse(msg.toString());
                if (data.result && data.id.indexOf('api/list') !== -1){
                    this.onReceivePortLength(data.data)
                }
                if (data.result && data.id.indexOf('remove_local_com') !== -1) {
                    this.onReceiveaddPortMsg(null)
                }
            }
            // if (msg_topic === 'v1/vspax/api/keep_alive') {}
            if (msg_topic === 'v1/vspax/api/version') {
                const data = JSON.parse(msg.toString());
                if (data.result && data.data.new_version && data.data.version){
                    if (parseInt(data.data.new_version) === parseInt(data.data.version)){
                        this.onReceiveLocalVersionMsg(true)
                    }
                    if (parseInt(data.data.new_version) > parseInt(data.data.version)){
                        this.onReceiveLocalVersionMsg(false)
                    }
                }
            }
            if (msg_topic.indexOf('v1/vspax/VSPAX_STATUS/') !== -1) {
                const data = JSON.parse(msg.toString());
                this.onReceiveaddPortMsg(data)
            }
            if (msg_topic === 'v1/vnet/VNET_STATUS/SERVICES'){
                const data = JSON.parse(msg.toString());
                this.onReceiverVnetServiceName(data)
            }
            if (msg_topic === 'v1/vnet/PROXY_STATUS/CLOUD_PROXY'){
                const data = JSON.parse(msg.toString());
                this.onReceiverVnetServiceState(data)
            }
            if (msg_topic === 'v1/vnet/PROXY_STATUS/LOCAL_PROXY'){
                const data = JSON.parse(msg.toString());
                if (data.status) {
                    this.vnet_channel.serviceState = Object.assign({}, this.vnet_channel.serviceState, {
                        statuss: data.status
                    })
                }
            }
            if (msg_topic.indexOf('v1/vnet/VNET_STATUS/CONFIG') !== -1) {
                const data = JSON.parse(msg.toString());
                    this.vnet_channel.is_running = data.is_running;
                    if (data.vnet_cfg) {
                        this.vnet_channel.vnet_config = data.vnet_cfg;
                    }
            }
            if (msg_topic === 'v1/vnet/api/keep_alive') {
                const data = JSON.parse(msg.toString());
                if (data.id.indexOf('keep_alive') !== -1) {
                    if (data.auth_code) {
                        this.auth_code = data.auth_code;
                    }
                }
            }
            if (msg_topic.indexOf('v1/vnet/DEST_STATUS') !== -1){
                const data = JSON.parse(msg.toString());
                this.vnet_channel.serviceState = Object.assign({}, this.vnet_channel.serviceState, {
                    delay: data.delay,
                    message: data.message
                })
            }
        })
    }
}

export default GatewayMQTT