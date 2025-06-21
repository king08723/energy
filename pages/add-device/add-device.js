// pages/add-device/add-device.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 步骤控制
    currentStep: 1, // 1-选择添加方式，2-设备信息，3-完成添加
    
    // 添加方式
    addMethod: '', // scan-扫码添加, manual-手动添加, search-自动搜索
    
    // 设备表单
    deviceForm: {
      type: '', // power-电表, water-水表, gas-燃气表, carbon-碳排放
      name: '',
      location: '',
      deviceId: '',
      secret: ''
    },
    
    // 表单错误信息
    formErrors: {
      deviceId: '',
      secret: ''
    },
    
    // 密钥显示控制
    showSecret: false,
    
    // 位置选择
    locationOptions: ['客厅', '卧室', '厨房', '卫生间', '阳台', '办公室', '会议室', '车间', '仓库', '其他'],
    selectedLocation: 0,
    
    // 最近使用的位置
    recentLocations: ['办公室', '会议室', '车间'],
    
    // 设备名称推荐
    nameSuggestions: {
      power: ['主电表', '分电表', '照明电表', '空调电表', '设备电表'],
      water: ['主水表', '分水表', '生活用水', '工业用水', '绿化用水'],
      gas: ['主燃气表', '分燃气表', '厨房燃气', '取暖燃气'],
      carbon: ['碳排放监测器', '碳足迹监测', '环保监测器']
    },
    
    // 自动搜索
    isSearching: false,
    searchCompleted: false,
    foundDevices: [],
    
    // 连接测试
    connectionTest: {
      status: '', // success, error
      message: ''
    },
    
    // 成功动画
    showSuccessAnimation: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 如果有传入的设备类型，自动选择
    if (options.type) {
      this.selectDeviceType({ currentTarget: { dataset: { type: options.type } } });
    }
  },

  /**
   * 步骤控制
   */
  nextStep: function() {
    const { currentStep, addMethod, deviceForm } = this.data;
    
    // 第一步到第二步：验证是否选择了添加方式
    if (currentStep === 1) {
      if (!addMethod) {
        wx.showToast({
          title: '请选择添加方式',
          icon: 'none'
        });
        return;
      }
      
      this.setData({
        currentStep: currentStep + 1
      });
      return;
    }
    
    // 第二步到第三步：验证表单
    if (currentStep === 2) {
      if (!this.validateForm()) {
        return;
      }
      
      this.setData({
        currentStep: currentStep + 1
      });
      
      // 自动进行连接测试
      setTimeout(() => {
        this.testConnection();
      }, 500);
      return;
    }
  },
  
  prevStep: function() {
    const { currentStep } = this.data;
    if (currentStep > 1) {
      this.setData({
        currentStep: currentStep - 1
      });
    }
  },

  /**
   * 添加方式选择
   */
  selectAddMethod: function(e) {
    const method = e.currentTarget.dataset.method;
    
    this.setData({
      addMethod: method
    });
    
    // 如果选择自动搜索，自动进入下一步并开始搜索
    if (method === 'search') {
      this.setData({
        currentStep: 2
      }, () => {
        setTimeout(() => {
          this.startSearch();
        }, 300);
      });
    }
  },

  /**
   * 扫码添加
   */
  startScan: function() {
    wx.scanCode({
      success: (res) => {
        this.parseQRCode(res.result);
      },
      fail: (err) => {
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        });
      }
    });
  },
  
  parseQRCode: function(qrData) {
    try {
      // 模拟解析二维码数据
      // 实际应用中应该根据二维码的格式进行解析
      const deviceInfo = JSON.parse(qrData);
      
      // 填充表单
      this.setData({
        'deviceForm.type': deviceInfo.type || 'power',
        'deviceForm.name': deviceInfo.name || '',
        'deviceForm.deviceId': deviceInfo.id || '',
        'deviceForm.secret': deviceInfo.secret || ''
      });
      
      // 自动进入下一步
      this.nextStep();
      
      wx.showToast({
        title: '扫码成功',
        icon: 'success'
      });
    } catch (e) {
      wx.showToast({
        title: '无效的设备二维码',
        icon: 'none'
      });
    }
  },

  /**
   * 手动添加 - 设备类型选择
   */
  selectDeviceType: function(e) {
    const type = e.currentTarget.dataset.type;
    
    this.setData({
      'deviceForm.type': type
    });
    
    // 如果没有设置名称，生成推荐名称
    if (!this.data.deviceForm.name) {
      this.generateDeviceName(type);
    }
  },
  
  /**
   * 生成设备名称建议
   */
  generateDeviceName: function(type) {
    if (!type) return;
    
    // 根据设备类型生成推荐名称
    const suggestions = this.data.nameSuggestions[type];
    if (suggestions && suggestions.length > 0) {
      // 这里可以根据业务逻辑选择最合适的名称
      // 简单示例：选择第一个建议
      this.setData({
        'deviceForm.name': suggestions[0]
      });
    }
  },
  
  /**
   * 使用名称建议
   */
  useNameSuggestion: function(e) {
    const name = e.currentTarget.dataset.name;
    
    this.setData({
      'deviceForm.name': name
    });
  },
  
  /**
   * 设备名称输入
   */
  inputDeviceName: function(e) {
    this.setData({
      'deviceForm.name': e.detail.value
    });
  },
  
  /**
   * 位置选择
   */
  selectLocation: function(e) {
    const index = e.detail.value;
    const location = this.data.locationOptions[index];
    
    this.setData({
      selectedLocation: index,
      'deviceForm.location': location
    });
  },
  
  /**
   * 选择最近使用的位置
   */
  selectRecentLocation: function(e) {
    const location = e.currentTarget.dataset.location;
    
    this.setData({
      'deviceForm.location': location
    });
  },
  
  /**
   * 设备ID输入
   */
  inputDeviceId: function(e) {
    const deviceId = e.detail.value;
    
    this.setData({
      'deviceForm.deviceId': deviceId,
      'formErrors.deviceId': ''
    });
    
    // 验证设备ID格式
    if (deviceId && !/^[A-Za-z0-9]{8,}$/.test(deviceId)) {
      this.setData({
        'formErrors.deviceId': '设备ID格式不正确，应为8位以上字母数字组合'
      });
    }
  },
  
  /**
   * 设备密钥输入
   */
  inputSecret: function(e) {
    const secret = e.detail.value;
    
    this.setData({
      'deviceForm.secret': secret,
      'formErrors.secret': ''
    });
    
    // 验证密钥格式
    if (secret && secret.length < 6) {
      this.setData({
        'formErrors.secret': '密钥长度不能少于6位'
      });
    }
  },
  
  /**
   * 切换密钥可见性
   */
  toggleSecretVisibility: function() {
    this.setData({
      showSecret: !this.data.showSecret
    });
  },

  /**
   * 自动搜索
   */
  startSearch: function() {
    // 重置搜索状态
    this.setData({
      isSearching: true,
      searchCompleted: false,
      foundDevices: []
    });
    
    // 模拟搜索过程
    setTimeout(() => {
      // 模拟搜索结果
      const mockDevices = [
        {
          id: 'PWR12345678',
          name: '主电表',
          type: 'power',
          signal: 95,
          model: 'Smart Meter v2'
        },
        {
          id: 'WTR87654321',
          name: '生活用水表',
          type: 'water',
          signal: 87,
          model: 'Water Meter Pro'
        },
        {
          id: 'GAS98765432',
          name: '厨房燃气表',
          type: 'gas',
          signal: 76,
          model: 'Gas Monitor X1'
        }
      ];
      
      this.setData({
        isSearching: false,
        searchCompleted: true,
        foundDevices: mockDevices
      });
    }, 3000); // 模拟3秒搜索时间
  },
  
  /**
   * 选择搜索到的设备
   */
  selectSearchDevice: function(e) {
    const index = e.currentTarget.dataset.index;
    const device = this.data.foundDevices[index];
    
    // 填充设备表单
    this.setData({
      'deviceForm.type': device.type,
      'deviceForm.name': device.name,
      'deviceForm.deviceId': device.id,
      // 密钥需要用户手动输入或通过其他方式获取
      'deviceForm.secret': ''
    });
    
    // 自动进入下一步
    this.nextStep();
  },

  /**
   * 连接测试
   */
  testConnection: function() {
    // 重置测试状态
    this.setData({
      'connectionTest.status': '',
      'connectionTest.message': ''
    });
    
    // 显示加载中
    wx.showLoading({
      title: '正在测试连接',
      mask: true
    });
    
    // 模拟连接测试过程
    setTimeout(() => {
      wx.hideLoading();
      
      // 模拟测试结果 - 成功率80%
      const isSuccess = Math.random() < 0.8;
      
      this.setData({
        'connectionTest.status': isSuccess ? 'success' : 'error',
        'connectionTest.message': isSuccess ? '设备连接成功，信号良好' : '设备连接失败，请检查设备ID和密钥'
      });
    }, 2000); // 模拟2秒测试时间
  },

  /**
   * 表单验证
   */
  validateForm: function() {
    const { addMethod, deviceForm, formErrors } = this.data;
    let isValid = true;
    
    // 重置错误信息
    this.setData({
      'formErrors.deviceId': '',
      'formErrors.secret': ''
    });
    
    // 扫码添加验证
    if (addMethod === 'scan') {
      if (!deviceForm.deviceId) {
        this.setData({
          'formErrors.deviceId': '设备ID不能为空'
        });
        isValid = false;
      }
    }
    
    // 手动添加验证
    if (addMethod === 'manual') {
      if (!deviceForm.type) {
        wx.showToast({
          title: '请选择设备类型',
          icon: 'none'
        });
        isValid = false;
      }
      
      if (!deviceForm.name) {
        wx.showToast({
          title: '请输入设备名称',
          icon: 'none'
        });
        isValid = false;
      }
      
      if (!deviceForm.deviceId) {
        this.setData({
          'formErrors.deviceId': '设备ID不能为空'
        });
        isValid = false;
      } else if (!/^[A-Za-z0-9]{8,}$/.test(deviceForm.deviceId)) {
        this.setData({
          'formErrors.deviceId': '设备ID格式不正确，应为8位以上字母数字组合'
        });
        isValid = false;
      }
      
      if (!deviceForm.secret) {
        this.setData({
          'formErrors.secret': '设备密钥不能为空'
        });
        isValid = false;
      } else if (deviceForm.secret.length < 6) {
        this.setData({
          'formErrors.secret': '密钥长度不能少于6位'
        });
        isValid = false;
      }
    }
    
    // 自动搜索验证
    if (addMethod === 'search') {
      if (!deviceForm.deviceId) {
        wx.showToast({
          title: '请选择一个搜索到的设备',
          icon: 'none'
        });
        isValid = false;
      }
    }
    
    return isValid;
  },

  /**
   * 提交设备
   */
  submitDevice: function() {
    // 显示加载中
    wx.showLoading({
      title: '正在添加设备',
      mask: true
    });
    
    // 模拟API调用
    setTimeout(() => {
      wx.hideLoading();
      
      // 显示成功动画
      this.setData({
        showSuccessAnimation: true
      });
      
      // 3秒后返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 3000);
    }, 1500);
  },

  /**
   * 取消添加
   */
  cancelAdd: function() {
    wx.navigateBack();
  },

  /**
   * 步骤指示器事件处理
   */
  onStepChange: function(e) {
    const step = e.detail.step;
    
    // 只允许跳转到已完成的步骤或当前步骤的下一步
    if (step <= this.data.currentStep || step === this.data.currentStep + 1) {
      // 如果是从第一步到第二步，需要验证是否选择了添加方式
      if (this.data.currentStep === 1 && step === 2) {
        if (!this.data.addMethod) {
          wx.showToast({
            title: '请选择添加方式',
            icon: 'none'
          });
          return;
        }
      }
      
      // 如果是从第二步到第三步，需要验证表单
      if (this.data.currentStep === 2 && step === 3) {
        if (!this.validateForm()) {
          return;
        }
        
        // 自动进行连接测试
        setTimeout(() => {
          this.testConnection();
        }, 500);
      }
      
      this.setData({
        currentStep: step
      });
    }
  },
});