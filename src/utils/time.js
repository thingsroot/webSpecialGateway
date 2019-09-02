/**************************************时间格式化处理************************************/
function PrefixInteger (num, length) {
    return (Array(length).join('0') + num).slice(-length);
}

export function formatTime (date, fmt) {
    var o = {
        'M+': date.getMonth() + 1,     //月份
        'd+': date.getDate(),     //日
        'h+': date.getHours(),     //小时
        'm+': date.getMinutes(),     //分
        's+': date.getSeconds(),     //秒
        'q+': Math.floor((date.getMonth() + 3) / 3), //季度
        'S': PrefixInteger(date.getMilliseconds(), 3)    //毫秒
    }
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
        }
    }
    return fmt;
}

export function getLocalTime (nS) {
    return formatTime( new Date(nS * 1000), 'yyyy-MM-dd hh:mm:ss S');
}