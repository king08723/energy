// pages/saving/saving.js
// 智慧能源管理 - 节能方案与建议页面
// 提供个性化的节能建议和方案

const API = require('../../utils/api.js');

Page({
  data: {
    // 页面状态
    loading: false,
    refreshing: false,
    
    // 节能概览数据
    overview: {
      totalSavingPotential: 0,
      monthlySavingPotential: 0,
      carbonReductionPotential: 0,
      costSavingPotential: 0
    },
    
    // 节能方案列表
    savingPlans: [],
    
    // 节能小贴士
    savingTips: [],
    
    // 节能成果
    achievements: {
      summary: {},
      monthly: [],
      categories: [],
      milestones: []
    },
    
    // 节能目标
    goals: {
      current: {},
      history: [],
      suggestions: []
    },
    
    // 节能知识库
    knowledgeBase: [],
    
    // 当前选中的标签页
    activeTab: 'plans', // plans, tips, achievements, goals, knowledge
    
    // 筛选条件
    filters: {
      planCategory: 'all', // all, temperature, lighting, equipment, monitoring
      planPriority: 'all', // all, high, medium, low
      tipCategory: 'all', // all, daily, lighting, equipment, water
      knowledgeCategory: 'all' // all, basic, technology, practice, policy, case
    },
    
    // 展开状态
    expandedItems: {
      plans: {},
      knowledge: {}
    }
  },

  /**
   * 页面加载
   */
  onLoad: function (options) {
    this.loadSavingData();
  },

  /**
   * 页面显示
   */
  onShow: function () {
    // 数据预加载
    API.preloadData('saving');
  },

  /**
   * 加载节能数据
   */
  async loadSavingData() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    
    try {
      const result = await API.getSavingPlans();
      
      if (result.success) {
        const { overview, plans, tips, achievements, goals, knowledgeBase } = result.data;
        
        this.setData({
          overview,
          savingPlans: plans,
          savingTips: tips,
          achievements,
          goals,
          knowledgeBase
        });
      } else {
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('加载节能数据失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 切换标签页
   */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  /**
   * 筛选方案
   */
  onPlanFilter(e) {
    const { type, value } = e.currentTarget.dataset;
    this.setData({
      [`filters.${type}`]: value
    });
  },

  /**
   * 获取筛选后的方案列表
   */
  getFilteredPlans() {
    const { savingPlans, filters } = this.data;
    
    return savingPlans.filter(plan => {
      const categoryMatch = filters.planCategory === 'all' || plan.category === filters.planCategory;
      const priorityMatch = filters.planPriority === 'all' || plan.priority === filters.planPriority;
      return categoryMatch && priorityMatch;
    });
  },

  /**
   * 获取筛选后的小贴士列表
   */
  getFilteredTips() {
    const { savingTips, filters } = this.data;
    
    return savingTips.filter(tip => {
      return filters.tipCategory === 'all' || tip.category === filters.tipCategory;
    });
  },

  /**
   * 获取筛选后的知识库列表
   */
  getFilteredKnowledge() {
    const { knowledgeBase, filters } = this.data;
    
    return knowledgeBase.filter(item => {
      return filters.knowledgeCategory === 'all' || item.category === filters.knowledgeCategory;
    });
  },

  /**
   * 展开/收起方案详情
   */
  togglePlanDetail(e) {
    const planId = e.currentTarget.dataset.planId;
    const currentState = this.data.expandedItems.plans[planId] || false;
    
    this.setData({
      [`expandedItems.plans.${planId}`]: !currentState
    });
  },

  /**
   * 展开/收起知识详情
   */
  toggleKnowledgeDetail(e) {
    const knowledgeId = e.currentTarget.dataset.knowledgeId;
    const currentState = this.data.expandedItems.knowledge[knowledgeId] || false;
    
    this.setData({
      [`expandedItems.knowledge.${knowledgeId}`]: !currentState
    });
  },

  /**
   * 执行节能方案
   */
  async executePlan(e) {
    const planId = e.currentTarget.dataset.planId;
    const plan = this.data.savingPlans.find(p => p.id === planId);
    
    if (!plan) return;
    
    wx.showModal({
      title: '执行节能方案',
      content: `确定要执行"${plan.title}"方案吗？`,
      success: (res) => {
        if (res.confirm) {
          this.performPlanExecution(plan);
        }
      }
    });
  },

  /**
   * 执行方案操作
   */
  async performPlanExecution(plan) {
    wx.showLoading({ title: '执行中...' });
    
    try {
      // 模拟执行过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 更新方案状态
      const updatedPlans = this.data.savingPlans.map(p => {
        if (p.id === plan.id) {
          return { ...p, status: 'in_progress' };
        }
        return p;
      });
      
      this.setData({ savingPlans: updatedPlans });
      
      wx.showToast({
        title: '方案执行成功',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: '执行失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 查看方案详情
   */
  viewPlanDetail(e) {
    const planId = e.currentTarget.dataset.planId;
    const plan = this.data.savingPlans.find(p => p.id === planId);
    
    if (!plan) return;
    
    // 显示详细信息
    wx.showModal({
      title: plan.title,
      content: `${plan.description}\n\n预计节能：${plan.estimatedSaving.energy}kWh\n预计节约：${plan.estimatedSaving.cost}元\n减少碳排放：${plan.estimatedSaving.carbon}kg`,
      showCancel: false
    });
  },

  /**
   * 设置节能目标
   */
  setSavingGoal() {
    wx.showModal({
      title: '设置节能目标',
      content: '请在设置页面中配置您的节能目标',
      showCancel: false
    });
  },

  /**
   * 查看成果详情
   */
  viewAchievementDetail(e) {
    const type = e.currentTarget.dataset.type;
    const { achievements } = this.data;
    
    let content = '';
    switch (type) {
      case 'energy':
        content = `累计节能：${achievements.summary.totalEnergySaved}kWh\n节能率：${achievements.summary.savingRate}%`;
        break;
      case 'cost':
        content = `累计节约：${achievements.summary.totalCostSaved}元\n平均每月节约：${(achievements.summary.totalCostSaved / 12).toFixed(2)}元`;
        break;
      case 'carbon':
        content = `累计减碳：${achievements.summary.totalCarbonReduced}kg CO2\n相当于种植${Math.round(achievements.summary.totalCarbonReduced / 22)}棵树`;
        break;
    }
    
    wx.showModal({
      title: '节能成果',
      content: content,
      showCancel: false
    });
  },

  /**
   * 分享小贴士
   */
  shareTip(e) {
    const tipId = e.currentTarget.dataset.tipId;
    const tip = this.data.savingTips.find(t => t.id === tipId);
    
    if (!tip) return;
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  /**
   * 导航到设备页面
   */
  navigateToDevices() {
    wx.switchTab({
      url: '/pages/devices/devices'
    });
  },

  /**
   * 导航到数据分析页面
   */
  navigateToData() {
    wx.switchTab({
      url: '/pages/data/data'
    });
  },

  /**
   * 刷新数据
   */
  async onRefresh() {
    if (this.data.refreshing) return;
    
    this.setData({ refreshing: true });
    
    try {
      await this.loadSavingData();
    } finally {
      this.setData({ refreshing: false });
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.onRefresh().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 分享页面
   */
  onShareAppMessage() {
    return {
      title: '智能节能方案 - 一起为地球节能减排',
      path: '/pages/saving/saving'
    };
  }
})