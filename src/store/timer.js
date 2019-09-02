import {observable, action} from 'mobx'
const defaultGateStatusGap = 5000

class Timer {
  @observable gateStatusGap = defaultGateStatusGap
  @observable gateStatusLast = 0
  @observable gateStatusNoGapTime = 0
  @action setGateStatusGap (value) {
    this.gateStatusGap = value;
  }
  @action setGateStatusLast (value) {
    this.gateStatusLast = value;
  }
  @action setGateStatusNoGapTime (value) {
    this.gateStatusNoGapTime = new Date().getTime() + value;
  }
}

export default new Timer()