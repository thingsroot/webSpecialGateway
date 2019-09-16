// const js = {
//     'gateway': 'TRTX011901000001', // 网关sn
//     'inst': 'testtesttest',  //安装实例名
//     'app': 'APP00000025',   //应用市场ID
//     'version': 280,  //版本
//     'conf': { //配置
//         'loop_gap': 999, //采集间隔
//         'apdu_type': 'TCP', //协议类型
//         'channel_type': 'socket', //通讯类型  soket为tcp
//         'socket_opt': { 
//             'host': '127.0.0.1', //socket IP地址
//             'port': 499,  // 端口
//             'nodelay': true // Nodelay开关
//         },
//         'tpls': [ // 模板 类型为数组
//             {
//                 'key': 1,
//                 'id': 'TPL000000195',
//                 'name': 'boiler_demo',
//                 'description': '模拟锅炉-浪潮云测试',
//                 'ver': 1
//             },
//             {
//                 'key': 2,
//                 'id': 'TPL000000002',
//                 'name': 'BMS Template',
//                 'description': null,
//                 'ver': 3
//             },
//             {
//                 'key': 3,
//                 'id': 'TPL000000205',
//                 'name': 'boiler_demo-copy',
//                 'description': '模拟锅炉-浪潮云测试',
//                 'ver': 3
//             },
//             {
//                 'key': 4,
//                 'id': 'TPL000000205',
//                 'name': 'boiler_demo-copy',
//                 'description': '模拟锅炉-浪潮云测试',
//                 'ver': 3
//             }
//         ],
//         'devs': [ // 设备列表
//             {
//                 'key': 1,
//                 'unit': 0,
//                 'name': '321321321',   // 应用所属实例
//                 'sn': '',
//                 'tpl': 'BMS Template'
//             }
//         ],
//         'dev_sn_prefix': true   //将SN作为设备前缀
//     },
//     'id': 'app_install/TRTX011901000001/testtesttest/APP00000025/38753'
// }
// const jsx = {
//     'gateway': 'TRTX011901000001',
//     'inst': 'modebus3',
//     'app': 'APP00000025',
//     'version': 280,
//     'conf': {
//         'loop_gap': 1000,
//         'apdu_type': 'RTU',
//         'channel_type': 'serial',
//         'serial_opt': {
//             'port': '/dev/ttyS1',
//             'baudrate': 9600,
//             'stop_bits': 1,
//             'data_bits': 8,
//             'flow_control': 'OFF',
//             'parity': 'None'
//         },
//         'tpls': [],
//         'devs': [],
//         'dev_sn_prefix': true
//     },
//     'id': 'app_install/TRTX011901000001/modebus3/APP00000025/25419'
// }