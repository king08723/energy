// pages/group-management/group-management.js
// 设备分组管理页面 - 创建、编辑和管理设备分组

const API = require('../../utils/api.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    groupList: [], // 分组列表
    loading: false, // 加载状态
    showAddDialog: false, // 显示添加分组对话框
    showEditDialog: false, // 显示编辑分组对话框
    currentGroup: {}, // 当前编辑的分组
    formData: {
      name: '',
      description: '',
      icon: 'default'
    },
    iconOptions: [
      { value: 'default', label: '默认', icon: '📁' },
      { value: 'office', label: '办公区', icon: '🏢' },
      { value: 'factory', label: '生产区', icon: '🏭' },
      { value: 'home', label: '生活区', icon: '🏠' },
      { value: 'outdoor', label: '室外', icon: '🌳' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadGroupList();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 页面显示时刷新数据
    this.loadGroupList();
  },

  /**
   * 加载设备分组列表
   */
  async loadGroupList() {
    this.setData({ loading: true });
    
    try {
      const result = await API.getDeviceGroups();
      
      if (result.success) {
        this.setData({
          groupList: result.data
        });
      } else {
        wx.showToast({
          title: result.message || '加载失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('设备分组列表加载失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 显示添加分组对话框
   */
  onShowAddDialog() {
    this.setData({
      showAddDialog: true,
      formData: {
        name: '',
        description: '',
        icon: 'default'
      }
    });
  },

  /**
   * 隐藏添加分组对话框
   */
  onHideAddDialog() {
    this.setData({ showAddDialog: false });
  },

  /**
   * 显示编辑分组对话框
   */
  onShowEditDialog(e) {
    const { group } = e.currentTarget.dataset;
    this.setData({
      showEditDialog: true,
      currentGroup: group,
      formData: {
        name: group.name,
        description: group.description || '',
        icon: group.icon || 'default'
      }
    });
  },

  /**
   * 隐藏编辑分组对话框
   */
  onHideEditDialog() {
    this.setData({ 
      showEditDialog: false,
      currentGroup: {}
    });
  },

  /**
   * 表单输入处理
   */
  onFormInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`formData.${field}`]: value
    });
  },

  /**
   * 图标选择
   */
  onIconSelect(e) {
    const { icon } = e.currentTarget.dataset;
    this.setData({
      'formData.icon': icon
    });
  },

  /**
   * 创建设备分组
   */
  async onCreateGroup() {
    const { formData } = this.data;
    
    // 表单验证
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入分组名称',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({ title: '创建中...' });
      
      const result = await API.createDeviceGroup({
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon
      });
      
      if (result.success) {
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });
        
        this.onHideAddDialog();
        this.loadGroupList(); // 刷新列表
      } else {
        wx.showToast({
          title: result.message || '创建失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('创建设备分组失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 更新设备分组
   */
  async onUpdateGroup() {
    const { formData, currentGroup } = this.data;
    
    // 表单验证
    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入分组名称',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({ title: '更新中...' });
      
      const result = await API.updateDeviceGroup(currentGroup.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon
      });
      
      if (result.success) {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
        
        this.onHideEditDialog();
        this.loadGroupList(); // 刷新列表
      } else {
        wx.showToast({
          title: result.message || '更新失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('更新设备分组失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 删除设备分组
   */
  onDeleteGroup(e) {
    const { group } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除分组"${group.name}"吗？删除后该分组下的设备将移至默认分组。`,
      confirmText: '删除',
      confirmColor: '#ff4757',
      success: (res) => {
        if (res.confirm) {
          this.deleteGroup(group.id);
        }
      }
    });
  },

  /**
   * 执行删除分组
   */
  async deleteGroup(groupId) {
    try {
      wx.showLoading({ title: '删除中...' });
      
      const result = await API.deleteDeviceGroup(groupId);
      
      if (result.success) {
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
        
        this.loadGroupList(); // 刷新列表
      } else {
        wx.showToast({
          title: result.message || '删除失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('删除设备分组失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 管理分组设备
   */
  onManageDevices(e) {
    const { group } = e.currentTarget.dataset;
    
    // 跳转到设备分组分配页面（如果需要单独页面）
    // 或者在当前页面显示设备管理界面
    wx.navigateTo({
      url: `/pages/devices/devices?groupId=${group.id}&groupName=${group.name}`
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadGroupList().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});