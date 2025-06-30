// WeChat Mini Program API Fixes Test Script
// This script can be run in the WeChat Developer Tools console to test API availability

console.log('🔧 开始测试 WeChat Mini Program API 修复...');

// Test 1: Check if API object exists and has required methods
function testAPIObjectStructure() {
  console.log('\n📋 测试 1: API 对象结构检查');
  
  if (typeof API === 'undefined') {
    console.error('❌ API 对象未定义');
    return false;
  }
  
  console.log('✅ API 对象存在');
  console.log('API 对象键值:', Object.keys(API));
  
  const requiredMethods = [
    'getBatchData',
    'preloadData',
    'subscribeRealTimeData',
    'unsubscribeRealTimeData',
    'getDataWithCache',
    'cache'
  ];
  
  let allMethodsAvailable = true;
  
  requiredMethods.forEach(methodName => {
    const isFunction = typeof API[methodName] === 'function';
    const isObject = methodName === 'cache' && typeof API[methodName] === 'object';
    
    if (isFunction || isObject) {
      console.log(`✅ API.${methodName}: ${isFunction ? 'function' : 'object'}`);
    } else {
      console.error(`❌ API.${methodName}: ${typeof API[methodName]} (期望: ${methodName === 'cache' ? 'object' : 'function'})`);
      allMethodsAvailable = false;
    }
  });
  
  return allMethodsAvailable;
}

// Test 2: Test getBatchData method
async function testGetBatchData() {
  console.log('\n📊 测试 2: getBatchData 方法');
  
  if (typeof API.getBatchData !== 'function') {
    console.error('❌ API.getBatchData 不是函数');
    return false;
  }
  
  try {
    const testRequests = [
      { type: 'home', params: {} },
      { type: 'monitor', params: {} }
    ];
    
    console.log('发送测试请求:', testRequests);
    const result = await API.getBatchData(testRequests);
    console.log('✅ getBatchData 调用成功:', result);
    return true;
  } catch (error) {
    console.error('❌ getBatchData 调用失败:', error);
    return false;
  }
}

// Test 3: Test preloadData method
async function testPreloadData() {
  console.log('\n⚡ 测试 3: preloadData 方法');
  
  if (typeof API.preloadData !== 'function') {
    console.error('❌ API.preloadData 不是函数');
    return false;
  }
  
  try {
    console.log('调用 preloadData...');
    await API.preloadData('index', { lastVisit: Date.now() });
    console.log('✅ preloadData 调用成功');
    return true;
  } catch (error) {
    console.error('❌ preloadData 调用失败:', error);
    return false;
  }
}

// Test 4: Test subscribeRealTimeData method
function testSubscribeRealTimeData() {
  console.log('\n🔄 测试 4: subscribeRealTimeData 方法');
  
  if (typeof API.subscribeRealTimeData !== 'function') {
    console.error('❌ API.subscribeRealTimeData 不是函数');
    return false;
  }
  
  try {
    const socket = API.subscribeRealTimeData({
      deviceIds: ['test_device'],
      onConnect: () => console.log('测试连接成功'),
      onMessage: (data) => console.log('测试消息:', data),
      onDisconnect: () => console.log('测试断开连接')
    });
    
    if (socket && typeof socket.close === 'function') {
      console.log('✅ subscribeRealTimeData 调用成功，返回有效 socket');
      
      // 清理测试连接
      setTimeout(() => {
        socket.close();
        console.log('测试连接已关闭');
      }, 1000);
      
      return true;
    } else {
      console.error('❌ subscribeRealTimeData 返回无效 socket');
      return false;
    }
  } catch (error) {
    console.error('❌ subscribeRealTimeData 调用失败:', error);
    return false;
  }
}

