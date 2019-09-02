import {observable, action} from 'mobx'
import Cookie from 'mobx-cookie'

class Action {
  _user_id = new Cookie('user_id')
  @observable actions = []
  @action pushAction (id, title, content, info, timeout, finish_action) {
    let now = new Date().getTime()
    this.actions.push({
      id: id,
      title: title,
      content: content,
      info: info,
      finish_action: finish_action,
      status: 'running',
      message: '',
      start: now,
      last: now,
      timeout: timeout === undefined ? 30000 : timeout
    })
    let key = this._user_id.value + '_actions'
    localStorage.getItem(key, JSON.stringify(this.actions))
  }
  @action popAction (id) {
    this.actions.splice(this.actions.findIndex(item => item.id === id), 1)
    let key = this._user_id.value + '_actions'
    localStorage.getItem(key, JSON.stringify(this.actions))
  }
  @action setActionStatus (id, status, message) {
    var action = this.actions.find(item => item.id === id)
    if (action === undefined) {
      return
    }
    //this.actions.splice(this.actions.findIndex(item => item.id === id), 1)
    action.status = status
    action.message = message
    action.last = new Date().getTime()

    let key = this._user_id.value + '_actions'
    localStorage.getItem(key, JSON.stringify(this.actions))
  }
}

export default new Action()