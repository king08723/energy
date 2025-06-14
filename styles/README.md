# 智慧能源管理小程序 - 设计系统使用指南

## 概述

本设计系统基于首页的视觉风格提取而来，旨在确保整个小程序的视觉一致性。采用深色科技感主题，以青色为主色调，营造专业的能源管理界面感觉。

## 使用方法

### 1. 引入设计系统

在需要使用设计系统的页面的 `.wxss` 文件中引入：

```css
@import "../../styles/design-system.wxss";
```

### 2. 基础布局

使用 `energy-container` 作为页面的根容器：

```xml
<view class="energy-container">
  <!-- 页面内容 -->
</view>
```

### 3. 背景装饰

添加浮动的背景装饰圆圈：

```xml
<view class="energy-bg-decoration">
  <view class="energy-bg-circle" style="width: 200rpx; height: 200rpx; top: 10%; right: -50rpx; animation-delay: 0s; opacity: 0.6;"></view>
  <view class="energy-bg-circle" style="width: 150rpx; height: 150rpx; top: 60%; left: -30rpx; animation-delay: 2s; opacity: 0.4;"></view>
  <!-- 可以添加更多圆圈 -->
</view>
```

## 核心设计元素

### 配色方案

- **主色调**: `#00ffff` (青色)
- **背景渐变**: `#0f1419 → #1a2332 → #0d1421`
- **卡片背景**: 深色渐变 + 毛玻璃效果
- **文字颜色**: 白色主文字 + 青色强调文字
- **状态色**: 成功(绿) / 警告(橙) / 错误(红) / 信息(蓝)

### 文字样式

```xml
<!-- 大标题 -->
<text class="energy-title-large">智慧能源</text>

<!-- 中等标题 -->
<text class="energy-title-medium">总能耗概览</text>

<!-- 小标题 -->
<text class="energy-title-small">实时数据</text>

<!-- 主要文字 -->
<text class="energy-text-primary">主要内容</text>

<!-- 次要文字 -->
<text class="energy-text-secondary">次要信息</text>

<!-- 辅助文字 -->
<text class="energy-text-tertiary">辅助信息</text>

<!-- 弱化文字 -->
<text class="energy-text-muted">弱化内容</text>
```

### 卡片组件

```xml
<!-- 毛玻璃卡片 -->
<view class="energy-glass-card energy-p-32">
  <view class="energy-flex-between energy-mb-24">
    <text class="energy-title-medium">卡片标题</text>
    <text class="energy-text-tertiary">副标题</text>
  </view>
  <!-- 卡片内容 -->
</view>
```

### 数据卡片

```xml
<view class="energy-glass-card energy-data-card">
  <view class="energy-icon energy-icon-power">
    <text>⚡</text>
  </view>
  <view class="energy-flex" style="flex-direction: column; flex: 1; gap: 4rpx;">
    <text class="energy-text-secondary" style="font-size: 24rpx;">用电量</text>
    <text class="energy-text-primary" style="font-size: 32rpx; font-weight: bold;">1,234 kWh</text>
  </view>
  <view class="energy-status-dot energy-status-success"></view>
</view>
```

### 按钮组件

```xml
<!-- 圆形按钮 -->
<view class="energy-btn" style="width: 60rpx; height: 60rpx;">
  <text class="energy-btn-icon" style="font-size: 32rpx;">🔄</text>
</view>
```

### 图标样式

```xml
<!-- 电力图标 -->
<view class="energy-icon energy-icon-power">
  <text style="color: #ffffff;">⚡</text>
</view>

<!-- 水资源图标 -->
<view class="energy-icon energy-icon-water">
  <text style="color: #ffffff;">💧</text>
</view>

<!-- 燃气图标 -->
<view class="energy-icon energy-icon-gas">
  <text style="color: #ffffff;">🔥</text>
</view>

<!-- 碳排放图标 -->
<view class="energy-icon energy-icon-carbon">
  <text style="color: #ffffff;">🌱</text>
</view>
```

### 状态指示器

```xml
<!-- 严重状态 -->
<view class="energy-status-dot energy-status-critical"></view>

<!-- 警告状态 -->
<view class="energy-status-dot energy-status-warning"></view>

<!-- 正常状态 -->
<view class="energy-status-dot energy-status-success"></view>
```

### 趋势指示器

```xml
<!-- 上升趋势 -->
<text class="energy-trend-up">↑ +5.2%</text>

<!-- 下降趋势 -->
<text class="energy-trend-down">↓ -2.1%</text>
```

## 工具类

### 布局工具类

```xml
<!-- Flex 布局 -->
<view class="energy-flex">内容</view>
<view class="energy-flex-center">居中内容</view>
<view class="energy-flex-between">两端对齐</view>

<!-- Grid 布局 -->
<view class="energy-grid-2">
  <view>项目1</view>
  <view>项目2</view>
</view>
```

### 间距工具类

```xml
<!-- 外边距 -->
<view class="energy-mb-32">下边距32rpx</view>
<view class="energy-mb-24">下边距24rpx</view>
<view class="energy-mb-16">下边距16rpx</view>

<!-- 内边距 -->
<view class="energy-p-32">内边距32rpx</view>
<view class="energy-p-24">内边距24rpx</view>
<view class="energy-p-16">内边距16rpx</view>
```

### 圆角工具类

```xml
<view class="energy-rounded">大圆角(24rpx)</view>
<view class="energy-rounded-small">小圆角(12rpx)</view>
```

### 过渡动画

```xml
<view class="energy-transition">带过渡效果的元素</view>
```

## 动画效果

### 加载动画

```xml
<!-- 旋转动画 -->
<view class="energy-spinning">
  <text>🔄</text>
</view>

<!-- 脉冲动画 -->
<view class="energy-pulsing">
  内容
</view>

<!-- 闪烁动画 -->
<view class="energy-shimmer">
  加载中...
</view>
```

## 响应式设计

设计系统已内置响应式支持：
- 小屏幕设备自动调整内边距和字体大小
- 支持深色模式自动适配

## 最佳实践

1. **保持一致性**: 始终使用设计系统中定义的颜色、字体和间距
2. **合理使用动画**: 适度使用动画效果，避免过度动画影响性能
3. **响应式考虑**: 确保在不同屏幕尺寸下的良好显示效果
4. **可访问性**: 保持足够的颜色对比度和合适的字体大小
5. **性能优化**: 合理使用毛玻璃效果，避免在低端设备上造成性能问题

## 扩展指南

如需添加新的组件样式：
1. 遵循现有的命名规范（`energy-` 前缀）
2. 使用设计系统中定义的 CSS 变量
3. 保持与整体风格的一致性
4. 添加相应的文档说明

## 示例页面结构

```xml
<view class="energy-container">
  <!-- 背景装饰 -->
  <view class="energy-bg-decoration">
    <view class="energy-bg-circle" style="width: 200rpx; height: 200rpx; top: 10%; right: -50rpx; animation-delay: 0s; opacity: 0.6;"></view>
  </view>
  
  <!-- 页面标题 -->
  <view class="energy-flex-between energy-mb-32">
    <text class="energy-title-large">页面标题</text>
    <view class="energy-btn" style="width: 60rpx; height: 60rpx;">
      <text class="energy-btn-icon">⚙️</text>
    </view>
  </view>
  
  <!-- 内容卡片 -->
  <view class="energy-glass-card energy-p-32">
    <text class="energy-title-medium energy-mb-24">内容标题</text>
    <view class="energy-grid-2">
      <!-- 数据项 -->
    </view>
  </view>
</view>
```

通过遵循这个设计系统，可以确保整个小程序保持一致的视觉风格和用户体验。