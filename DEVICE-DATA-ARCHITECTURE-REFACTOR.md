# 设备数据架构重构总结

## 重构目标

按照用户要求，统一设备数据架构，确保：
1. `allDevices` 作为唯一的数据源，所有设备信息都从API接口生成
2. `devices` 作为筛选和分页后的显示结果
3. 移除 `filteredDevices` 中间变量，简化数据流
4. 如果业务需求不足，只能在API数据源头更新

## 主要修改

### 1. 数据结构简化

**修改前：**
```javascript
data: {
  allDevices: [], // 所有设备数据（用于分页）
  devices: [], // 当前显示的设备数据
  filteredDevices: [], // 过滤后的设备数据
}
```

**修改后：**
```javascript
data: {
  allDevices: [], // 所有设备数据（统一数据源）
  devices: [], // 当前显示的设备数据（筛选和分页后的结果）
}
```

### 2. 筛选逻辑重构

**新增 `getFilteredDevices()` 方法：**
- 统一处理所有筛选逻辑（搜索、类型筛选、状态筛选、分组筛选）
- 直接从 `allDevices` 获取数据，应用筛选条件后返回结果
- 替代原来分散在各处的筛选逻辑

**简化 `applyFilters()` 方法：**
- 移除复杂的缓存逻辑和重复的筛选代码
- 直接调用 `getFilteredDevices()` 获取筛选结果
- 通过 `loadDevicesWithPagination()` 更新显示

### 3. 分页逻辑优化

**修改 `loadDevicesWithPagination()` 方法：**
- 直接调用 `getFilteredDevices()` 获取源数据
- 移除对 `filteredDevices` 的依赖
- 简化数据流，提高代码可维护性

### 4. API数据源扩展

为满足"水处理"筛选的业务需求，在 `utils/api-mock.js` 中新增了3个水处理设备：

**新增设备：**
1. `device_011` - 净水处理系统 (water_treatment)
2. `device_012` - 循环水处理站 (cooling_water)  
3. `device_013` - 污水预处理系统 (water_treatment)

**水处理设备总数：**
- 原有：2个（废水处理系统、冷却水循环系统）
- 新增：3个
- 总计：5个水处理设备

### 5. 设备ID重新分配

由于新增设备导致ID冲突，重新分配了设备ID：
- 燃气设备：device_014 ~ device_016
- 其他设备：device_017 ~ device_023

## 筛选机制说明

### 设备类型映射

页面上的"水处理"筛选按钮对应：
```javascript
'water': ['cooling_water', 'water_treatment']
```

### 设备属性说明

- **`category`**: 设备大类别（如 'water', 'electricity', 'gas'）
- **`type`**: 具体设备类型（如 'water_treatment', 'cooling_water'）
- **筛选依据**: 页面筛选功能基于 `type` 属性，不是 `category`

## 数据流向

```
API数据源 (utils/api-mock.js)
    ↓
allDevices (统一数据源)
    ↓
getFilteredDevices() (应用筛选条件)
    ↓
loadDevicesWithPagination() (分页处理)
    ↓
devices (页面显示)
```

## 验证结果

修改完成后，点击"水处理"筛选按钮应该显示5个设备：
1. 废水处理系统 (water_treatment)
2. 冷却水循环系统 (cooling_water)
3. 净水处理系统 (water_treatment)
4. 循环水处理站 (cooling_water)
5. 污水预处理系统 (water_treatment)

## 优势

1. **数据一致性**: 单一数据源，避免数据不同步
2. **代码简化**: 移除中间变量，减少复杂度
3. **易于维护**: 统一的筛选逻辑，便于调试和扩展
4. **性能优化**: 减少不必要的数据拷贝和状态管理
5. **业务扩展**: 在API层面扩展数据，满足业务需求
