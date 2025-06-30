/**
 * 测试设备筛选修复 - 验证加热设备和空调设备筛选切换功能
 * Test Device Filter Fix - Verify heating and HVAC device filter switching
 */

// 模拟设备数据
const mockDevices = [
  // 加热设备
  { id: 'heat_001', name: '热水器A', type: 'water_heater', status: 'online' },
  { id: 'heat_002', name: '太阳能热水器B', type: 'solar_water_heater', status: 'online' },
  { id: 'heat_003', name: '燃气锅炉C', type: 'gas_boiler', status: 'offline' },

  // 空调设备
  { id: 'hvac_001', name: '中央空调A', type: 'air_conditioner', status: 'online' },
  { id: 'hvac_002', name: '分体空调B', type: 'air_conditioner', status: 'online' },
  { id: 'hvac_003', name: '风管机C', type: 'air_conditioner', status: 'offline' },

  // 其他设备
  { id: 'other_001', name: '智能电表', type: 'smart_meter', status: 'online' },
  { id: 'other_002', name: '环境传感器', type: 'environment_sensor', status: 'online' }
];

// 模拟设备页面的筛选逻辑
class DeviceFilterTest {
  constructor() {
    this.data = {
      allDevices: mockDevices,
      filteredDevices: mockDevices,
      filterType: 'all',
      debugMode: true
    };

    // 模拟缓存
    this.dataCache = {
      lastFilterResult: null,
      lastFilterParams: null
    };
  }

  // 复制设备页面的筛选逻辑
  filterDevicesByType(devices, filterType) {
    const DEVICE_TYPE_MAPPING = {
      'meter': ['smart_meter', 'water_meter', 'gas_meter'],
      'sensor': ['environment_sensor', 'environment_monitor', 'gas_detector'],
      'electrical': ['lighting', 'solar_inverter', 'motor', 'air_compressor', 'ev_charger', 'ups', 'power_distribution'],
      'hvac': ['air_conditioner'],
      'heating': ['water_heater', 'solar_water_heater', 'gas_boiler'],
      'water': ['cooling_water', 'water_treatment'],
      'control': ['smart_control']
    };

    if (!DEVICE_TYPE_MAPPING[filterType]) {
      console.warn(`未找到筛选类型 "${filterType}" 的映射`);
      return [];
    }

    const targetTypes = DEVICE_TYPE_MAPPING[filterType];
    const filtered = devices.filter(device => {
      const deviceType = (device.type || '').toLowerCase();
      return targetTypes.includes(deviceType);
    });

    return filtered;
  }

  // 模拟修复后的onFilterType方法
  onFilterType(type) {
    const currentFilterType = this.data.filterType;

    // 如果筛选类型发生变化，清除缓存
    if (currentFilterType !== type && this.dataCache) {
      this.dataCache.lastFilterResult = null;
      this.dataCache.lastFilterParams = null;

      console.log(`[DEBUG] 筛选类型从 "${currentFilterType}" 切换到 "${type}"，已清除缓存`);
    }

    // 更新筛选类型
    this.data.filterType = type;

    // 应用筛选
    this.applyFilters({ filterType: type });
  }

  // 模拟修复后的applyFilters方法
  applyFilters(overrides = {}) {
    const { allDevices, filterType } = this.data;
    const actualFilterType = overrides.filterType !== undefined ? overrides.filterType : filterType;

    // 检查是否跳过缓存
    const isFilterTypeOverride = overrides.filterType !== undefined;

    if (isFilterTypeOverride) {
      console.log(`[DEBUG] 检测到筛选类型切换为: ${actualFilterType}，跳过缓存直接执行筛选`);
    }

    let filtered = allDevices;

    // 应用筛选
    if (actualFilterType !== 'all') {
      filtered = this.filterDevicesByType(filtered, actualFilterType);
    }

    // 更新筛选结果
    this.data.filteredDevices = filtered;

    console.log(`筛选完成，筛选类型: ${actualFilterType}，结果数量: ${filtered.length}`);
    console.log('筛选结果:', filtered.map(d => `${d.name}(${d.type})`));

    return filtered;
  }

  // 测试筛选切换功能
  testFilterSwitching() {
    console.log('=== 开始测试设备筛选切换功能 ===');
    console.log('初始设备数量:', this.data.allDevices.length);

    // 步骤1: 筛选加热设备
    console.log('\n步骤1: 筛选加热设备');
    this.onFilterType('heating');
    const heatingDevices = this.data.filteredDevices;

    // 步骤2: 筛选空调设备
    console.log('\n步骤2: 筛选空调设备');
    this.onFilterType('hvac');
    const hvacDevices = this.data.filteredDevices;

    // 验证结果
    console.log('\n=== 验证结果 ===');

    // 验证加热设备筛选是否正确
    const expectedHeatingTypes = ['water_heater', 'solar_water_heater', 'gas_boiler'];
    const heatingCorrect = heatingDevices.every(d => expectedHeatingTypes.includes(d.type));
    console.log(`加热设备筛选正确: ${heatingCorrect}`);
    console.log(`预期加热设备数量: 3, 实际: ${heatingDevices.length}`);

    // 验证空调设备筛选是否正确
    const expectedHvacTypes = ['air_conditioner'];
    const hvacCorrect = hvacDevices.every(d => expectedHvacTypes.includes(d.type));
    console.log(`空调设备筛选正确: ${hvacCorrect}`);
    console.log(`预期空调设备数量: 3, 实际: ${hvacDevices.length}`);

    // 验证是否没有显示加热设备（修复前的bug）
    const noHeatingInHvac = !hvacDevices.some(d => expectedHeatingTypes.includes(d.type));
    console.log(`空调筛选结果中不包含加热设备: ${noHeatingInHvac}`);

    // 总结
    const testPassed = heatingCorrect && hvacCorrect && noHeatingInHvac &&
      heatingDevices.length === 3 && hvacDevices.length === 3;

    console.log(`\n=== 测试结果: ${testPassed ? '通过' : '失败'} ===`);

    if (!testPassed) {
      console.log('测试失败的原因:');
      if (!heatingCorrect) console.log('- 加热设备筛选不正确');
      if (!hvacCorrect) console.log('- 空调设备筛选不正确');
      if (!noHeatingInHvac) console.log('- 空调筛选结果中包含了加热设备（这是修复前的bug）');
      if (heatingDevices.length !== 3) console.log(`- 加热设备数量不正确，预期3个，实际${heatingDevices.length}个`);
      if (hvacDevices.length !== 3) console.log(`- 空调设备数量不正确，预期3个，实际${hvacDevices.length}个`);
    }

    return testPassed;
  }
}

// 运行测试
if (typeof module !== 'undefined' && module.exports) {
  // Node.js环境
  module.exports = DeviceFilterTest;

  // 如果直接运行此文件，执行测试
  if (require.main === module) {
    const test = new DeviceFilterTest();
    test.testFilterSwitching();
  }
} else {
  // 浏览器环境
  const test = new DeviceFilterTest();
  test.testFilterSwitching();
}
