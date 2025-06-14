// pages/device-detail/device-detail.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    deviceId: '',
    timeFilter: '24h',
    deviceInfo: {
      id: '1',
      name: '客厅空调',
      type: 'power',
      icon: '❄️',
      location: '客厅',
      status: 'online',
      statusText: '运行正常',
      lastUpdate: '2分钟前',
      isOn: true,
      supportPowerControl: true,
      powerLevel: 75,
      alerts: [],
      realTimeData: [
        { key: 'power', label: '当前功率', value: '2.5', unit: 'kW' },
        { key: 'temperature', label: '室内温度', value: '24', unit: '°C' },
        { key: 'humidity', label: '湿度', value: '65', unit: '%' },
        { key: 'energy', label: '今日能耗', value: '12.8', unit: 'kWh' }
      ],
      automationRules: [
        {
          id: '1',
          name: '智能节能模式',
          description: '无人时自动调节温度',
          enabled: true
        },
        {
          id: '2',
          name: '定时开关',
          description: '每天22:00自动关闭',
          enabled: false
        }
      ],
      specifications: [
        { key: 'model', label: '设备型号', value: 'AC-2024-Pro' },
        { key: 'brand', label: '品牌', value: '格力' },
        { key: 'power', label: '额定功率', value: '3.5kW' },
        { key: 'installDate', label: '安装日期', value: '2024-01-15' },
        { key: 'warranty', label: '保修期', value: '3年' }
      ]
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.deviceId) {
      this.setData({
        deviceId: options.deviceId
      });
      this.loadDeviceInfo(options.deviceId);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 刷新设备状态
    this.refreshDeviceStatus();
  },

  /**
   * 加载设备信息
   */
  loadDeviceInfo(deviceId) {
    // 模拟加载设备信息
    wx.showLoading({ title: '加载中...' });
    
    setTimeout(() => {
      // 根据设备ID设置不同的设备信息
      const deviceTypes = {
        '1': { type: 'power', icon: '❄️', name: '客厅空调' },
        '2': { type: 'water', icon: '🚿', name: '热水器' },
        '3': { type: 'gas', icon: '🔥', name: '燃气灶' },
        '4': { type: 'carbon', icon: '🌱', name: '空气净化器' },
        'device_001': { type: 'meter', icon: '⚡', name: '生产线电表A1' },
        'device_002': { type: 'sensor', icon: '🌡️', name: '温湿度传感器B2' },
        'device_003': { type: 'switch', icon: '🔌', name: '智能开关C3' },
        'device_004': { type: 'hvac', icon: '❄️', name: '中央空调控制器' },
        'device_005': { type: 'sensor', icon: '💧', name: '水表监测器' },
        'device_006': { type: 'meter', icon: '⚡', name: '电量计量表D1' },
        'device_007': { type: 'switch', icon: '🔒', name: '智能门锁E2' },
        'device_008': { type: 'sensor', icon: '🌿', name: '环境监测站F3' }
      };
      
      // 修复：使用传入的deviceId获取对应的设备类型，如果不存在则使用默认值
      const deviceType = deviceTypes[deviceId] || { type: 'unknown', icon: '❓', name: '未知设备' };
      
      this.setData({
        'deviceInfo.id': deviceId,
        'deviceInfo.type': deviceType.type,
        'deviceInfo.icon': deviceType.icon,
        'deviceInfo.name': deviceType.name
      });
      
      wx.hideLoading();
    }, 1000);
  },

  /**
   * 刷新设备状态
   */
  refreshDeviceStatus() {
    // 模拟刷新设备状态
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    this.setData({
      'deviceInfo.lastUpdate': '刚刚'
    });
  },

  /**
   * 设备菜单
   */
  onDeviceMenu() {
    wx.showActionSheet({
      itemList: ['重命名设备', '移动位置', '删除设备'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.onRenameDevice();
            break;
          case 1:
            this.onMoveDevice();
            break;
          case 2:
            this.onDeleteDevice();
            break;
        }
      }
    });
  },

  /**
   * 开关控制
   */
  onSwitchChange(e) {
    const isOn = e.detail.value;
    
    wx.showLoading({ title: isOn ? '开启中...' : '关闭中...' });
    
    setTimeout(() => {
      this.setData({
        'deviceInfo.isOn': isOn
      });
      
      wx.hideLoading();
      wx.showToast({
        title: isOn ? '设备已开启' : '设备已关闭',
        icon: 'success'
      });
    }, 1000);
  },

  /**
   * 功率调节
   */
  onPowerChange(e) {
    const powerLevel = e.detail.value;
    
    this.setData({
      'deviceInfo.powerLevel': powerLevel
    });
    
    // 模拟功率调节
    wx.showToast({
      title: `功率已调至${powerLevel}%`,
      icon: 'none'
    });
  },

  /**
   * 快捷控制
   */
  onQuickControl(e) {
    const action = e.currentTarget.dataset.action;
    
    const actionMap = {
      restart: '重启设备',
      reset: '重置设备',
      optimize: '优化设备'
    };
    
    wx.showModal({
      title: '确认操作',
      content: `确定要${actionMap[action]}吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '执行中...' });
          
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: `${actionMap[action]}成功`,
              icon: 'success'
            });
          }, 2000);
        }
      }
    });
  },

  /**
   * 刷新数据
   */
  onRefreshData() {
    wx.showLoading({ title: '刷新中...' });
    
    setTimeout(() => {
      // 模拟更新实时数据
      const realTimeData = this.data.deviceInfo.realTimeData.map(item => ({
        ...item,
        value: (parseFloat(item.value) + (Math.random() - 0.5) * 2).toFixed(1)
      }));
      
      this.setData({
        'deviceInfo.realTimeData': realTimeData,
        'deviceInfo.lastUpdate': '刚刚'
      });
      
      wx.hideLoading();
      wx.showToast({
        title: '数据已更新',
        icon: 'success'
      });
    }, 1000);
  },

  /**
   * 时间筛选切换
   */
  onTimeFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    
    this.setData({
      timeFilter: filter
    });
    
    wx.showToast({
      title: `切换到${filter}视图`,
      icon: 'none'
    });
  },

  /**
   * 查看告警
   */
  onViewAlerts() {
    wx.navigateTo({
      url: `/pages/device-alerts/device-alerts?deviceId=${this.data.deviceId}`
    });
  },

  /**
   * 添加自动化规则
   */
  onAddRule() {
    wx.navigateTo({
      url: `/pages/automation-rule/automation-rule?deviceId=${this.data.deviceId}`
    });
  },

  /**
   * 规则开关切换
   */
  onRuleToggle(e) {
    const ruleId = e.currentTarget.dataset.rule;
    const enabled = e.detail.value;
    
    const rules = this.data.deviceInfo.automationRules.map(rule => {
      if (rule.id === ruleId) {
        return { ...rule, enabled };
      }
      return rule;
    });
    
    this.setData({
      'deviceInfo.automationRules': rules
    });
    
    wx.showToast({
      title: enabled ? '规则已启用' : '规则已禁用',
      icon: 'success'
    });
  },

  /**
   * 编辑设备
   */
  onEditDevice() {
    wx.navigateTo({
      url: `/pages/edit-device/edit-device?deviceId=${this.data.deviceId}`
    });
  },

  /**
   * 设备设置
   */
  onDeviceSettings() {
    wx.navigateTo({
      url: `/pages/device-settings/device-settings?deviceId=${this.data.deviceId}`
    });
  },

  /**
   * 重命名设备
   */
  onRenameDevice() {
    wx.showModal({
      title: '重命名设备',
      editable: true,
      placeholderText: this.data.deviceInfo.name,
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({
            'deviceInfo.name': res.content
          });
          
          wx.showToast({
            title: '重命名成功',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 移动设备
   */
  onMoveDevice() {
    wx.showActionSheet({
      itemList: ['客厅', '卧室', '厨房', '卫生间', '阳台'],
      success: (res) => {
        const locations = ['客厅', '卧室', '厨房', '卫生间', '阳台'];
        const newLocation = locations[res.tapIndex];
        
        this.setData({
          'deviceInfo.location': newLocation
        });
        
        wx.showToast({
          title: `已移动到${newLocation}`,
          icon: 'success'
        });
      }
    });
  },

  /**
   * 删除设备
   */
  onDeleteDevice() {
    wx.showModal({
      title: '删除设备',
      content: '确定要删除这个设备吗？删除后无法恢复。',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({
              title: '设备已删除',
              icon: 'success'
            });
            
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          }, 1000);
        }
      }
    });
  },

  /**
   * 页面相关事件处理函数--监听用户下拉刷新
   */
  onPullDownRefresh() {
    this.refreshDeviceStatus();
    this.onRefreshData();
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: `查看我的${this.data.deviceInfo.name}`,
      path: `/pages/device-detail/device-detail?deviceId=${this.data.deviceId}`
    };
  }
})