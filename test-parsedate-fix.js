// Test script for parseDate function fix
// Run this in WeChat Developer Tools console to verify the fix

console.log('🔧 测试 parseDate 函数修复...');

// Test 1: Check if parseDate is properly exported from utils
function testParseDataImport() {
  console.log('\n📋 测试 1: parseDate 导入检查');
  
  try {
    const utils = require('../../utils/utils.js');
    
    if (typeof utils.parseDate === 'function') {
      console.log('✅ parseDate 函数已正确导出');
      return true;
    } else {
      console.error('❌ parseDate 函数未找到或不是函数');
      console.log('utils 对象包含的方法:', Object.keys(utils));
      return false;
    }
  } catch (error) {
    console.error('❌ 导入 utils 失败:', error);
    return false;
  }
}

// Test 2: Test parseDate functionality
function testParseDateFunctionality() {
  console.log('\n📅 测试 2: parseDate 功能测试');
  
  try {
    const { parseDate } = require('../../utils/utils.js');
    
    const testCases = [
      { input: '2024-01-15 10:30', description: 'YYYY-MM-DD HH:mm 格式' },
      { input: '2024/01/15 10:30:00', description: 'YYYY/MM/DD HH:mm:ss 格式' },
      { input: new Date(), description: 'Date 对象' },
      { input: '2024-01-15T10:30:00Z', description: 'ISO 格式' }
    ];
    
    let allTestsPassed = true;
    
    testCases.forEach((testCase, index) => {
      try {
        const result = parseDate(testCase.input);
        
        if (result instanceof Date && !isNaN(result.getTime())) {
          console.log(`✅ 测试 ${index + 1} (${testCase.description}): 通过`);
          console.log(`   输入: ${testCase.input}`);
          console.log(`   输出: ${result.toISOString()}`);
        } else {
          console.error(`❌ 测试 ${index + 1} (${testCase.description}): 失败 - 无效日期`);
          allTestsPassed = false;
        }
      } catch (error) {
        console.error(`❌ 测试 ${index + 1} (${testCase.description}): 错误 - ${error.message}`);
        allTestsPassed = false;
      }
    });
    
    return allTestsPassed;
  } catch (error) {
    console.error('❌ parseDate 功能测试失败:', error);
    return false;
  }
}

// Test 3: Test formatTime method with parseDate
function testFormatTimeIntegration() {
  console.log('\n⏰ 测试 3: formatTime 与 parseDate 集成测试');
  
  try {
    const { parseDate } = require('../../utils/utils.js');
    
    // Mock formatTime method (simplified version)
    const formatTime = function(timeStr) {
      if (!timeStr) {
        return '未知时间';
      }
      
      const date = parseDate(timeStr);
      
      if (isNaN(date.getTime())) {
        return '未知时间';
      }
      
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (minutes < 60) {
        return `${minutes}分钟前`;
      } else if (hours < 24) {
        return `${hours}小时前`;
      } else {
        return `${days}天前`;
      }
    };
    
    const testCases = [
      { input: new Date(Date.now() - 30 * 60 * 1000).toISOString(), expected: '分钟前' },
      { input: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), expected: '小时前' },
      { input: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), expected: '天前' },
      { input: null, expected: '未知时间' },
      { input: 'invalid-date', expected: '未知时间' }
    ];
    
    let allTestsPassed = true;
    
    testCases.forEach((testCase, index) => {
      try {
        const result = formatTime(testCase.input);
        
        if (result.includes(testCase.expected)) {
          console.log(`✅ 测试 ${index + 1}: 通过`);
          console.log(`   输入: ${testCase.input}`);
          console.log(`   输出: ${result}`);
        } else {
          console.error(`❌ 测试 ${index + 1}: 失败`);
          console.log(`   输入: ${testCase.input}`);
          console.log(`   期望包含: ${testCase.expected}`);
          console.log(`   实际输出: ${result}`);
          allTestsPassed = false;
        }
      } catch (error) {
        console.error(`❌ 测试 ${index + 1}: 错误 - ${error.message}`);
        allTestsPassed = false;
      }
    });
    
    return allTestsPassed;
  } catch (error) {
    console.error('❌ formatTime 集成测试失败:', error);
    return false;
  }
}

// Test 4: Test home page data processing simulation
function testHomePageDataProcessing() {
  console.log('\n🏠 测试 4: 首页数据处理模拟');
  
  try {
    const { parseDate } = require('../../utils/utils.js');
    
    // Mock alert data similar to what would come from API
    const mockAlertData = [
      {
        id: 1,
        level: 'warning',
        content: '设备温度过高',
        createTime: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        level: 'info',
        content: '系统正常运行',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        level: 'critical',
        content: '网络连接异常',
        createTime: '2024-01-15 10:30'
      }
    ];
    
    // Simulate the data processing that happens in loadHomeData
    const formatTime = function(timeStr) {
      if (!timeStr) return '未知时间';
      const date = parseDate(timeStr);
      if (isNaN(date.getTime())) return '未知时间';
      
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      
      if (minutes < 60) {
        return `${minutes}分钟前`;
      } else if (hours < 24) {
        return `${hours}小时前`;
      } else {
        return `${Math.floor(hours / 24)}天前`;
      }
    };
    
    const processedAlerts = mockAlertData.map(alert => ({
      id: alert.id,
      level: alert.level,
      message: alert.content || alert.message,
      createdAt: formatTime(alert.createTime || alert.createdAt)
    }));
    
    console.log('✅ 模拟数据处理成功');
    console.log('处理后的告警数据:', processedAlerts);
    
    // Check if all alerts have valid createdAt values
    const allValid = processedAlerts.every(alert => 
      alert.createdAt && alert.createdAt !== '未知时间'
    );
    
    if (allValid) {
      console.log('✅ 所有告警时间格式化成功');
      return true;
    } else {
      console.error('❌ 部分告警时间格式化失败');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 首页数据处理模拟失败:', error);
    return false;
  }
}

// Main test runner
async function runParseDataTests() {
  console.log('🚀 开始运行 parseDate 修复测试...\n');
  
  const testResults = {
    import: testParseDataImport(),
    functionality: testParseDateFunctionality(),
    integration: testFormatTimeIntegration(),
    homePageSimulation: testHomePageDataProcessing()
  };
  
  // Summary
  console.log('\n📊 测试结果汇总:');
  const passedTests = Object.values(testResults).filter(result => result === true).length;
  const totalTests = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([testName, result]) => {
    console.log(`${result ? '✅' : '❌'} ${testName}: ${result ? '通过' : '失败'}`);
  });
  
  console.log(`\n🎯 总体结果: ${passedTests}/${totalTests} 测试通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！parseDate 修复成功！');
    console.log('💡 首页应该能够正常加载，不再出现 "parseDate is not a function" 错误');
  } else {
    console.log('⚠️ 部分测试失败，需要进一步检查');
  }
  
  return testResults;
}

// Export for use in WeChat Developer Tools console
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runParseDataTests,
    testParseDataImport,
    testParseDateFunctionality,
    testFormatTimeIntegration,
    testHomePageDataProcessing
  };
} else {
  // Auto-run in browser/WeChat Developer Tools
  runParseDataTests().then(results => {
    console.log('parseDate 测试完成，结果:', results);
  }).catch(error => {
    console.error('parseDate 测试运行失败:', error);
  });
}
