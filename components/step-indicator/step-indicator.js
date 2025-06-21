// components/step-indicator/step-indicator.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    steps: {
      type: Array,
      value: []
    },
    currentStep: {
      type: Number,
      value: 1
    },
    activeColor: {
      type: String,
      value: '#1aad19'
    },
    inactiveColor: {
      type: String,
      value: '#cccccc'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    stepsArray: []
  },

  /**
   * 数据监听器
   */
  observers: {
    'steps, currentStep': function(steps, currentStep) {
      this.updateStepsStatus(steps, currentStep);
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 更新步骤状态
     */
    updateStepsStatus: function(steps, currentStep) {
      if (!steps || steps.length === 0) return;
      
      const stepsArray = steps.map((step, index) => {
        const stepNumber = index + 1;
        return {
          title: step,
          number: stepNumber,
          status: stepNumber < currentStep ? 'completed' : 
                 stepNumber === currentStep ? 'current' : 'waiting'
        };
      });
      
      this.setData({
        stepsArray: stepsArray
      });
    },
    
    /**
     * 点击步骤
     */
    onStepTap: function(e) {
      const index = e.currentTarget.dataset.index;
      const stepNumber = index + 1;
      
      // 只允许点击已完成的步骤或当前步骤的下一步
      if (stepNumber <= this.data.currentStep || stepNumber === this.data.currentStep + 1) {
        this.triggerEvent('stepchange', { step: stepNumber });
      }
    }
  }
});