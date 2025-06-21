// 告警详情页面逻辑
const API = require('../../utils/api.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 告警基本信息
    alert: null,
    device: null,
    
    // 能耗数据（用于能耗异常告警）
    energyData: null,
    
    // 处理历史
    handleHistory: [],
    
    // 处理建议
    suggestions: [],
    
    // 页面状态
    isLoading: true,
    isHandling: false,
    
    // 告警级别映射
    levelMap: {
      'critical': {
        text: '严重',
        color: '#ef4444',
        icon: 'connection-error'  // 使用现有的错误图标
      },
      'warning': {
        text: '警告',
        color: '#f59e0b',
        icon: 'search'  // 使用现有的搜索图标作为警告
      },
      'info': {
        text: '提示',
        color: '#06b6d4',
        icon: 'connection-success'  // 使用现有的成功图标
      }
    },
    
    // 告警类型映射
    typeMap: {
      'device_offline': '设备离线',
      'energy_abnormal': '能耗异常',
      'temperature_high': '温度过高',
      'temperature_low': '温度过低',
      'maintenance_reminder': '维护提醒',
      'energy_saving_tip': '节能建议'
    },
    
    // 状态映射
    statusMap: {
      'unread': '未读',
      'read': '已读',
      'ignored': '已忽略',
      'resolved': '已解决'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('告警详情页加载，参数:', options);
    
    // 获取告警ID
    const alertId = options.id || options.alertId;
    if (!alertId) {
      wx.showToast({
        title: '告警ID不能为空',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    // 保存告警ID
    this.alertId = alertId;
    
    // 加载告警详情
    this.loadAlertDetail();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 设置导航栏标题
    wx.setNavigationBarTitle({
      title: '告警详情'
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时可以刷新数据
    if (this.alertId && this.data.alert) {
      this.loadAlertDetail();
    }
  },

  /**
   * 加载告警详情数据
   */
  async loadAlertDetail() {
    try {
      this.setData({ isLoading: true });
      
      console.log('加载告警详情，ID:', this.alertId);
      
      // 调用API获取告警详情
      const result = await API.getAlertDetail(this.alertId);
      
      if (result.success) {
        const alertData = result.data;
        
        // 处理告警级别信息
        const levelInfo = this.data.levelMap[alertData.level] || {
          text: '未知',
          color: '#666666',
          icon: 'icon-info'
        };
        
        // 处理告警类型信息
        const typeText = this.data.typeMap[alertData.type] || '未知类型';
        
        // 处理状态信息
        const statusText = this.data.statusMap[alertData.status] || '未知状态';
        
        // 处理能耗数据，计算超出比例
        let processedEnergyData = alertData.energyData;
        if (processedEnergyData && processedEnergyData.current && processedEnergyData.normal) {
          const percentage = ((processedEnergyData.current - processedEnergyData.normal) / processedEnergyData.normal * 100).toFixed(1);
          processedEnergyData = {
            ...processedEnergyData,
            percentage: percentage
          };
        }
        
        // 更新页面数据
        this.setData({
          alert: {
            ...alertData,
            levelInfo,
            typeText,
            statusText
          },
          device: alertData.device,
          energyData: processedEnergyData,
          handleHistory: alertData.handleHistory || [],
          suggestions: alertData.suggestions || [],
          isLoading: false
        });
        
        // 如果是未读告警，自动标记为已读
        if (alertData.status === 'unread') {
          this.markAsRead();
        }
        
        console.log('告警详情加载成功:', alertData);
      } else {
        throw new Error(result.message || '加载告警详情失败');
      }
    } catch (error) {
      console.error('加载告警详情失败:', error);
      
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'error'
      });
      
      this.setData({ isLoading: false });
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 标记告警为已读
   */
  async markAsRead() {
    try {
      await API.handleAlert(this.alertId, 'read');
      console.log('告警已标记为已读');
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  },

  /**
   * 处理告警 - 标记为已解决
   */
  async handleResolve() {
    try {
      // 显示确认对话框
      const result = await this.showConfirmDialog('确认解决', '确定要将此告警标记为已解决吗？');
      if (!result) return;
      
      this.setData({ isHandling: true });
      
      // 调用API处理告警
      const apiResult = await API.handleAlert(this.alertId, 'resolve');
      
      if (apiResult.success) {
        wx.showToast({
          title: '告警已解决',
          icon: 'success'
        });
        
        // 更新页面状态
        this.setData({
          'alert.status': 'resolved',
          'alert.statusText': '已解决',
          isHandling: false
        });
        
        // 重新加载详情以获取最新的处理历史
        setTimeout(() => {
          this.loadAlertDetail();
        }, 1000);
      } else {
        throw new Error(apiResult.message || '处理失败');
      }
    } catch (error) {
      console.error('处理告警失败:', error);
      
      wx.showToast({
        title: error.message || '处理失败',
        icon: 'error'
      });
      
      this.setData({ isHandling: false });
    }
  },

  /**
   * 忽略告警
   */
  async handleIgnore() {
    try {
      // 显示确认对话框
      const result = await this.showConfirmDialog('确认忽略', '确定要忽略此告警吗？忽略后将不再提醒。');
      if (!result) return;
      
      this.setData({ isHandling: true });
      
      // 调用API处理告警
      const apiResult = await API.handleAlert(this.alertId, 'ignore');
      
      if (apiResult.success) {
        wx.showToast({
          title: '告警已忽略',
          icon: 'success'
        });
        
        // 更新页面状态
        this.setData({
          'alert.status': 'ignored',
          'alert.statusText': '已忽略',
          isHandling: false
        });
        
        // 重新加载详情以获取最新的处理历史
        setTimeout(() => {
          this.loadAlertDetail();
        }, 1000);
      } else {
        throw new Error(apiResult.message || '处理失败');
      }
    } catch (error) {
      console.error('忽略告警失败:', error);
      
      wx.showToast({
        title: error.message || '处理失败',
        icon: 'error'
      });
      
      this.setData({ isHandling: false });
    }
  },

  /**
   * 跳转到设备详情页
   */
  goToDeviceDetail() {
    if (!this.data.device) {
      wx.showToast({
        title: '设备信息不存在',
        icon: 'error'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/device-detail/device-detail?id=${this.data.device.id}`
    });
  },

  /**
   * 分享告警信息
   */
  shareAlert() {
    if (!this.data.alert) return;
    
    const alert = this.data.alert;
    const shareContent = `【${alert.levelInfo.text}告警】${alert.title}\n设备：${alert.deviceName}\n位置：${alert.location}\n时间：${alert.createTimeFormatted}`;
    
    // 复制到剪贴板
    wx.setClipboardData({
      data: shareContent,
      success: () => {
        wx.showToast({
          title: '告警信息已复制',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 刷新页面数据
   */
  onPullDownRefresh() {
    this.loadAlertDetail().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 显示确认对话框
   * @param {string} title 标题
   * @param {string} content 内容
   * @returns {Promise<boolean>} 用户选择结果
   */
  showConfirmDialog(title, content) {
    return new Promise((resolve) => {
      wx.showModal({
        title,
        content,
        confirmText: '确定',
        cancelText: '取消',
        success: (res) => {
          resolve(res.confirm);
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    if (!this.data.alert) {
      return {
        title: '智慧能源管理',
        path: '/pages/index/index'
      };
    }
    
    const alert = this.data.alert;
    return {
      title: `【${alert.levelInfo.text}告警】${alert.title}`,
      path: `/pages/alert-detail/alert-detail?id=${this.alertId}`,
      imageUrl: '/images/share-alert.png' // 可以添加分享图片
    };
  }
});