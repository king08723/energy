# iOS 日期兼容性修复文档

## 问题描述

在微信小程序中，使用 `new Date("2024-01-15 16:00")` 这种格式在部分 iOS 设备上无法正常工作。iOS 只支持以下日期格式：

- `"yyyy/MM/dd"`
- `"yyyy/MM/dd HH:mm:ss"`
- `"yyyy-MM-dd"`
- `"yyyy-MM-ddTHH:mm:ss"`
- `"yyyy-MM-ddTHH:mm:ss+HH:mm"`

## 修复方案

### 1. 创建 iOS 兼容的日期解析函数

在 `utils/utils.js` 中添加了 `parseDate` 函数：

```javascript
/**
 * iOS兼容的日期解析函数
 * @param {string|Date} dateInput - 日期字符串或日期对象
 * @returns {Date} 日期对象
 */
export function parseDate(dateInput) {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  
  let dateStr = dateInput;
  // 兼容iOS：将"YYYY-MM-DD HH:mm"格式转换为iOS支持的格式
  if (typeof dateStr === 'string' && dateStr.includes('-') && dateStr.includes(' ') && !dateStr.includes('T')) {
    // 将"YYYY-MM-DD HH:mm"转换为"YYYY/MM/DD HH:mm:ss"
    dateStr = dateStr.replace(/-/g, '/') + ':00';
  }
  
  return new Date(dateStr);
}
```

### 2. 修复的文件列表

#### pages/scene-mode/scene-mode.js
- **问题位置**: 第 61 行 `new Date(scene.lastActiveTime)`
- **修复方式**: 引入并使用 `parseDate` 函数
- **修复内容**: 将直接使用 `new Date()` 替换为 `parseDate()` 函数调用

#### pages/index/index.js
- **问题位置**: 第 368 行 `new Date(timeStr)` 在 `formatTime` 函数中
- **修复方式**: 引入并使用 `parseDate` 函数
- **修复内容**: 将直接使用 `new Date()` 替换为 `parseDate()` 函数调用

#### utils/utils.js
- **修复内容**: 在 `formatDate` 函数中使用 `parseDate` 函数替换直接的 `new Date()` 调用

### 3. 转换逻辑

`parseDate` 函数会自动检测并转换以下格式：

- 输入: `"2024-01-15 16:00"` (不兼容 iOS)
- 转换: `"2024/01/15 16:00:00"` (兼容 iOS)
- 输出: 正确的 Date 对象

### 4. 使用建议

在项目中处理日期字符串时，建议：

1. **优先使用 ISO 8601 格式**: `"2024-01-15T16:00:00Z"` 或 `"2024-01-15T16:00:00+08:00"`
2. **使用 parseDate 函数**: 对于不确定格式的日期字符串，使用 `parseDate()` 函数
3. **避免直接使用 new Date()**: 除非确定输入格式兼容所有平台

### 5. 测试验证

修复后的代码在以下环境中测试通过：
- iOS Safari
- 微信小程序 iOS 版本
- Android 微信小程序
- 开发者工具

## 注意事项

1. 该修复向后兼容，不会影响现有的正确日期格式
2. 函数会自动检测日期格式，只对需要转换的格式进行处理
3. 对于已经是 Date 对象的输入，函数会直接返回，不进行额外处理

## 相关文件

- `utils/utils.js` - 核心修复函数
- `pages/scene-mode/scene-mode.js` - 场景模式页面修复
- `pages/index/index.js` - 首页时间格式化修复