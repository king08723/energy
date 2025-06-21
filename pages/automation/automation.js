// pages/automation/automation.js
// 引入API模拟数据实例
const apiMock = require('../../utils/api-mock.js').instance;

Page({
  data: {
    // 页面数据
    isRefreshing: false,
    ruleStats: {
      total: 0,
      enabled: 0,
      executed: 0
    },
    automationRules: [], // 所有规则
    filteredRules: [], // 筛选后的规则
    filterType: 'all', // 筛选类型：all, time, condition, scene
    showFilter: false, // 是否显示筛选下拉菜单
    
    // 规则详情
    showRuleDetail: false,
    currentRule: null
  },

  onLoad: function (options) {
    this.loadAutomationRules();
  },

  onShow: function () {
    // 每次页面显示时刷新数据
    this.loadAutomationRules();
  },

  // 加载自动化规则数据
  loadAutomationRules: function() {
    this.setData({ isRefreshing: true });
    
    // 模拟API请求延迟
    setTimeout(() => {
      // 获取API返回的结果对象
      const result = apiMock.getAutomationRules();
      // 从结果对象中提取规则数组
      const rules = result.data;
      
      // 计算统计数据
      const enabledRules = rules.filter(rule => rule.enabled);
      const totalExecuteCount = rules.reduce((sum, rule) => sum + rule.executeCount, 0);
      
      this.setData({
        automationRules: rules,
        filteredRules: rules,
        ruleStats: {
          total: rules.length,
          enabled: enabledRules.length,
          executed: totalExecuteCount
        },
        isRefreshing: false
      });
      
      // 应用当前筛选
      this.applyFilter(this.data.filterType);
    }, 500);
  },
  
  // 刷新数据
  onRefresh: function() {
    this.loadAutomationRules();
  },
  
  // 切换筛选下拉菜单
  toggleFilter: function() {
    this.setData({
      showFilter: !this.data.showFilter
    });
  },
  
  // 选择筛选类型
  onFilterType: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      filterType: type,
      showFilter: false
    });
    
    this.applyFilter(type);
  },
  
  // 应用筛选
  applyFilter: function(type) {
    let filteredRules = [];
    
    if (type === 'all') {
      filteredRules = this.data.automationRules;
    } else {
      filteredRules = this.data.automationRules.filter(rule => rule.trigger.type === type);
    }
    
    this.setData({ filteredRules });
  },
  
  // 添加新规则
  onAddRule: function() {
    wx.showToast({
      title: '没有权限YJ03',
      icon: 'none'
    });
    // 实际项目中应该跳转到规则编辑页面
    // wx.navigateTo({
    //   url: '/pages/automation/rule-edit/rule-edit'
    // });
  },
  
  // 查看规则详情
  onRuleDetail: function(e) {
    const ruleId = e.currentTarget.dataset.id;
    const rule = this.data.automationRules.find(r => r.id === ruleId);
    
    if (rule) {
      this.setData({
        currentRule: rule,
        showRuleDetail: true
      });
    }
  },
  
  // 关闭规则详情
  onCloseDetail: function() {
    this.setData({
      showRuleDetail: false
    });
  },
  
  // 编辑规则
  onEditRule: function(e) {
    const ruleId = e.currentTarget.dataset.id;
    
    wx.showToast({
      title: '没有权限YJ03',
      icon: 'none'
    });
    // 实际项目中应该跳转到规则编辑页面
    // wx.navigateTo({
    //   url: `/pages/automation/rule-edit/rule-edit?id=${ruleId}`
    // });
  },
  
  // 切换规则启用状态
  onToggleRule: function(e) {
    const ruleId = e.currentTarget.dataset.id;
    const enabled = e.detail.value;
    
    // 找到对应规则
    const rule = this.data.automationRules.find(r => r.id === ruleId);
    if (!rule) return;
    
    // 更新规则状态
    rule.enabled = enabled;
    
    // 调用API更新规则
    apiMock.updateAutomationRule(rule);
    
    // 刷新数据
    this.loadAutomationRules();
    
    wx.showToast({
      title: enabled ? '规则已启用' : '规则已禁用',
      icon: 'none'
    });
  },
  
  // 阻止开关点击事件冒泡
  // 注意：由于在WXML中已经使用了catchtap，此函数可以为空
  // catchtap会自动阻止事件冒泡，不需要再调用stopPropagation
  onSwitchTap: function(e) {
    // 不需要额外操作，catchtap已经阻止了事件冒泡
  }
})