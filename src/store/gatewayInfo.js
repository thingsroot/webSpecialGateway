import {observable, action} from 'mobx'
import { GetInfoBySN } from '../utils/hardwares'

class GatewayData {
    @observable uptime = 0
    @observable mem_total = 0
    @observable mem_used = 0
    @observable cpu_temp = 0
    @observable starttime = 0
    @observable version = 0
    @observable skynet_version = 0
    @observable platform = ''
    @observable firmware_version = ''
    @observable cpuload = 0
    @observable data_upload = false
    @observable data_upload_max_dpp = 1024
    @observable data_upload_cov = 1
    @observable data_upload_cov_ttl = 300
    @observable data_upload_period = 1000
    @observable upload_period_limit = 10240
    @observable data_cache = 0
    @observable data_cache_per_file = 4096
    @observable data_cache_limit = 1024
    @observable data_cache_fire_freq = 1000
    @observable stat_upload = false
    @observable comm_upload = 0
    @observable log_upload = 0
    @observable event_upload = 99
    @observable enable_beta = 0

    @action updateStatus (data) {
        let self_keys = Object.getOwnPropertyNames(this.__proto__)
        for (let [k, v] of Object.entries(data)) {
            if (self_keys.findIndex(item => item === k) !== -1) {
                //console.log(k, v)
                this[k] = v
            }
        }
    }
}


const dumpInstallApps = (data) => {
    let apps = []
    const find_key = 'app_run_'
    for (let [k, v] of Object.entries(data)) {
        v;
        if (k.startsWith(find_key)) {
            apps.push(k.substr(find_key.length))
        }
    }
    return apps
}

class GatewayInfo {
    @observable last_updated = ''
    @observable dev_name = ''
    @observable device_status = ''
    @observable sn = ''
    @observable description = ''
    @observable enabled = 0
    @observable longitude = ''
    @observable latitude = ''

    @observable install_apps = [] // Instance name list from realtime-data for running
    @observable ioe_network = false
    @observable ioe_frpc = false
    @observable isVserial = false
    @observable isVnet = false;
    @observable model = ''
    @observable cpu = ''
    @observable ram = ''
    @observable rom = ''
    @observable os = ''
    @observable address = ''
    @observable data = new GatewayData()

    @observable devices = []
    @observable devices_count = 0
    @observable devices_is_show = false
    @observable apps = {}
    @observable apps_count = 0
    @observable apps_is_show = false

    @observable actionEnable = false

    @action updateStatus (data) {
        let self_keys = Object.getOwnPropertyNames(this.__proto__)
        for (let [k, v] of Object.entries(data)) {
            if (k === 'data') {
                this.data.updateStatus(v)
                this.install_apps = dumpInstallApps(v)
            } else {
                if (self_keys.findIndex(item => item === k) !== -1) {
                    //console.log(k, v)
                    this[k] = v
                }
            }
        }
        let hwinfo = GetInfoBySN(data.sn)
        for (let [k, v] of Object.entries(hwinfo)) {
            if (self_keys.findIndex(item => item === k) !== -1) {
                //console.log(k, v)
                this[k] = v
            }
        }

        this.actionEnable = this.device_status === 'ONLINE' && this.enabled === 1 && this.sn && this.sn !== '' ? true : false
        //console.log(this)
    }

    @action setDevices (value) {
        const arr = [];
        this.devices = arr;
        if (value && value.length > 0) {
            value.map(item=>{
                if (item.meta.app_inst.toLowerCase().indexOf('modbus') !== -1) {
                    arr.push(item)
                }
            })
        }
        this.devices_count = arr.length
    }
    @action setDevicesIsShow (value) {
        this.devices_is_show = value
    }
    @action setApps (value) {
        this.apps = value
        this.apps_count = Object.keys(value).length;
        let vserial = false;
        let vnet = false;
        value && value.length > 0 && value.map(item=>{
            if (item.name === 'APP00000130') {
                this.isVserial = true;
                vserial = true;
            }
            if (item.name === 'APP00000135') {
                this.isVnet = true;
                vnet = true;
            }
        })
        if (!vserial){
            this.isVserial = vserial;
        }
        if (!vnet){
            this.isVnet = vnet;
        }
    }
    @action setAppsIsShow (value) {
        this.apps_is_show = value
    }
    @action setDeviceAddress (value) {
        this.address = value
    }
}

export default GatewayInfo