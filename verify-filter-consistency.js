/**
 * 验证设备筛选功能数据一致性的脚本
 * 用于在WeChat小程序开发者工具中验证修复效果
 */

// 模拟设备数据
const mockDevices = [
  {
    id: 'device_001',
    name: '生产车间空调系统',
    type: 'air_conditioner',
    status: 'online',
    hasAlert: false,
    healthStatus: 'good'
  },
  {
    id: 'device_002',
    name: '智能电表A',
    type: 'smart_meter',
    status: 'online',
    hasAlert: false,
    healthStatus: 'good'
  },
  {
    id: 'device_003',
    name: '智能电表B',
    type: 'smart_meter',
    status: 'offline',
    hasAlert: true,
    healthStatus: 'warning'
  },
  {
    id: 'device_004',
    name: '温度传感器',
    type: 'environment_sensor',
    status: 'online',
    hasAlert: true,
    healthStatus: 'warning'
  },
  {
    id: 'device_005',
    name: '配电开关',
    type: 'power_distribution',
    status: 'online',
    hasAlert: false,
    healthStatus: 'good'
  }
];

// 筛选逻辑（复制自修复后的代码）
function calculateFilteredCount(allDevices, filterType, searchKeyword = '', selectedGroup = 'all') {
  let filtered = allDevices;

  // 应用搜索关键词过滤
  if (searchKeyword && searchKeyword.trim()) {
    const keyword = searchKeyword.trim();
    const isChineseKeyword = /[\u4e00-\u9fa5]/.test(keyword);

    const searchCondition = isChineseKeyword ?
      (text) => text.includes(keyword) :
      (text) => text.toLowerCase().includes(keyword.toLowerCase());

    filtered = filtered.filter(device => {
      const deviceName = (device.name || '').toString();
      const deviceType = (device.type || '').toString();
      const deviceId = (device.id || '').toString();

      return searchCondition(deviceName) ||
        searchCondition(deviceType) ||
        searchCondition(deviceId);
    });
  }

  // 应用设备类型和状态过滤
  if (filterType !== 'all') {
    if (filterType === 'offline') {
      filtered = filtered.filter(device =>
        (device.status || 'offline') === 'offline'
      );
    } else if (filterType === 'alert') {
      filtered = filtered.filter(device => {
        const hasAlerts = device.alerts && Array.isArray(device.alerts) && device.alerts.length > 0;
        const hasAlert = device.hasAlert === true;
        return hasAlerts || hasAlert;
      });
    } else if (filterType === 'abnormal') {
      filtered = filtered.filter(device => {
        const healthStatus = device.healthStatus || 'good';
        const status = device.status || 'offline';
        return healthStatus === 'error' ||
          healthStatus === 'warning' ||
          status === 'offline' ||
          status === 'alarm' ||
          status === 'maintenance' ||
          status === 'degraded' ||
          (device.alerts && Array.isArray(device.alerts) && device.alerts.length > 0) ||
          device.hasAlert === true;
      });
    } else if (filterType === 'healthy') {
      filtered = filtered.filter(device => {
        const status = device.status || 'offline';
        const healthStatus = device.healthStatus || 'good';
        const hasAlerts = device.alerts && Array.isArray(device.alerts) && device.alerts.length > 0;
        const hasAlert = device.hasAlert === true;

        return status === 'online' &&
          healthStatus === 'good' &&
          !hasAlerts &&
          !hasAlert;
      });
    } else {
      // 设备类型过滤
      filtered = filtered.filter(device => {
        const deviceType = (device.type || '').toLowerCase();
        
        const typeMapping = {
          'meter': ['smart_meter', 'water_meter', 'gas_meter'],
          'sensor': ['environment_sensor', 'environment_monitor', 'gas_detector'],
          'switch': ['power_distribution', 'smart_control'],
          'hvac': ['air_conditioner', 'water_heater', 'solar_water_heater', 'gas_boiler', 'cooling_water']
        };
        
        if (typeMapping[filterType]) {
          return typeMapping[filterType].includes(deviceType);
        }
        
        return deviceType === filterType.toLowerCase();
      });
    }
  }

  // 应用分组过滤
  if (selectedGroup !== 'all') {
    filtered = filtered.filter(device =>
      (device.group || '') === selectedGroup
    );
  }

  return filtered.length;
}

// 验证函数
function verifyFilterConsistency() {
  console.log('开始验证设备筛选功能数据一致性...\n');

  const testCases = [
    { type: 'all', expected: 5, description: '全部设备' },
    { type: 'meter', expected: 2, description: '电表设备' },
    { type: 'sensor', expected: 1, description: '传感器设备' },
    { type: 'switch', expected: 1, description: '开关设备' },
    { type: 'hvac', expected: 1, description: '空调设备' },
    { type: 'offline', expected: 1, description: '离线设备' },
    { type: 'alert', expected: 2, description: '告警设备' },
    { type: 'abnormal', expected: 3, description: '异常设备' },
    { type: 'healthy', expected: 2, description: '正常设备' }
  ];

  let allPassed = true;

  testCases.forEach(testCase => {
    const actualCount = calculateFilteredCount(mockDevices, testCase.type);
    const passed = actualCount === testCase.expected;
    
    if (!passed) {
      allPassed = false;
    }

    console.log(`${testCase.description}: 期望 ${testCase.expected} 个，实际 ${actualCount} 个 - ${passed ? '✅ 通过' : '❌ 失败'}`);
  });

  console.log(`\n验证结果: ${allPassed ? '✅ 所有测试通过' : '❌ 存在失败的测试'}`);
  
  if (allPassed) {
    console.log('数据一致性修复验证成功！Toast提示与筛选结果将保持一致。');
  } else {
    console.log('请检查筛选逻辑是否正确实现。');
  }

  return allPassed;
}

// 在WeChat小程序开发者工具控制台中运行
// 或者在Node.js环境中运行: node verify-filter-consistency.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { verifyFilterConsistency, calculateFilteredCount };
} else {
  // 浏览器环境或小程序环境
  verifyFilterConsistency();
}

// 使用说明：
// 1. 在WeChat小程序开发者工具中打开控制台
// 2. 复制此脚本内容并粘贴到控制台
// 3. 按回车执行验证
// 4. 查看验证结果，确保所有测试通过
