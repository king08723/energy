// utils/intelligent-optimization.js
// 智能优化和告警分析模块

class IntelligentOptimization {
  constructor() {
    this.alertAnalysisRules = this.initAlertAnalysisRules();
    this.efficiencyBenchmarks = this.initEfficiencyBenchmarks();
    this.optimizationStrategies = this.initOptimizationStrategies();
  }

  /**
   * 初始化告警分析规则
   */
  initAlertAnalysisRules() {
    return {
      device_offline: {
        severity: 'critical',
        autoActions: ['notify_maintenance', 'switch_backup', 'escalate_manager'],
        analysisFactors: ['network_status', 'device_health', 'maintenance_history'],
        resolutionTime: 30 // 分钟
      },
      energy_abnormal: {
        severity: 'warning',
        autoActions: ['adjust_parameters', 'schedule_inspection'],
        analysisFactors: ['usage_pattern', 'weather_condition', 'device_efficiency'],
        resolutionTime: 120
      },
      temperature_high: {
        severity: 'warning',
        autoActions: ['adjust_hvac', 'increase_ventilation'],
        analysisFactors: ['ambient_temperature', 'occupancy', 'hvac_status'],
        resolutionTime: 15
      },
      maintenance_reminder: {
        severity: 'info',
        autoActions: ['create_work_order', 'notify_team'],
        analysisFactors: ['maintenance_schedule', 'device_uptime', 'performance_trend'],
        resolutionTime: 240
      }
    };
  }

  /**
   * 初始化能效基准数据
   */
  initEfficiencyBenchmarks() {
    return {
      lighting: {
        excellent: { min: 90, actions: ['maintain_current'] },
        good: { min: 80, max: 89, actions: ['minor_optimization'] },
        average: { min: 70, max: 79, actions: ['schedule_upgrade'] },
        poor: { max: 69, actions: ['immediate_replacement'] }
      },
      hvac: {
        excellent: { min: 85, actions: ['maintain_current'] },
        good: { min: 75, max: 84, actions: ['filter_cleaning'] },
        average: { min: 65, max: 74, actions: ['system_tuning'] },
        poor: { max: 64, actions: ['major_overhaul'] }
      },
      production: {
        excellent: { min: 88, actions: ['maintain_current'] },
        good: { min: 78, max: 87, actions: ['preventive_maintenance'] },
        average: { min: 68, max: 77, actions: ['equipment_upgrade'] },
        poor: { max: 67, actions: ['replacement_planning'] }
      }
    };
  }

  /**
   * 初始化优化策略
   */
  initOptimizationStrategies() {
    return {
      energy_saving: {
        lighting: [
          {
            strategy: 'smart_scheduling',
            description: '基于占用情况的智能调度',
            potential_savings: 15, // 百分比
            implementation_cost: 'low'
          },
          {
            strategy: 'led_upgrade',
            description: '升级为LED照明系统',
            potential_savings: 60,
            implementation_cost: 'medium'
          }
        ],
        hvac: [
          {
            strategy: 'temperature_optimization',
            description: '优化温度设定点',
            potential_savings: 10,
            implementation_cost: 'low'
          },
          {
            strategy: 'variable_speed_drives',
            description: '安装变频驱动器',
            potential_savings: 25,
            implementation_cost: 'high'
          }
        ],
        production: [
          {
            strategy: 'load_balancing',
            description: '负载均衡优化',
            potential_savings: 12,
            implementation_cost: 'low'
          },
          {
            strategy: 'equipment_modernization',
            description: '设备现代化改造',
            potential_savings: 35,
            implementation_cost: 'high'
          }
        ]
      }
    };
  }

  /**
   * 智能告警分析
   * @param {Object} alert - 告警对象
   * @returns {Object} 分析结果
   */
  analyzeAlert(alert) {
    const rule = this.alertAnalysisRules[alert.type];
    if (!rule) {
      return {
        confidence: 0.5,
        rootCause: 'unknown',
        suggestedActions: ['manual_investigation'],
        impactAssessment: { low: true }
      };
    }

    // 模拟智能分析过程
    const analysis = {
      rootCause: this.determineRootCause(alert, rule),
      confidence: this.calculateConfidence(alert, rule),
      suggestedActions: this.generateSuggestedActions(alert, rule),
      impactAssessment: this.assessImpact(alert),
      relatedDevices: this.findRelatedDevices(alert),
      historicalPattern: this.analyzeHistoricalPattern(alert)
    };

    return analysis;
  }