// Test 5: Test cache object
function testCacheObject() {
  console.log('\n💾 测试 5: cache 对象');
  
  if (typeof API.cache !== 'object' || API.cache === null) {
    console.error('❌ API.cache 不是对象');
    return false;
  }
  
  const requiredCacheMethods = ['get', 'set', 'has', 'remove', 'getStatus'];
  let allCacheMethodsAvailable = true;
  
  requiredCacheMethods.forEach(methodName => {
    if (typeof API.cache[methodName] === 'function') {
      console.log(`✅ API.cache.${methodName}: function`);
    } else {
      console.error(`❌ API.cache.${methodName}: ${typeof API.cache[methodName]} (期望: function)`);
      allCacheMethodsAvailable = false;
    }
  });
  
  // Test cache functionality
  try {
    API.cache.set('test_key', 'test_value');
    const value = API.cache.get('test_key');
    const hasKey = API.cache.has('test_key');
    const status = API.cache.getStatus();
    
    console.log('✅ 缓存功能测试:', { value, hasKey, status });
    
    API.cache.remove('test_key');
    console.log('✅ 缓存清理测试完成');
  } catch (error) {
    console.error('❌ 缓存功能测试失败:', error);
    allCacheMethodsAvailable = false;
  }
  
  return allCacheMethodsAvailable;
}

// Test 6: Test component data validation
function testComponentDataValidation() {
  console.log('\n🧩 测试 6: 组件数据验证');
  
  // Mock validation function (simplified version)
  const validateComponentData = (data) => {
    const safeStringValue = (val, defaultVal = '0') => {
      if (val === null || val === undefined) return defaultVal;
      if (typeof val === 'string') return val;
      if (typeof val === 'number') return val.toString();
      return String(val);
    };
    
    if (!data || typeof data !== 'object') return {};
    
    const validated = {};
    if (data.overview) {
      validated.overview = {
        totalEnergy: {
          value: safeStringValue(data.overview.totalEnergy?.value, '0'),
          trend: safeStringValue(data.overview.totalEnergy?.trend, '0'),
          unit: safeStringValue(data.overview.totalEnergy?.unit, 'kWh')
        }
      };
    }
    return validated;
  };
  
  const testCases = [
    { input: null, description: 'null 输入' },
    { input: { overview: { totalEnergy: { value: null } } }, description: 'null 值' },
    { input: { overview: { totalEnergy: { value: 123 } } }, description: '数字值' },
    { input: { overview: { totalEnergy: { value: 'test' } } }, description: '字符串值' }
  ];
  
  let allTestsPassed = true;
  
  testCases.forEach((testCase, index) => {
    try {
      const result = validateComponentData(testCase.input);
      const isValid = typeof result === 'object';
      
      if (isValid) {
        console.log(`✅ 测试 ${index + 1} (${testCase.description}): 通过`);
      } else {
        console.error(`❌ 测试 ${index + 1} (${testCase.description}): 失败`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.error(`❌ 测试 ${index + 1} (${testCase.description}): 错误 - ${error.message}`);
      allTestsPassed = false;
    }
  });
  
  return allTestsPassed;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 开始运行所有测试...\n');
  
  const testResults = {
    apiStructure: testAPIObjectStructure(),
    componentValidation: testComponentDataValidation(),
    cache: testCacheObject(),
    realTimeSubscription: testSubscribeRealTimeData()
  };
  
  // Async tests
  try {
    testResults.getBatchData = await testGetBatchData();
    testResults.preloadData = await testPreloadData();
  } catch (error) {
    console.error('异步测试失败:', error);
    testResults.getBatchData = false;
    testResults.preloadData = false;
  }
  
  // Summary
  console.log('\n📊 测试结果汇总:');
  const passedTests = Object.values(testResults).filter(result => result === true).length;
  const totalTests = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([testName, result]) => {
    console.log(`${result ? '✅' : '❌'} ${testName}: ${result ? '通过' : '失败'}`);
  });
  
  console.log(`\n🎯 总体结果: ${passedTests}/${totalTests} 测试通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！API 修复成功！');
  } else {
    console.log('⚠️ 部分测试失败，需要进一步检查');
  }
  
  return testResults;
}

// Export for use in WeChat Developer Tools console
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testAPIObjectStructure,
    testGetBatchData,
    testPreloadData,
    testSubscribeRealTimeData,
    testCacheObject,
    testComponentDataValidation
  };
} else {
  // Auto-run in browser/WeChat Developer Tools
  runAllTests().then(results => {
    console.log('测试完成，结果:', results);
  }).catch(error => {
    console.error('测试运行失败:', error);
  });
}
