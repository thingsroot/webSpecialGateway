import {observable, action} from 'mobx'

const createDefaultValue = (type, default_value, values) => {
    if (default_value !== undefined) {
        return default_value
    }
    if (type === 'boolean') {
        return values === undefined ? false : values[0]
    }
    if (type === 'number') {
        return values === undefined ? 0 : values[0]
    }
    if (type === 'string') {
        return values === undefined ? '' : values[0]
    }
    if (type === 'text') {
        return values === undefined ? '' : values[0]
    }
    if (type === 'dropdown') {
        return values === undefined ? '' : values[0]
    }
    if (type === 'templates') {
        return values === undefined ? [] : values
    }
    if (type === 'table') {
        return values === undefined ? [] : values
    }
    if (type === 'section' || type === 'fake_section') {
        return values === undefined ? {} : values
    }
    if (type === 'serial') {
        return values === undefined ? {} : values
    }
    if (type === 'tcp_client') {
        return values === undefined ? {} : values
    }
    if (type === 'tcp_server') {
        return values === undefined ? {} : values
    }
}

const newConfigItem = (name, desc, type, default_value, depends, values, cols) => {
    var item = observable({
        // observable 属性:
        name: name,
        desc: desc,
        type: type,
        default: default_value,
        depends: depends,
        values: values,
        cols: cols,
        value: createDefaultValue(type, default_value, values),
        hide: false,

        // 动作:
        setName (value) {
            this.name = value;
        },
        setDesc (value) {
            this.desc = value;
        },
        setType (value) {
            this.type = value;
        },
        setDefault (value) {
            this.default = value;
        },
        setDepends (value) {
            this.depends = value;
        },
        setValues (value) {
            this.values = value;
        },
        setCols (value) {
            this.cols = value;
        },
        setValue (value) {
            if (value === undefined) {
                this.value = createDefaultValue(this.type, this.default, this.values)
                console.log(this.name, this.type, value)
                return
            }

            if (this.type === 'boolean') {
                this.value = Boolean(value) ? Boolean(value) : (value === 1 || value === '1')
            } else if (this.type === 'number') {
                this.value = Number(value)
            } else if (this.type === 'table') {
                this.value = value instanceof Array ? value : []
                this.value.map((item, index)=>{
                    item.key = item.key !== undefined ? item.key : index
                })
            } else if (this.type === 'templates') {
                this.value = value instanceof Array ? value : []
                this.value.map((item, index)=>{
                    item.key = item.key !== undefined ? item.key : index
                })
            } else {
                this.value = value;
            }
            console.log(this.name, this.type, value)
        },
        setHide (value) {
            this.hide = value;
        },

        get Value () {
            return this.value
        }
    }, {
        setName: action,
        setDesc: action,
        setType: action,
        setDefault: action,
        setDepends: action,
        setValues: action,
        setValue: action
    });
    return item;
}

class ConfigSection {
    @observable name = ''
    @observable desc = ''
    @observable type = ''
    @observable child = []
    @observable hide = false

    @action setName (value) {
        this.name = value;
    }
    @action setDesc (value) {
        this.desc = value;
    }
    @action delChild (name) {
        this.child.slice(this.child.findIndex( item => item.name === name), 1)
    }
    @action addChild (name, desc, type, default_value, depends, values, cols) {
        let item = newConfigItem(name, desc, type, default_value, depends, values, cols)
        this.child.push(item)
    }

    @action fromObject (obj) {
        this.name = obj.name
        this.desc = obj.desc
        this.type = obj.type
        obj.child && obj.child.length > 0 && obj.child.map( (v, key) => {
            key;
            this.addChild(v.name, v.desc, v.type, v.default, v.depends, v.values, v.cols)
        })
    }

    get Value () {
        let val = {}
        for (let item of this.child) {
            if (item.hide !== true) {
                val[item.name] = item.Value
            }
        }
        return val
    }

    @action setValue (value) {
        let val = value ? value : {}
        for (let item of this.child) {
            item.setValue(val[item.name])
        }
    }

    @action setHide (value, key) {
        // console.log(value ? 'hide' : 'show', this.name, key)
        if (key === undefined) {
            this.hide = value
            return
        }
        let item = this.child.find(item => item.name === key)
        if (item !== undefined) {
            item.setHide(value)
        }
    }
}

const newAppConfigTemplate = (name, conf_name, description, version) => {
    var item = observable({
        // observable 属性:
        name: name,
        conf_name: conf_name,
        description: description,
        version: version,

        // 动作:
        setName (value) {
            this.name = value;
        },
        setConfName (value) {
            this.conf_name = value;
        },
        setDescription (value) {
            this.description = value;
        },
        setVersion (value) {
            this.version = value;
        }
    }, {
        setName: action,
        setConfName: action,
        setDescription: action,
        setVersion: action
    });
    return item;
}

export class ConfigStore {
    @observable sections = []
    @observable templates = []

    @action addSection (section) {
        let item = new ConfigSection()
        item.fromObject(section)
        this.sections.push(item)
    }
    @action delSection (name) {
        this.sections.splice(this.sections.findIndex( item => item.name === name), 1)
    }
    @action cleanSetion () {
        this.sections.clear()
    }

    @action addTemplate (name, conf_name, description, version ) {
        let item = newAppConfigTemplate(name, conf_name, description, version)
        return this.templates.push( item );
    }

    @action delTemplate (index) {
        this.templates.splice(index, 1)
    }

    @action delTemplateByName (name) {
        this.templates.splice(this.templates.findIndex(item => name === item.name), 1)
    }

    @action setHide (key, value) {
        let arr = key.split('/');
        let section = this.sections.find(item => item.name === arr[0])
        if (section) {
            section.setHide(value, arr[1])
        } else {
            if (arr[1] === undefined) {
                this.sections[0].setHide(value, arr[0])
            }
        }
    }

    get Value (){
        let value = {}
        this.sections.map( (section, index) => {
            if (index === 0 || section.type === 'fake_section') {
                let val = section.Value
                for (let [k, v] of Object.entries(val)) {
                    value[k] = v
                }
            } else {
                if (section.hide !== true) {
                    value[section.name] = section.Value
                }
            }
        })
        return value
    }
    @action setValue (value){
        let val = value ? value : {}
        this.sections.map( (section, index) => {
            if (index === 0 || section.type === 'fake_section') {
                section.setValue(val)
            } else {
                section.setValue(val[section.name])
            }
        })
    }
}
