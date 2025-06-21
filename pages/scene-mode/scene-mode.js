// pages/scene-mode/scene-mode.js
const API = require('../../utils/api.js');
const { parseDate } = require('../../utils/utils.js');

Page({
  data: {
    // 场景模式统计数据
    sceneStats: {
      total: 0,
      active: 0,
      devicesCovered: 0
    },
    
    // 场景模式列表
    scenes: [],
    filteredScenes: [],
    activeScene: null,
    
    // 筛选相关
    filterType: 'all',
    showFilter: false,
    
    // 刷新状态
    isRefreshing: false,
    
    // 加载状态
    loading: false
  },

  onLoad: function (options) {
    // 页面加载时初始化数据
    this.loadSceneData();
  },

  onShow: function () {
    // 页面显示时刷新数据
    this.refreshSceneData();
  },

  /**
   * 加载场景模式数据
   */
  loadSceneData: function() {
    this.setData({ loading: true });
    
    API.getSceneModes().then(res => {
      if (res.success) {
        const scenes = res.data || [];
        const activeScene = scenes.find(scene => scene.isActive);
        
        // 计算设备覆盖数量（去重）
        const coveredDevices = new Set();
        scenes.forEach(scene => {
          scene.devices.forEach(device => {
            coveredDevices.add(device.deviceId);
          });
        });
        
        // 格式化最后激活时间
        scenes.forEach(scene => {
          if (scene.lastActiveTime) {
            // 使用iOS兼容的日期解析函数
            const date = parseDate(scene.lastActiveTime);
            scene.lastActiveTime = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          }
        });
        
        this.setData({
          scenes: scenes,
          filteredScenes: scenes,
          activeScene: activeScene,
          sceneStats: {
            total: scenes.length,
            active: activeScene ? 1 : 0,
            devicesCovered: coveredDevices.size
          },
          loading: false
        });
        
        // 应用筛选
        this.applyFilter();
      } else {
        wx.showToast({
          title: '加载场景模式失败',
          icon: 'none'
        });
        this.setData({ loading: false });
      }
    }).catch(err => {
      console.error('加载场景模式出错:', err);
      wx.showToast({
        title: '加载场景模式出错',
        icon: 'none'
      });
      this.setData({ loading: false });
    });
  },

  /**
   * 刷新场景模式数据
   */
  refreshSceneData: function() {
    this.setData({ isRefreshing: true });
    
    this.loadSceneData();
    
    // 1秒后关闭刷新动画
    setTimeout(() => {
      this.setData({ isRefreshing: false });
    }, 1000);
  },

  /**
   * 手动刷新
   */
  onRefresh: function() {
    this.refreshSceneData();
  },

  /**
   * 切换筛选面板
   */
  toggleFilter: function() {
    this.setData({
      showFilter: !this.data.showFilter
    });
  },

  /**
   * 筛选场景类型
   */
  onFilterType: function(e) {
    const type = e.currentTarget.dataset.type;
    
    this.setData({
      filterType: type,
      showFilter: false
    });
    
    this.applyFilter();
  },

  /**
   * 应用筛选
   */
  applyFilter: function() {
    const { scenes, filterType } = this.data;
    
    let filtered = scenes;
    
    // 按类型筛选
    if (filterType !== 'all') {
      filtered = scenes.filter(scene => scene.type === filterType);
    }
    
    this.setData({
      filteredScenes: filtered
    });
  },

  /**
   * 切换场景模式
   */
  onSwitchScene: function(e) {
    const sceneId = e.currentTarget.dataset.id;
    
    wx.showLoading({
      title: '正在切换场景...',
      mask: true
    });
    
    API.switchSceneMode(sceneId).then(res => {
      wx.hideLoading();
      
      if (res.success) {
        wx.showToast({
          title: '场景切换成功',
          icon: 'success'
        });
        
        // 刷新数据
        this.loadSceneData();
      } else {
        wx.showToast({
          title: res.message || '场景切换失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('切换场景出错:', err);
      wx.showToast({
        title: '切换场景出错',
        icon: 'none'
      });
    });
  },

  /**
   * 编辑场景模式
   */
  onEditScene: function(e) {
    const sceneId = e.currentTarget.dataset.id;
    
    wx.showToast({
      title: '没有权限YJ03',
      icon: 'none'
    });
    
    // TODO: 跳转到场景编辑页面
    // wx.navigateTo({
    //   url: `/pages/scene-edit/scene-edit?id=${sceneId}`
    // });
  },

  /**
   * 删除场景模式
   */
  onDeleteScene: function(e) {
    const sceneId = e.currentTarget.dataset.id;
    const scene = this.data.scenes.find(s => s.id === sceneId);
    
    if (!scene) return;
    
    // 确认删除
    wx.showModal({
      title: '确认删除',
      content: `确定要删除场景「${scene.name}」吗？`,
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          // TODO: 调用删除API
          wx.showToast({
            title: '没有权限YJ03',
            icon: 'none'
          });
          
          // 模拟删除成功
          // this.loadSceneData();
        }
      }
    });
  },

  /**
   * 添加新场景模式
   */
  onAddScene: function() {
    wx.showToast({
      title: '没有权限YJ03',
      icon: 'none'
    });
    
    // TODO: 跳转到添加场景页面
    // wx.navigateTo({
    //   url: '/pages/scene-edit/scene-edit'
    // });
  }
});