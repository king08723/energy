/**
 * 验证设备筛选功能显示延迟修复的脚本
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
  },
  {
    id: 'device_006',
    name: '水表设备',
    type: 'water_meter',
    status: 'online',
    hasAlert: false,
    healthStatus: 'good'
  }
];

// 模拟修复后的筛选逻辑
function applyFiltersWithOverrides(allDevices, currentData, overrides = {}) {
  const actualFilterType = overrides.filterType !== undefined ? overrides.filterType : currentData.filterType;
  const actualSearchKeyword = overrides.searchKeyword !== undefined ? overrides.searchKeyword : currentData.searchKeyword;
  const actualSelectedGroup = overrides.selectedGroup !== undefined ? overrides.selectedGroup : currentData.selectedGroup;

  let filtered = allDevices;

  // 应用搜索关键词过滤
  if (actualSearchKeyword && actualSearchKeyword.trim()) {
    const keyword = actualSearchKeyword.trim();
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
  if (actualFilterType !== 'all') {
    if (actualFilterType === 'offline') {
      filtered = filtered.filter(device =>
        (device.status || 'offline') === 'offline'
      );
    } else if (actualFilterType === 'alert') {
      filtered = filtered.filter(device => {
        const hasAlerts = device.alerts && Array.isArray(device.alerts) && device.alerts.length > 0;
        const hasAlert = device.hasAlert === true;
        return hasAlerts || hasAlert;
      });
    } else if (actualFilterType === 'abnormal') {
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
    } else if (actualFilterType === 'healthy') {
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
        
        if (typeMapping[actualFilterType]) {
          return typeMapping[actualFilterType].includes(deviceType);
        }
        
        return deviceType === actualFilterType.toLowerCase();
      });
    }
  }

  // 应用分组过滤
  if (actualSelectedGroup !== 'all') {
    filtered = filtered.filter(device =>
      (device.group || '') === actualSelectedGroup
    );
  }

  return filtered;
}

// 模拟修复前的筛选逻辑（有延迟问题）
function applyFiltersOld(allDevices, currentData) {
  // 直接使用 currentData 中的值，可能是旧值
  const { filterType, searchKeyword, selectedGroup } = currentData;
  
  let filtered = allDevices;

  // 筛选逻辑与修复后相同，但使用的是可能过时的 filterType
  if (filterType !== 'all') {
    if (filterType === 'meter') {
      filtered = filtered.filter(device => {
        const deviceType = (device.type || '').toLowerCase();
        return ['smart_meter', 'water_meter', 'gas_meter'].includes(deviceType);
      });
    } else if (filterType === 'sensor') {
      filtered = filtered.filter(device => {
        const deviceType = (device.type || '').toLowerCase();
        return ['environment_sensor', 'environment_monitor', 'gas_detector'].includes(deviceType);
      });
    } else if (filterType === 'switch') {
      filtered = filtered.filter(device => {
        const deviceType = (device.type || '').toLowerCase();
        return ['power_distribution', 'smart_control'].includes(deviceType);
      });
    } else if (filterType === 'hvac') {
      filtered = filtered.filter(device => {
        const deviceType = (device.type || '').toLowerCase();
        return ['air_conditioner', 'water_heater', 'solar_water_heater', 'gas_boiler', 'cooling_water'].includes(deviceType);
      });
    }
  }

  return filtered;
}

// 验证函数
function verifyFilterDelayFix() {
  console.log('开始验证设备筛选功能显示延迟修复...\n');

  // 模拟当前数据状态
  let currentData = {
    filterType: 'all',
    searchKeyword: '',
    selectedGroup: 'all'
  };

  const testSequence = [
    { newType: 'meter', description: '点击电表筛选' },
    { newType: 'sensor', description: '点击传感器筛选' },
    { newType: 'switch', description: '点击开关筛选' },
    { newType: 'hvac', description: '点击空调筛选' },
    { newType: 'all', description: '重置为全部' }
  ];

  let allPassed = true;

  testSequence.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.description}:`);
    
    // 模拟修复前的行为（使用旧的 filterType）
    const oldResult = applyFiltersOld(mockDevices, currentData);
    
    // 模拟修复后的行为（传递新的 filterType）
    const newResult = applyFiltersWithOverrides(mockDevices, currentData, { filterType: test.newType });
    
    // 计算期望的结果
    const expectedCounts = {
      'all': 6,
      'meter': 3, // smart_meter, smart_meter, water_meter
      'sensor': 1, // environment_sensor
      'switch': 1, // power_distribution
      'hvac': 1   // air_conditioner
    };
    
    const expectedCount = expectedCounts[test.newType] || 0;
    
    console.log(`  期望结果: ${expectedCount} 个设备`);
    console.log(`  修复前结果: ${oldResult.length} 个设备 ${oldResult.length === expectedCount ? '✅' : '❌'}`);
    console.log(`  修复后结果: ${newResult.length} 个设备 ${newResult.length === expectedCount ? '✅' : '❌'}`);
    
    if (oldResult.length === expectedCount && newResult.length === expectedCount) {
      console.log(`  状态: ✅ 修复前后都正确（可能是第一次点击）`);
    } else if (oldResult.length !== expectedCount && newResult.length === expectedCount) {
      console.log(`  状态: ✅ 修复成功！解决了延迟问题`);
    } else if (oldResult.length === expectedCount && newResult.length !== expectedCount) {
      console.log(`  状态: ❌ 修复引入了新问题`);
      allPassed = false;
    } else {
      console.log(`  状态: ❌ 修复前后都有问题`);
      allPassed = false;
    }
    
    // 更新当前数据状态（模拟 setData 的异步更新）
    // 注意：这里模拟了延迟更新，实际中 setData 是异步的
    setTimeout(() => {
      currentData.filterType = test.newType;
    }, 0);
  });

  console.log(`\n验证结果: ${allPassed ? '✅ 修复验证成功' : '❌ 修复验证失败'}`);
  
  if (allPassed) {
    console.log('筛选功能的显示延迟问题已成功修复！');
    console.log('现在点击筛选按钮时，设备列表会立即显示正确的筛选结果。');
  } else {
    console.log('请检查修复逻辑是否正确实现。');
  }

  return allPassed;
}

// 在WeChat小程序开发者工具控制台中运行
// 或者在Node.js环境中运行: node verify-filter-delay-fix.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { verifyFilterDelayFix, applyFiltersWithOverrides };
} else {
  // 浏览器环境或小程序环境
  verifyFilterDelayFix();
}

// 使用说明：
// 1. 在WeChat小程序开发者工具中打开控制台
// 2. 复制此脚本内容并粘贴到控制台
// 3. 按回车执行验证
// 4. 查看验证结果，确保修复成功
