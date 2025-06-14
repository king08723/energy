// pages/add-device/add-device.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 添加方式
    addMethod: 'scan', // scan, manual, search
    
    // 设备表单数据
    deviceForm: {
      type: '',
      name: '',
      location: '',
      locationIndex: -1,
      deviceId: '',
      secret: ''
    },
    
    // 位置选项
    locations: ['客厅', '卧室', '厨房', '卫生间', '阳台', '书房', '餐厅', '玄关'],
    
    // 密钥显示状态
    showSecret: false,
    
    // 搜索状态
    isSearching: false,
    foundDevices: [],
    
    // 提交状态
    canSubmit: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.checkCanSubmit();
  },

  /**
   * 选择添加方式
   */
  onMethodSelect(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({
      addMethod: method
    });
    this.checkCanSubmit();
  },

  /**
   * 开始扫码
   */
  onStartScan() {
    wx.scanCode({
      success: (res) => {
        console.log('扫码结果:', res);
        // 解析二维码内容
        this.parseQRCode(res.result);
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 解析二维码
   */
  parseQRCode(qrData) {
    try {
      // 假设二维码格式为 JSON
      const deviceInfo = JSON.parse(qrData);
      
      this.setData({
        'deviceForm.type': deviceInfo.type || 'power',
        'deviceForm.name': deviceInfo.name || '',
        'deviceForm.deviceId': deviceInfo.deviceId || '',
        'deviceForm.secret': deviceInfo.secret || ''
      });
      
      this.checkCanSubmit();
      
      wx.showToast({
        title: '设备信息已获取',
        icon: 'success'
      });
    } catch (error) {
      // 如果不是 JSON 格式，直接作为设备ID
      this.setData({
        'deviceForm.deviceId': qrData
      });
      this.checkCanSubmit();
    }
  },

  /**
   * 选择设备类型
   */
  onTypeSelect(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'deviceForm.type': type
    });
    this.checkCanSubmit();
  },

  /**
   * 输入设备名称
   */
  onNameInput(e) {
    this.setData({
      'deviceForm.name': e.detail.value
    });
    this.checkCanSubmit();
  },

  /**
   * 选择设备位置
   */
  onLocationChange(e) {
    const index = e.detail.value;
    this.setData({
      'deviceForm.locationIndex': index,
      'deviceForm.location': this.data.locations[index]
    });
    this.checkCanSubmit();
  },

  /**
   * 输入设备ID
   */
  onDeviceIdInput(e) {
    this.setData({
      'deviceForm.deviceId': e.detail.value
    });
    this.checkCanSubmit();
  },

  /**
   * 输入设备密钥
   */
  onSecretInput(e) {
    this.setData({
      'deviceForm.secret': e.detail.value
    });
    this.checkCanSubmit();
  },

  /**
   * 切换密钥显示
   */
  onToggleSecret() {
    this.setData({
      showSecret: !this.data.showSecret
    });
  },

  /**
   * 开始搜索设备
   */
  onStartSearch() {
    this.setData({
      isSearching: true,
      foundDevices: []
    });

    // 模拟搜索过程
    setTimeout(() => {
      const mockDevices = [
        {
          id: 'device_001',
          name: '智能电表 #001',
          type: 'power',
          icon: '⚡',
          model: 'EM-2000',
          signal: '强'
        },
        {
          id: 'device_002',
          name: '智能水表 #002',
          type: 'water',
          icon: '💧',
          model: 'WM-1500',
          signal: '中'
        },
        {
          id: 'device_003',
          name: '燃气监测器 #003',
          type: 'gas',
          icon: '🔥',
          model: 'GM-800',
          signal: '强'
        }
      ];

      this.setData({
        isSearching: false,
        foundDevices: mockDevices
      });
    }, 3000);
  },

  /**
   * 选择搜索到的设备
   */
  onSelectFoundDevice(e) {
    const device = e.currentTarget.dataset.device;
    
    this.setData({
      'deviceForm.type': device.type,
      'deviceForm.name': device.name,
      'deviceForm.deviceId': device.id,
      addMethod: 'manual' // 切换到手动模式进行编辑
    });
    
    this.checkCanSubmit();
    
    wx.showToast({
      title: '设备已选择',
      icon: 'success'
    });
  },

  /**
   * 检查是否可以提交
   */
  checkCanSubmit() {
    const { addMethod, deviceForm } = this.data;
    let canSubmit = false;

    if (addMethod === 'scan') {
      canSubmit = !!deviceForm.deviceId;
    } else if (addMethod === 'manual') {
      canSubmit = !!(deviceForm.type && deviceForm.name && deviceForm.deviceId);
    } else if (addMethod === 'search') {
      canSubmit = !!deviceForm.deviceId;
    }

    this.setData({ canSubmit });
  },

  /**
   * 取消添加
   */
  onCancel() {
    wx.navigateBack();
  },

  /**
   * 提交添加设备
   */
  onSubmit() {
    if (!this.data.canSubmit) {
      return;
    }

    const { deviceForm } = this.data;
    
    // 显示加载
    wx.showLoading({
      title: '正在添加设备...'
    });

    // 模拟添加设备API调用
    setTimeout(() => {
      wx.hideLoading();
      
      // 模拟成功
      wx.showToast({
        title: '设备添加成功',
        icon: 'success',
        duration: 2000
      });

      // 返回设备列表页面
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }, 2000);
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉刷新
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})