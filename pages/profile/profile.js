// pages/profile/profile.js
// 智慧能源管理 - 我的页面
// 提供用户个人信息管理、账号设置、消息中心及其他辅助功能

const API = require('../../utils/api.js');

Page({
  data: {
    // 用户信息
    userInfo: {
      id: '',
      nickname: '用户',
      avatar: '',
      phone: '',
      role: 'user',
      company: '',
      department: ''
    },
    
    // 统计数据
    statistics: {
      deviceCount: 0,
      alertCount: 0,
      energySaving: 0,
      carbonReduction: 0
    },
    
    // 功能菜单
    menuItems: [
      {
        id: 'devices',
        title: '我的设备',
        subtitle: '设备管理',
        icon: '🔌',
        count: 0,
        path: '/pages/devices/devices'
      },
      {
        id: 'alerts',
        title: '消息中心',
        subtitle: '告警通知',
        icon: '🔔',
        count: 0,
        path: '/pages/alerts/alerts'
      },
      {
        id: 'user-management',
        title: '用户管理',
        subtitle: '权限设置',
        icon: '👥',
        count: 0,
        path: '/pages/user-management/user-management',
        adminOnly: true
      },
      {
        id: 'automation',
        title: '自动化规则',
        subtitle: '智能控制',
        icon: '⚙️',
        count: 0,
        path: '/pages/automation/automation'
      }
    ],
    
    // 设置菜单
    settingItems: [
      {
        id: 'feedback',
        title: '意见反馈',
        subtitle: '帮助我们改进',
        icon: '💬'
      },
      {
        id: 'privacy',
        title: '隐私设置',
        subtitle: '数据安全',
        icon: '🔒'
      },
      {
        id: 'about',
        title: '关于我们',
        subtitle: '版本信息',
        icon: 'ℹ️'
      }
    ],
    
    // 页面状态
    loading: false,
    refreshing: false
  },

  /**
   * 页面加载
   */
  onLoad: function (options) {
    this.loadUserData();
  },

  /**
   * 页面显示时刷新数据
   */
  onShow: function () {
    this.refreshUserData();
  },

  /**
   * 加载用户数据
   */
  async loadUserData() {
    this.setData({ loading: true });
    
    try {
      // 并行获取用户信息和统计数据
      const [userResult, statsResult] = await Promise.all([
        API.getUserInfo(),
        API.getUserStatistics()
      ]);
      
      if (userResult.success) {
        this.setData({
          userInfo: userResult.data
        });
        
        // 根据用户角色过滤菜单
        this.filterMenuByRole(userResult.data.role);
      }
      
      if (statsResult.success) {
        this.setData({
          statistics: statsResult.data
        });
        
        // 更新菜单项的计数
        this.updateMenuCounts(statsResult.data);
      }
      
    } catch (error) {
      console.error('用户数据加载失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 刷新用户数据
   */
  async refreshUserData() {
    if (this.data.refreshing) return;
    
    this.setData({ refreshing: true });
    
    try {
      await this.loadUserData();
    } finally {
      this.setData({ refreshing: false });
    }
  },

  /**
   * 根据用户角色过滤菜单
   */
  filterMenuByRole(role) {
    const menuItems = this.data.menuItems.filter(item => {
      if (item.adminOnly && role !== 'admin') {
        return false;
      }
      return true;
    });
    
    this.setData({ menuItems });
  },

  /**
   * 更新菜单项计数
   */
  updateMenuCounts(stats) {
    const menuItems = this.data.menuItems.map(item => {
      switch (item.id) {
        case 'devices':
          item.count = stats.deviceCount;
          break;
        case 'alerts':
          item.count = stats.alertCount;
          break;
        case 'user-management':
          item.count = stats.userCount || 0;
          break;
        case 'automation':
          item.count = stats.automationCount || 0;
          break;
      }
      return item;
    });
    
    this.setData({ menuItems });
  },

  /**
   * 点击菜单项
   */
  onMenuItemTap(e) {
    const { item } = e.currentTarget.dataset;
    
    if (item.path) {
      wx.navigateTo({
        url: item.path
      });
    }
  },

  /**
   * 点击设置项
   */
  onSettingItemTap(e) {
    const { item } = e.currentTarget.dataset;
    
    switch (item.id) {
      case 'feedback':
        this.showFeedback();
        break;
      case 'privacy':
        this.showPrivacySettings();
        break;
      case 'about':
        this.showAbout();
        break;
    }
  },

  /**
   * 编辑用户信息
   */
  onEditProfile() {
    wx.showModal({
      title: '编辑资料',
      content: '没有权限YJ03',
      showCancel: false
    });
  },

  /**
   * 显示意见反馈
   */
  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您的反馈，我们会持续改进产品体验',
      showCancel: false
    });
  },

  /**
   * 显示隐私设置
   */
  showPrivacySettings() {
    wx.showActionSheet({
      itemList: ['数据使用权限', '消息推送设置', '隐私政策'],
      success: (res) => {
        const options = ['数据使用权限', '消息推送设置', '隐私政策'];
        wx.showToast({
          title: `${options[res.tapIndex]}设置`,
          icon: 'none'
        });
      }
    });
  },

  /**
   * 显示关于信息
   */
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '智慧能源管理小程序\n版本：v1.0.0\n© 2024 智慧科技有限公司',
      showCancel: false
    });
  },

  /**
   * 退出登录
   */
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息
          wx.removeStorageSync('userToken');
          wx.removeStorageSync('userInfo');
          
          // 跳转到登录页
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.refreshUserData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
})