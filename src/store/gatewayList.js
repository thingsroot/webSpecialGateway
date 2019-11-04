import {observable, action} from 'mobx'


class GatewayList {
    @observable online = []
    @observable offline = []
    @observable all = []

    @action setOnline (value) {
        this.online = value ? value : []
    }
    @action setOffline (value) {
        this.offline = value ? value : []
    }
    @action setAll (value) {
        this.all = value ? value : []
    }

    get FirstGateway () {
        return this.online[0]
    }
}

export default GatewayList