import http from './Server';
import Cookie from 'mobx-cookie'


const LOGIN_COOKIE_NAME = 'csrf_auth_token';
export function _getCookie (name) {
    let cookie = new Cookie(name)
    return cookie.value
}

export function _setCookie (name, value, expire) {
    let cookie = new Cookie(name)
    return cookie.set(value, { expires: expire })
}
export function isAuthenticated () {
    // let sid = _getCookie('sid')
    let user_id = _getCookie('user_id')
    // if (sid === undefined || sid === 'Guest') {
    //     return false
    // }
    if (user_id === undefined || user_id === 'Guest'){
        return false
    }
    return true
}

export function authenticateClear () {
    let cookie = new Cookie(LOGIN_COOKIE_NAME)
    cookie.remove()
    let sid = new Cookie('sid')
    sid.remove()
    let user_id = new Cookie('user_id')
    user_id.remove()
    let is_developer = new Cookie('is_developer')
    is_developer.remove()
}

export function authenticateSuccess (data) {
    console.log(data)
    _setCookie(LOGIN_COOKIE_NAME, data.csrf_token)
    _setCookie('companies', data.companies[0])
    _setCookie('is_developer', data.is_developer)
    _setCookie('user_id', data.name)
}

export function refreshToken () {
    if (!isAuthenticated()) {
        return
    }
    let csrf_token = _getCookie(LOGIN_COOKIE_NAME)
    if (csrf_token === undefined || csrf_token === '') {
        http.get('/api/user_csrf_token').then(res => {
            if (res.ok) {
                authenticateSuccess(res.data)
            }
        })
    }
}

export function getParam (name) {
    //构造一个含有目标参数的正则表达式对象
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
    //匹配目标参数
    var r = window.location.search.substr(1).match(reg);
    //返回参数值
    if (r !== null){
      return unescape(r[2]);
    }
    //不存在时返回null
    return null;
}
export const getUrl = (url)=> {
    console.log(url)
    return url.split('/')[1];
}
// 申请AccessKey
export function apply_AccessKey (){
    return http.get('/api/user_token_read')
}
// 是否公司管理员
export function isAdmin (){
    http.get('/api/method/iot_ui.iot_api.company_admin').then(res=>{
      _setCookie('is_admin', res.message.admin)
      if (res.message.admin === true){
          _setCookie('companies', res.message.companies[0]);
      } else {
          _setCookie('companies', '');
      }
    })
}
export function isDeveloper () {
    let is_developer = _getCookie('is_developer')
    if (is_developer !== undefined) {
        return is_developer
    }
    // TODO: 怎么处理没有cookie的情况（进行同步http请求??)
    http.get('/api/developers_read?name=' + _getCookie('user_id'))
        .then(res=>{
            if (res.ok && res.data) {
                if (res.data.enabled === 1) {
                    _setCookie('is_developer', '1')
                } else {
                    _setCookie('is_developer', '0')
                }
            } else {
                _setCookie('is_developer', '0')
            }
        });

    return undefined
}