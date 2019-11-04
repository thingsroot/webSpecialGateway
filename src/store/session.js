import Cookie from 'mobx-cookie'

class Session {
    _sid = new Cookie('sid');
    get sid () {
        return this._sid.value
    }
    setSid = value => {
        this._sid.set(value)
    }
    unsetSid = () => {
        this._sid.remove()
    }

    _user_id = new Cookie('user_id');
    get user_id () {
        return this._user_id.value
    }
    setUserId = value => {
        this._user_id.set(value)
    }
    unsetUserId = () => {
        this._user_id.remove()
    }

    _is_developer = new Cookie('is_developer');
    get is_developer () {
        return this._is_developer.value
    }
    setIsDeveloper = value => {
        this._is_developer.set(value)
    }
    unsetIsDeveloper = () => {
        this._is_developer.remove()
    }

    _csrf_token = new Cookie('csrf_auth_token');
    get csrf_token () {
        if (this._user_id === 'Guest') {
            this._csrf_token.set('')
        }
        return this._csrf_token.value
    }
    setCSRFToken = value => {
        this._csrf_token.set(value)
    }
    unsetCSRFToken = () => {
        this._csrf_token.remove()
    }

    _companies = new Cookie('companies');
    get companies () {
        return this._companies.value
    }
    setCompanies = value => {
        this._companies.set(value)
    }
    unsetCompanies  = () => {
        this._companies.remove()
    }

    _is_admin = new Cookie('is_admin');
    get is_admin () {
        return this._is_admin.value
    }
    setIsAdmin = value => {
        this._is_admin.set(value)
    }
    unsetIsAdmin  = () => {
        this._is_admin.remove()
    }

    _system = new Cookie('system');
    get system () {
        return this._system.value
    }
    setSystem = value => {
        this._system.set(value)
    }
    unsetSystem  = () => {
        this._system.remove()
    }

    _full_name = new Cookie('full_name');
    get full_name () {
        return this._full_name.value
    }
    setFullName = value => {
        this._full_name.set(value)
    }
    unsetFullName  = () => {
        this._full_name.remove()
    }
}

export default new Session()