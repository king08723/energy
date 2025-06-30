// components/overview-card/index.js
Component({
  properties: {
    icon: {
      type: String,
      value: ''
    },
    title: {
      type: String,
      value: ''
    },
    value: {
      type: String,
      value: '0'
    },
    unit: {
      type: String,
      value: ''
    },
    trend: {
      type: String,
      value: '0'
    },
    type: {
      type: String,
      value: 'default'
    }
  },
  data: {
    // 内部数据，确保类型安全
    safeValue: '0',
    safeTrend: '0'
  },
  methods: {
    /**
     * 安全转换值为字符串
     * @param {any} val 输入值
     * @param {string} defaultVal 默认值
     * @returns {string} 安全的字符串值
     */
    safeStringValue(val, defaultVal = '0') {
      if (val === null || val === undefined) {
        return defaultVal;
      }
      if (typeof val === 'string') {
        return val;
      }
      if (typeof val === 'number') {
        return val.toString();
      }
      if (typeof val === 'object' && val.value !== undefined) {
        return this.safeStringValue(val.value, defaultVal);
      }
      return String(val);
    }
  },

  // 数据观察器，确保传入的值是字符串类型
  observers: {
    'value, trend': function (value, trend) {
      // 安全转换value和trend为字符串类型
      const safeValue = this.safeStringValue(value, '0');
      const safeTrend = this.safeStringValue(trend, '0');

      // 只有当值真正改变时才更新
      if (this.data.safeValue !== safeValue || this.data.safeTrend !== safeTrend) {
        this.setData({
          safeValue: safeValue,
          safeTrend: safeTrend
        });
      }
    }
  },

  // 组件生命周期
  lifetimes: {
    attached() {
      // 组件初始化时确保数据类型正确
      const safeValue = this.safeStringValue(this.data.value, '0');
      const safeTrend = this.safeStringValue(this.data.trend, '0');

      this.setData({
        safeValue: safeValue,
        safeTrend: safeTrend
      });
    }
  }
});