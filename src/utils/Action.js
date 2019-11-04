import http from './Server';

export function exec_result (id) {
    return new Promise((resolve, reject) => {
        http.get('/api/gateways_exec_result?id=' + id).then(res=>{
            if (res.data  && res.data.result === true){
                return resolve([true, res.data])
            }
            if (res.data && res.data.result === false){
                return resolve([false, res.data])
            } else {
                return reject('Running')
            }
        }).catch(err=>{
            reject(err)
        })
    })
}

export function doUpdate (actions, cb) {
    let now = new Date().getTime()
    actions.map( (action)=>{
        if (action.status !== 'running' ) {
            return
        }
        if (now > action.last + 1000){
            action.last = now + 3000
            exec_result(action.id).then( ([result, data]) => {
                console.log(result, data)
                if (result) {
                    cb(action, 'done', data)
                } else {
                    cb(action, 'failed', data)
                }
                if (action.finish_action !== undefined) {
                    action.finish_action(result, data)
                }
            }).catch( err=> {
                console.log(err)
            })
        }
        if (now > action.start + action.timeout) {
            cb(action, 'timeout', 'Action timeout')
            let now = new Date()
            let data = {
                id: action.id,
                result: false,
                timestamp: now.getTime() / 1000,
                timestamp_str: now.toLocaleTimeString(),
                message: 'Action timeout'
            }
            action.finish_action(false, data)
            return
        }
    })
}
