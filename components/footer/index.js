Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    currentYear: new Date().getFullYear()
  },

  /**
   * 组件的方法列表
   */
  methods: {

  },

  /**
   * 组件生命周期函数-在组件实例进入页面节点树时执行
   */
  attached() {
    // 确保年份是最新的
    this.setData({
      currentYear: new Date().getFullYear()
    });
  }
})