
export function GetSerialListBySN (sn) {
    let tty_list = []
    if (/2-30002.+/.test(sn)) {
        // Q102
        tty_list = ['/dev/ttymxc0', '/dev/ttymxc1']
    } else if (/2-30102.+/.test(sn)) {
        // Q204
        tty_list = ['/dev/ttymxc0', '/dev/ttymxc1', '/dev/ttymxc2', '/dev/ttymxc3']
    } else if (/TRTX01.+/.test(sn)) {
        // TLink X1
        tty_list = ['/dev/ttyS1', '/dev/ttyS2']
    }
    return tty_list
}

export function GetInfoBySN (sn) {
    if (/2-30002.+/.test(sn)) {
        // Q102
        return {
            model: 'Q102',
            cpu: 'NXP i.MX 6ULL (Arm® Cortex®-A7)',
            ram: '256M',
            rom: '4GB'
        }
    } else if (/2-30102.+/.test(sn)) {
        // Q204
        return {
            model: 'Q204',
            cpu: 'NXP i.MX 6UltraLite (Arm® Cortex®-A7)',
            ram: '512M',
            rom: '4GB'
        }
    } else if (/TRTX01.+/.test(sn)) {
        // TLink X1
        return {
            model: 'X1',
            cpu: 'Allwinner H3 (Quad-Core Arm® Cortex®-A7)',
            ram: '256M',
            rom: '4GB'
        }
    }
    return {
        cpu: 'UNKNOWN',
        ram: 'UNKNOWN',
        rom: 'UNKNOWN'
    }
}