  /**
   * 确定根本原因
   */
  determineRootCause(alert, rule) {
    const causes = {
      device_offline: ['network_connectivity', 'power_failure', 'hardware_fault'],
      energy_abnormal: ['efficiency_degradation', 'usage_spike', 'equipment_malfunction'],
      temperature_high: ['hvac_failure', 'high_ambient_temperature', 'poor_insulation'],
      maintenance_reminder: ['scheduled_maintenance', 'performance_degradation']
    };

    const possibleCauses = causes[alert.type] || ['unknown'];
    return possibleCauses[Math.floor(Math.random() * possibleCauses.length)];
  }

  /**
   * 计算分析置信度
   */
  calculateConfidence(alert, rule) {
    // 基于告警类型、历史数据、设备状态等因素计算置信度
    let confidence = 0.7; // 基础置信度
    
    // 根据告警类型调整
    if (alert.type === 'device_offline') confidence += 0.2;
    if (alert.type === 'maintenance_reminder') confidence += 0.3;
    
    // 添加随机因素模拟实际分析的不确定性
    confidence += (Math.random() - 0.5) * 0.2;
    
    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  /**
   * 生成建议操作
   */
  generateSuggestedActions(alert, rule) {
    const actionTemplates = {
      device_offline: [
        '检查网络连接状态',
        '重启设备通信模块',
        '联系技术支持团队',
        '启用备用设备'
      ],
      energy_abnormal: [
        '检查设备运行参数',
        '分析使用模式变化',
        '安排设备检修',
        '优化运行策略'
      ],
      temperature_high: [
        '调整空调设定温度',
        '检查通风系统',
        '增加散热措施',
        '检查设备负载'
      ],
      maintenance_reminder: [
        '安排维护人员',
        '准备维护工具',
        '制定维护计划',
        '通知相关部门'
      ]
    };

    return actionTemplates[alert.type] || ['进行人工检查'];
  }

  /**
   * 评估影响
   */
  assessImpact(alert) {
    const baseImpact = {
      energyLoss: Math.random() * 50,
      costImpact: Math.random() * 100,
      carbonImpact: Math.random() * 25
    };

    // 根据告警级别调整影响程度
    const multiplier = {
      critical: 3,
      warning: 1.5,
      info: 0.5
    }[alert.level] || 1;

    return {
      energyLoss: baseImpact.energyLoss * multiplier,
      costImpact: baseImpact.costImpact * multiplier,
      carbonImpact: baseImpact.carbonImpact * multiplier
    };
  }

  /**
   * 查找相关设备
   */
  findRelatedDevices(alert) {
    // 模拟查找相关设备的逻辑
    const deviceRelations = {
      'device_001': ['device_002', 'device_003'],
      'device_002': ['device_001'],
      'device_003': ['device_001', 'device_004'],
      'device_004': ['device_003'],
      'device_005': ['device_004']
    };

    return deviceRelations[alert.deviceId] || [];
  }

  /**
   * 分析历史模式
   */
  analyzeHistoricalPattern(alert) {
    const frequencies = ['rare', 'occasional', 'frequent', 'scheduled'];
    const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
    
    return {
      frequency,
      lastOccurrence: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      averageResolutionTime: Math.floor(Math.random() * 240) + 15 // 15-255分钟
    };
  }

  /**
   * 生成自动化响应计划
   */
  generateAutomatedResponse(alert, analysis) {
    const responses = {
      device_offline: [
        { type: 'notification', target: 'maintenance_team', delay: 0 },
        { type: 'device_control', action: 'switch_to_backup', delay: 300 },
        { type: 'escalation', target: 'manager', delay: 1800 }
      ],
      energy_abnormal: [
        { type: 'parameter_adjustment', action: 'optimize_settings', delay: 0 },
        { type: 'maintenance_schedule', action: 'schedule_inspection', delay: 86400 }
      ],
      temperature_high: [
        { type: 'device_control', action: 'adjust_temperature', delay: 0 },
        { type: 'notification', target: 'facility_manager', delay: 600 }
      ],
      maintenance_reminder: [
        { type: 'work_order', action: 'create_maintenance_ticket', delay: 0 },
        { type: 'notification', target: 'maintenance_team', delay: 3600 }
      ]
    };

    return {
      enabled: analysis.confidence > 0.7,
      actions: responses[alert.type] || [],
      executedActions: []
    };
  }

  /**
   * 分组能效分析
   * @param {Object} group - 设备分组
   * @returns {Object} 能效分析结果
   */
  analyzeGroupEfficiency(group) {
    const categoryType = this.determineGroupCategory(group);
    const benchmark = this.efficiencyBenchmarks[categoryType];
    
    if (!benchmark) {
      return this.getDefaultEfficiencyAnalysis();
    }

    const currentScore = this.calculateGroupEfficiencyScore(group);
    const rating = this.getEfficiencyRating(currentScore, benchmark);
    const recommendations = this.generateEfficiencyRecommendations(group, rating);
    const potentialSavings = this.calculatePotentialSavings(group, currentScore);

    return {
      currentScore,
      trend: this.calculateTrend(),
      recommendations,
      potentialSavings,
      benchmarkComparison: {
        industryAverage: this.getIndustryAverage(categoryType),
        bestPractice: this.getBestPractice(categoryType),
        ranking: rating
      }
    };
  }

  /**
   * 确定分组类别
   */
  determineGroupCategory(group) {
    if (group.name.includes('照明') || group.name.includes('lighting')) return 'lighting';
    if (group.name.includes('空调') || group.name.includes('hvac')) return 'hvac';
    if (group.name.includes('生产') || group.name.includes('production')) return 'production';
    return 'lighting'; // 默认
  }

  /**
   * 计算分组效率分数
   */
  calculateGroupEfficiencyScore(group) {
    // 基于设备数量、在线率、功率等因素计算效率分数
    const onlineRate = group.onlineCount / group.deviceCount;
    const baseScore = 60 + (onlineRate * 30); // 60-90基础分
    const randomFactor = (Math.random() - 0.5) * 20; // ±10分随机因素
    
    return Math.min(Math.max(baseScore + randomFactor, 0), 100);
  }

  /**
   * 获取效率等级
   */
  getEfficiencyRating(score, benchmark) {
    if (score >= benchmark.excellent.min) return 'excellent';
    if (score >= benchmark.good.min) return 'above_average';
    if (score >= benchmark.average.min) return 'average';
    return 'below_average';
  }

  /**
   * 生成效率改进建议
   */
  generateEfficiencyRecommendations(group, rating) {
    const categoryType = this.determineGroupCategory(group);
    const strategies = this.optimizationStrategies.energy_saving[categoryType] || [];
    
    // 根据效率等级选择合适的策略
    const filteredStrategies = strategies.filter(strategy => {
      if (rating === 'excellent') return strategy.implementation_cost === 'low';
      if (rating === 'above_average') return strategy.implementation_cost !== 'high';
      return true; // 低效率组可以考虑所有策略
    });

    return filteredStrategies.map(strategy => strategy.description).slice(0, 3);
  }

  /**
   * 计算潜在节约
   */
  calculatePotentialSavings(group, currentScore) {
    const maxScore = 100;
    const improvementPotential = (maxScore - currentScore) / maxScore;
    
    return {
      energy: group.energyToday * improvementPotential * 0.3, // 30%的改进潜力
      cost: group.energyToday * improvementPotential * 0.3 * 0.7, // 0.7元/kWh
      carbonReduction: group.energyToday * improvementPotential * 0.3 * 0.5 // 0.5kg CO2/kWh
    };
  }

  /**
   * 获取行业平均水平
   */
  getIndustryAverage(categoryType) {
    const averages = {
      lighting: 82,
      hvac: 78,
      production: 80
    };
    return averages[categoryType] || 80;
  }

  /**
   * 获取最佳实践水平
   */
  getBestPractice(categoryType) {
    const bestPractices = {
      lighting: 92,
      hvac: 85,
      production: 88
    };
    return bestPractices[categoryType] || 90;
  }

  /**
   * 计算趋势
   */
  calculateTrend() {
    const trends = ['+3.2%', '+1.8%', '+0.5%', '-0.3%', '-1.2%', '-2.1%'];
    return trends[Math.floor(Math.random() * trends.length)];
  }

  /**
   * 获取默认效率分析
   */
  getDefaultEfficiencyAnalysis() {
    return {
      currentScore: 75,
      trend: '+1.0%',
      recommendations: ['定期维护设备', '优化运行参数', '考虑设备升级'],
      potentialSavings: {
        energy: 10,
        cost: 7,
        carbonReduction: 5
      },
      benchmarkComparison: {
        industryAverage: 80,
        bestPractice: 90,
        ranking: 'average'
      }
    };
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IntelligentOptimization;
} else if (typeof window !== 'undefined') {
  window.IntelligentOptimization = IntelligentOptimization;
}