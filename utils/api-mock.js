/**
 * 智慧能源管理小程序 - 模拟数据接口工具
 * 提供所有页面所需的模拟数据
 * 版本: 2.0.0 - 优化版本
 * 更新内容: 统一数据模型、确定性数据生成、数据缓存机制
 */

// 引入统一数据模型
const { EnergyDataModel, SceneModeModel, AutomationRuleModel } = require('./energy-data-model.js');
const { parseDate } = require('./utils-commonjs.js');

// 定义首页今日能耗的固定值常量，用于首页和数据分析页“今日”数据
const TODAY_ENERGY_DATA = {
  electricity: 245.6, // kWh，调整为几百左右
  water: 12.3, // 吨
  gas: 8.7, // 立方米
};

// 碳排放因子（kg CO2/单位）- 从能源数据模型中获取，与getHomeOverview保持一致
const carbonEmissionFactors = {
  electricity: 0.785, // kg CO2/kWh (电网平均值)
  water: 0.344,      // kg CO2/吨 (包含水处理和输送能耗)
  gas: 2.093         // kg CO2/m³ (天然气燃烧排放)
};

class EnergyMockAPI {
  constructor() {
    // 初始化能源数据模型
    this.energyModel = new EnergyDataModel();
    this.sceneModeModel = new SceneModeModel();
    this.automationRuleModel = new AutomationRuleModel();

    // 初始化数据缓存
    this.cache = {
      deviceList: null,
      deviceListTimestamp: 0,
      energyData: {},
      alertList: null,
      alertListTimestamp: 0,
      userList: null,
      userListTimestamp: 0,
      sceneList: null,
      sceneListTimestamp: 0,
      automationRules: null,
      automationRulesTimestamp: 0
    };

    // 缓存过期时间（毫秒）
    this.cacheExpiration = 5 * 60 * 1000; // 5分钟

    // 初始化模拟数据
    this.initUsers();
    this.initDevices();
    this.initDeviceGroups();
    this.initEnergyData();
    this.initAlerts();
    this.initAutomationRules();
    this.initSceneMode();
    this.initReports();
    this.initSavingPlans();
  }

  /**
   * 获取节能方案
   * @returns {Object} 节能方案数据
   */
  getSavingPlans() {
    try {
      // 获取设备列表用于分析
      const deviceListResult = this.getDeviceList();
      const devices = deviceListResult.success ? deviceListResult.data.list : [];

      // 获取能耗数据用于分析
      const energyResult = this.getHistoryEnergyData({ timeRange: 'month' });
      const energyData = energyResult.success ? energyResult.data : null;

      // 计算节能潜力
      const savingPotential = this.calculateSavingPotential(devices, energyData);

      // 生成节能方案
      const savingPlans = this.generateSavingPlans(devices, savingPotential);

      // 节能小贴士
      const savingTips = this.getSavingTips();

      // 节能成果
      const savingAchievements = this.getSavingAchievements();

      // 节能目标
      const savingGoals = this.getSavingGoals();

      // 节能知识库
      const knowledgeBase = this.getSavingKnowledgeBase();

      return {
        success: true,
        data: {
          overview: {
            totalSavingPotential: savingPotential.total,
            monthlySavingPotential: savingPotential.monthly,
            carbonReductionPotential: savingPotential.carbon,
            costSavingPotential: savingPotential.cost
          },
          plans: savingPlans,
          tips: savingTips,
          achievements: savingAchievements,
          goals: savingGoals,
          knowledgeBase: knowledgeBase
        }
      };
    } catch (error) {
      return {
        success: false,
        message: '获取节能方案失败',
        error: error.message
      };
    }
  }

  /**
   * 计算节能潜力
   * @param {Array} devices 设备列表
   * @param {Object} energyData 能耗数据
   * @returns {Object} 节能潜力数据
   */
  calculateSavingPotential(devices, energyData) {
    // 基于设备类型和运行状态计算节能潜力
    let totalPotential = 0;
    let carbonPotential = 0;

    devices.forEach(device => {
      const devicePotential = this.getDeviceSavingPotential(device);
      totalPotential += devicePotential.energy;
      carbonPotential += devicePotential.carbon;
    });

    return {
      total: Math.round(totalPotential * 100) / 100, // kWh
      monthly: Math.round(totalPotential * 30 * 100) / 100, // 月度潜力
      carbon: Math.round(carbonPotential * 100) / 100, // kg CO2
      cost: Math.round(totalPotential * 0.6 * 100) / 100 // 按0.6元/kWh计算成本节约
    };
  }

  /**
   * 获取单个设备的节能潜力
   * @param {Object} device 设备信息
   * @returns {Object} 设备节能潜力
   */
  getDeviceSavingPotential(device) {
    const baseConsumption = this.energyModel.baseConsumptionRates.electricity || 0.5;
    const deviceFactor = this.energyModel.deviceTypeFactors[device.type] || 1.0;
    const currentConsumption = baseConsumption * deviceFactor;

    // 根据设备状态和类型计算节能潜力
    let savingRate = 0;
    switch (device.type) {
      case 'air_conditioner':
        savingRate = 0.25; // 空调可节能25%
        break;
      case 'lighting':
        savingRate = 0.30; // 照明可节能30%
        break;
      case 'motor':
        savingRate = 0.15; // 电机可节能15%
        break;
      case 'air_compressor':
        savingRate = 0.20; // 空压机可节能20%
        break;
      default:
        savingRate = 0.10; // 其他设备默认10%
    }

    const energySaving = currentConsumption * savingRate;
    const carbonSaving = energySaving * carbonEmissionFactors.electricity;

    return {
      energy: energySaving,
      carbon: carbonSaving
    };
  }

  /**
   * 生成节能方案
   * @param {Array} devices 设备列表
   * @param {Object} savingPotential 节能潜力
   * @returns {Array} 节能方案列表
   */
  generateSavingPlans(devices, savingPotential) {
    const plans = [
      {
        id: 'plan_001',
        title: '智能温控优化',
        category: 'temperature',
        priority: 'high',
        description: '通过智能温控系统，优化空调运行策略，在保证舒适度的前提下降低能耗',
        targetDevices: devices.filter(d => d.type === 'air_conditioner').map(d => d.id),
        estimatedSaving: {
          energy: Math.round(savingPotential.total * 0.4 * 100) / 100, // 40%的节能潜力来自温控
          cost: Math.round(savingPotential.cost * 0.4 * 100) / 100,
          carbon: Math.round(savingPotential.carbon * 0.4 * 100) / 100
        },
        implementation: {
          difficulty: 'medium',
          timeRequired: '1-2周',
          investment: '中等',
          roi: '6-12个月'
        },
        actions: [
          '设置合理的温度范围（夏季26-28℃，冬季18-20℃）',
          '启用定时开关机功能',
          '安装智能温控器',
          '优化空调运行时间表'
        ],
        status: 'recommended'
      },
      {
        id: 'plan_002',
        title: 'LED照明改造',
        category: 'lighting',
        priority: 'high',
        description: '将传统照明设备更换为LED灯具，并配置智能调光系统',
        targetDevices: devices.filter(d => d.type === 'lighting').map(d => d.id),
        estimatedSaving: {
          energy: Math.round(savingPotential.total * 0.3 * 100) / 100,
          cost: Math.round(savingPotential.cost * 0.3 * 100) / 100,
          carbon: Math.round(savingPotential.carbon * 0.3 * 100) / 100
        },
        implementation: {
          difficulty: 'easy',
          timeRequired: '1周',
          investment: '低',
          roi: '3-6个月'
        },
        actions: [
          '更换为LED灯具',
          '安装智能调光开关',
          '设置自动感应控制',
          '优化照明布局'
        ],
        status: 'in_progress'
      },
      {
        id: 'plan_003',
        title: '设备运行优化',
        category: 'equipment',
        priority: 'medium',
        description: '优化大功率设备的运行时间和负载，避免峰值用电',
        targetDevices: devices.filter(d => ['motor', 'air_compressor'].includes(d.type)).map(d => d.id),
        estimatedSaving: {
          energy: Math.round(savingPotential.total * 0.2 * 100) / 100,
          cost: Math.round(savingPotential.cost * 0.2 * 100) / 100,
          carbon: Math.round(savingPotential.carbon * 0.2 * 100) / 100
        },
        implementation: {
          difficulty: 'medium',
          timeRequired: '2-3周',
          investment: '中等',
          roi: '8-15个月'
        },
        actions: [
          '错峰运行大功率设备',
          '优化设备负载率',
          '定期维护保养',
          '安装变频控制器'
        ],
        status: 'planned'
      },
      {
        id: 'plan_004',
        title: '能源监控系统',
        category: 'monitoring',
        priority: 'medium',
        description: '建立完善的能源监控体系，实时掌握能耗情况，及时发现异常',
        targetDevices: devices.map(d => d.id),
        estimatedSaving: {
          energy: Math.round(savingPotential.total * 0.1 * 100) / 100,
          cost: Math.round(savingPotential.cost * 0.1 * 100) / 100,
          carbon: Math.round(savingPotential.carbon * 0.1 * 100) / 100
        },
        implementation: {
          difficulty: 'high',
          timeRequired: '4-6周',
          investment: '高',
          roi: '12-24个月'
        },
        actions: [
          '安装智能电表',
          '部署能耗监控系统',
          '建立能耗分析报告',
          '设置异常告警机制'
        ],
        status: 'evaluation'
      }
    ];

    return plans;
  }

  /**
   * 获取节能小贴士
   * @returns {Array} 节能小贴士列表
   */
  getSavingTips() {
    return [
      {
        id: 'tip_001',
        category: 'daily',
        title: '合理设置空调温度',
        content: '夏季空调温度设置在26-28℃，冬季设置在18-20℃，每调高1℃可节能6-8%',
        icon: '🌡️',
        difficulty: 'easy',
        savingPotential: 'high'
      },
      {
        id: 'tip_002',
        category: 'daily',
        title: '及时关闭不用的设备',
        content: '下班后及时关闭电脑、打印机等办公设备，避免待机耗电',
        icon: '💻',
        difficulty: 'easy',
        savingPotential: 'medium'
      },
      {
        id: 'tip_003',
        category: 'lighting',
        title: '充分利用自然光',
        content: '白天尽量使用自然光，减少人工照明的使用时间',
        icon: '☀️',
        difficulty: 'easy',
        savingPotential: 'medium'
      },
      {
        id: 'tip_004',
        category: 'equipment',
        title: '定期维护设备',
        content: '定期清洁和维护设备，保持设备良好运行状态，提高能效',
        icon: '🔧',
        difficulty: 'medium',
        savingPotential: 'high'
      },
      {
        id: 'tip_005',
        category: 'water',
        title: '节约用水',
        content: '及时修复漏水点，使用节水器具，减少不必要的用水',
        icon: '💧',
        difficulty: 'easy',
        savingPotential: 'medium'
      }
    ];
  }

  /**
   * 获取节能成果
   * @returns {Object} 节能成果数据
   */
  getSavingAchievements() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return {
      summary: {
        totalEnergySaved: 1245.6, // kWh
        totalCostSaved: 747.36, // 元
        totalCarbonReduced: 978.8, // kg CO2
        savingRate: 18.5 // 节能率 %
      },
      monthly: [
        {
          month: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`,
          energySaved: 156.8,
          costSaved: 94.08,
          carbonReduced: 123.3,
          savingRate: 22.1
        },
        {
          month: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
          energySaved: 142.3,
          costSaved: 85.38,
          carbonReduced: 111.8,
          savingRate: 19.7
        },
        {
          month: `${currentYear}-${String(currentMonth - 1).padStart(2, '0')}`,
          energySaved: 168.9,
          costSaved: 101.34,
          carbonReduced: 132.7,
          savingRate: 24.3
        }
      ],
      categories: [
        {
          category: 'lighting',
          name: '照明节能',
          energySaved: 456.2,
          percentage: 36.6,
          trend: 'up'
        },
        {
          category: 'temperature',
          name: '温控节能',
          energySaved: 523.8,
          percentage: 42.1,
          trend: 'up'
        },
        {
          category: 'equipment',
          name: '设备优化',
          energySaved: 265.6,
          percentage: 21.3,
          trend: 'stable'
        }
      ],
      milestones: [
        {
          id: 'milestone_001',
          title: '首次月度节能超过20%',
          achievedDate: '2024-05-15',
          description: '通过LED改造和智能温控，月度节能率首次突破20%',
          reward: '节能先锋'
        },
        {
          id: 'milestone_002',
          title: '累计节能超过1000kWh',
          achievedDate: '2024-06-20',
          description: '累计节能量突破1000kWh，减少碳排放785kg',
          reward: '绿色卫士'
        }
      ]
    };
  }

  /**
   * 获取节能目标
   * @returns {Object} 节能目标数据
   */
  getSavingGoals() {
    return {
      current: {
        id: 'goal_2024',
        title: '2024年度节能目标',
        targetSavingRate: 25, // 目标节能率 %
        currentSavingRate: 18.5, // 当前节能率 %
        targetEnergySaving: 2000, // 目标节能量 kWh
        currentEnergySaving: 1245.6, // 当前节能量 kWh
        targetCarbonReduction: 1570, // 目标减碳量 kg CO2
        currentCarbonReduction: 978.8, // 当前减碳量 kg CO2
        progress: 62.3, // 完成进度 %
        deadline: '2024-12-31',
        status: 'in_progress'
      },
      history: [
        {
          id: 'goal_2023',
          title: '2023年度节能目标',
          targetSavingRate: 20,
          actualSavingRate: 22.3,
          targetEnergySaving: 1500,
          actualEnergySaving: 1672.5,
          status: 'completed',
          achievement: 'exceeded'
        }
      ],
      suggestions: [
        {
          type: 'monthly',
          title: '月度节能目标建议',
          description: '建议设置月度节能率目标为20-25%，分阶段实现年度目标'
        },
        {
          type: 'category',
          title: '分类节能目标建议',
          description: '照明节能30%，温控节能25%，设备优化15%'
        }
      ]
    };
  }

  /**
   * 获取节能知识库
   * @returns {Array} 节能知识库数据
   */
  getSavingKnowledgeBase() {
    return [
      {
        id: 'knowledge_001',
        category: 'basic',
        title: '什么是能效等级？',
        summary: '了解设备能效等级的含义和选择标准',
        content: '能效等级是表示设备能源效率高低的一种分级方法，通常分为1-5级，1级最节能...',
        tags: ['能效', '设备选择', '基础知识'],
        readTime: 3,
        difficulty: 'beginner'
      },
      {
        id: 'knowledge_002',
        category: 'technology',
        title: 'LED照明技术原理',
        summary: 'LED照明的节能原理和应用优势',
        content: 'LED（发光二极管）是一种半导体照明技术，具有高效、长寿命、环保等特点...',
        tags: ['LED', '照明', '技术原理'],
        readTime: 5,
        difficulty: 'intermediate'
      },
      {
        id: 'knowledge_003',
        category: 'practice',
        title: '空调节能实用技巧',
        summary: '空调使用中的节能方法和注意事项',
        content: '空调是办公场所的主要耗电设备，通过合理使用可以显著降低能耗...',
        tags: ['空调', '节能技巧', '实用指南'],
        readTime: 4,
        difficulty: 'beginner'
      },
      {
        id: 'knowledge_004',
        category: 'policy',
        title: '国家节能政策解读',
        summary: '了解最新的节能减排政策和激励措施',
        content: '国家出台了一系列节能减排政策，包括税收优惠、补贴政策等...',
        tags: ['政策', '补贴', '法规'],
        readTime: 6,
        difficulty: 'advanced'
      },
      {
        id: 'knowledge_005',
        category: 'case',
        title: '企业节能改造案例',
        summary: '成功的企业节能改造项目案例分析',
        content: '某制造企业通过LED改造、智能控制等措施，年节能率达到30%...',
        tags: ['案例分析', '改造项目', '成功经验'],
        readTime: 8,
        difficulty: 'intermediate'
      }
    ];
  }

  // ==================== 工具方法 ====================

  // ==================== 用户管理相关 ====================

  /**
   * 用户登录
   * @param {string} phone - 手机号
   * @param {string} code - 验证码
   * @returns {Object} 登录结果
   */
  login(phone, code) {
    return {
      success: true,
      data: {
        token: 'mock_token_' + Date.now(),
        userInfo: {
          id: '001',
          phone: phone,
          nickname: '能源管理员',
          avatar: '/images/default-avatar.svg',
          role: 'admin', // admin, user, guest
          company: '智慧科技有限公司',
          department: '能源管理部'
        }
      },
      message: '登录成功'
    };
  }

  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Object} 用户信息
   */
  getUserInfo(userId) {
    const user = this.users.find(u => u.id === userId) || this.users[0];
    return {
      success: true,
      data: user
    };
  }

  /**
   * 获取用户列表（管理员功能）
   * @returns {Object} 用户列表
   */
  getUserList() {
    return {
      success: true,
      data: this.users
    };
  }

  /**
   * 获取用户统计数据
   * @param {string} userId - 用户ID（可选）
   * @returns {Object} 用户统计数据
   */
  getUserStatistics(userId) {
    return {
      success: true,
      data: {
        deviceCount: this.devices.length, // 设备总数
        alertCount: this.alerts.filter(a => a.status === 'unread').length, // 待处理告警数
        energySaving: 15.8, // 节能效果百分比
        carbonReduction: 2.35 // 减碳量（吨）
      },
      message: '获取用户统计数据成功'
    };
  }

  // ==================== 首页数据 ====================

  /**
   * 获取首页概览数据
   * @returns {Object} 首页数据
   */
  getHomeOverview() {
    // 使用统一的今日能耗数据
    const todayEnergy = TODAY_ENERGY_DATA;

    // 碳排放因子已在文件顶部定义，直接使用
    // 首页的碳排放因子可能包含solar和storage，这里将顶部的通用因子与首页特有的因子合并
    const combinedCarbonEmissionFactors = {
      ...carbonEmissionFactors,
      solar: 0,          // kg CO2/kWh (太阳能发电无直接碳排放)
      storage: 0.1       // kg CO2/kWh (考虑充放电损耗和电网电力的间接排放)
    };

    // 计算各能源类型的碳排放量
    // 计算各能源类型的碳排放量
    const electricityEmission = todayEnergy.electricity * combinedCarbonEmissionFactors.electricity;
    const waterEmission = todayEnergy.water * combinedCarbonEmissionFactors.water;
    const gasEmission = todayEnergy.gas * combinedCarbonEmissionFactors.gas;

    // 计算总碳排放量（kg CO2）
    const totalEmission = electricityEmission + waterEmission + gasEmission;

    // 计算总能耗 - 综合能耗
    const totalEnergy = todayEnergy.electricity + todayEnergy.water + todayEnergy.gas;

    // 计算昨日能耗数据（模拟数据，略低于今日）
    const yesterdayFactor = 0.92; // 昨日能耗为今日的92%
    const yesterdayTotal = totalEnergy * yesterdayFactor;

    // 计算能耗趋势（相比昨日的增长率）
    const energyTrend = ((totalEnergy - yesterdayTotal) / yesterdayTotal * 100).toFixed(1);

    return {
      success: true,
      data: {
        // 实时总能耗数据
        realTimeEnergy: {
          today: {
            electricity: todayEnergy.electricity, // kWh
            water: todayEnergy.water, // 吨
            gas: todayEnergy.gas, // 立方米
            total: totalEnergy, // 综合能耗
            carbonEmission: totalEmission.toFixed(1), // kg CO2
            trend: energyTrend // 能耗趋势（相比昨日）
          },
          thisMonth: {
            electricity: 28500.2,
            water: 1850.5,
            gas: 2850.6,
            total: 33201.3
          }
        },
        // 用电负荷曲线（24小时）
        loadCurve: this.generateLoadCurve(),
        // 设备告警概览
        alertSummary: {
          total: 5,
          critical: 1,
          warning: 3,
          info: 1,
          types: ['设备离线', '能耗异常', '温度过高']
        },
        // 天气信息
        weather: {
          temperature: 25,
          humidity: 65,
          condition: '晴',
          icon: 'sunny'
        },
        // 快捷控制状态
        quickControls: {
          energySavingMode: false,
          currentScene: '工作日模式'
        }
      }
    };
  }

  /**
   * 获取实时监控详情
   * @param {string} deviceId - 设备ID或区域ID
   * @param {string} timeRange - 时间范围：1h, 6h, 12h, 24h, 7d
   * @returns {Object} 监控详情
   */
  getMonitorDetail(deviceId, timeRange = '24h') {
    return {
      success: true,
      data: {
        deviceInfo: {
          id: deviceId,
          name: '生产车间A区',
          type: 'area',
          status: 'online'
        },
        // 分时能耗曲线 - 根据时间范围生成不同的数据
        energyCurve: this.generateEnergyTimeSeries(timeRange),
        // 实时参数
        realTimeParams: {
          power: 125.5, // kW
          voltage: 380.2, // V
          current: 195.8, // A
          frequency: 50.0, // Hz
          powerFactor: 0.95
        },
        // 环境参数
        environmentParams: {
          temperature: 28.5, // °C
          humidity: 62.3, // %
          airQuality: 'good'
        },
        // 告警列表
        alerts: this.alerts.slice(0, 3)
      }
    };
  }

  // ==================== 设备管理相关 ====================

  /**
   * 获取设备列表 - 优化版本（支持缓存）
   * @param {Object} params - 查询参数
   * @returns {Object} 设备列表
   */
  getDeviceList(params = {}) {
    const now = Date.now();

    // 检查缓存是否有效
    if (this.cache.deviceList &&
      (now - this.cache.deviceListTimestamp) < this.cacheExpiration) {
      // 使用缓存数据
      let result = [...this.cache.deviceList];

      // 应用筛选
      if (params.type) {
        result = result.filter(device => device.type === params.type);
      }
      if (params.status) {
        result = result.filter(device => device.status === params.status);
      }
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase();
        result = result.filter(device =>
          device.name.toLowerCase().includes(keyword) ||
          device.location.toLowerCase().includes(keyword)
        );
      }

      return {
        success: true,
        data: {
          list: result,
          total: result.length,
          summary: {
            total: result.length,
            online: result.filter(d => d.status === 'online').length,
            offline: result.filter(d => d.status === 'offline').length,
            alarm: result.filter(d => d.hasAlert).length
          }
        }
      };
    }

    // 缓存无效，重新生成数据
    const devices = this.devices.map(device => {
      // 深拷贝设备对象，避免修改原始数据
      const deviceCopy = { ...device };

      // 查找该设备的所有告警
      const deviceAlerts = this.alerts.filter(alert => alert.deviceId === device.id);

      // 如果有告警，添加到设备对象中
      if (deviceAlerts.length > 0) {
        deviceCopy.alerts = deviceAlerts.map(alert => ({
          id: alert.id,
          message: alert.title,
          content: alert.content,
          time: alert.createTime,
          severity: alert.level,
          status: alert.status
        }));
        deviceCopy.hasAlert = true;
      } else {
        deviceCopy.alerts = [];
        deviceCopy.hasAlert = false;
      }

      return deviceCopy;
    });

    // 更新缓存
    this.cache.deviceList = devices;
    this.cache.deviceListTimestamp = now;

    // 应用筛选
    let result = [...devices];
    if (params.type) {
      result = result.filter(device => device.type === params.type);
    }
    if (params.status) {
      result = result.filter(device => device.status === params.status);
    }
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      result = result.filter(device =>
        device.name.toLowerCase().includes(keyword) ||
        device.location.toLowerCase().includes(keyword)
      );
    }

    return {
      success: true,
      data: {
        list: result,
        total: result.length,
        summary: {
          total: result.length,
          online: result.filter(d => d.status === 'online').length,
          offline: result.filter(d => d.status === 'offline').length,
          alarm: result.filter(d => d.hasAlert).length
        }
      }
    };
  }

  /**
   * 获取设备详情
   * @param {string} deviceId - 设备ID
   * @returns {Object} 设备详情
   */
  getDeviceDetail(deviceId) {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      return { success: false, message: '设备不存在' };
    }

    // 将设备的基本信息转换为规格信息数组格式，排除category和alerts等特殊字段
    const deviceSpecifications = [
      { key: 'model', label: '设备型号', value: device.model || 'ES-2000' },
      { key: 'brand', label: '品牌', value: device.brand || '智能设备厂商' },
      { key: 'installDate', label: '安装日期', value: '2023-01-15' },
      { key: 'warrantyExpire', label: '保修期至', value: '2025-01-15' },
      { key: 'power', label: '额定功率', value: `${parseFloat(device.maxPower || device.power || 0).toFixed(1)} kW` },
      { key: 'uptime', label: '累计运行', value: `${device.uptime || 0} 小时` },
      { key: 'healthStatus', label: '设备健康度', value: `${device.healthStatus || 90}%` },
      { key: 'maintenanceStatus', label: '维护状态', value: this.getMaintenanceStatusText(device.maintenanceStatus) }
    ];

    // 如果设备有能效等级，添加到规格中
    if (device.energyEfficiency) {
      deviceSpecifications.push({ key: 'energyEfficiency', label: '能效等级', value: device.energyEfficiency });
    }

    // 如果设备有最后维护时间，添加到规格中
    if (device.lastMaintenance) {
      deviceSpecifications.push({ key: 'lastMaintenance', label: '上次维护', value: device.lastMaintenance });
    }

    // 根据设备类型生成不同的历史数据
    let historyData = {
      totalRunTime: device.uptime || 2580, // 小时
      totalEnergyConsumption: 15680.5, // kWh
      averagePower: 6.08, // kW
      efficiency: 0.92
    };

    // 根据设备类型添加特定的历史数据
    if (device.category === 'water') {
      historyData.flowRate = this.generateRandomData(50, 200, 'L/min');
      historyData.waterConsumption = this.generateRandomData(1000, 5000, 'm³');
    } else if (device.category === 'gas') {
      historyData.pressure = this.generateRandomData(0.2, 0.5, 'MPa');
      historyData.gasConsumption = this.generateRandomData(500, 2000, 'm³');
    }

    // 根据设备类型生成不同的当前参数
    let currentParams = {
      power: device.power || 0,
      voltage: 220,
      current: device.power ? (device.power * 1000 / 220).toFixed(1) : 0,
      temperature: device.temperature || 45.2
    };

    // 根据设备类型添加特定的当前参数
    if (device.category === 'water') {
      currentParams.flowRate = device.flowRate || Math.floor(Math.random() * 100 + 50);
      currentParams.pressure = device.pressure || (Math.random() * 0.3 + 0.2).toFixed(2);
      currentParams.waterFlow = Math.floor(Math.random() * 50 + 20);
    } else if (device.category === 'gas') {
      currentParams.pressure = device.pressure || (Math.random() * 0.3 + 0.2).toFixed(2);
      currentParams.gasConsumption = Math.floor(Math.random() * 100 + 30);
      if (device.type === 'gas_detector') {
        currentParams.gasConcentration = (Math.random() * 0.5).toFixed(2);
      }
    } else if (device.category === 'electricity') {
      currentParams.voltage = device.voltage || 220;
      currentParams.current = device.current || (Math.random() * 10 + 5).toFixed(1);
    } else if (device.type === 'environment_monitor') {
      currentParams.airQuality = device.airQuality || Math.floor(Math.random() * 100 + 1);
      currentParams.humidity = device.humidity || Math.floor(Math.random() * 60 + 30);
    }

    // 查找该设备的所有告警
    const deviceAlerts = this.alerts.filter(alert => alert.deviceId === device.id);

    return {
      success: true,
      data: {
        ...device,
        // 扩展详情信息 - 使用数组格式，与页面显示一致
        specifications: deviceSpecifications,
        // 历史运行数据
        historyData: historyData,
        // 当前参数
        currentParams: currentParams,
        // 设备告警
        alerts: deviceAlerts.map(alert => ({
          id: alert.id,
          message: alert.title,
          content: alert.content,
          time: alert.createTime,
          severity: alert.level,
          status: alert.status
        })) || []
      }
    };
  }

  /**
   * 生成随机数据，用于模拟历史数据
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @param {string} unit - 单位
   * @returns {Object} 随机数据对象
   */
  generateRandomData(min, max, unit) {
    const value = Math.floor(Math.random() * (max - min) + min);
    const data = {
      value: value,
      unit: unit,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      change: (Math.random() * 10).toFixed(1)
    };
    return data;
  }

  /**
   * 获取维护状态的文本描述
   * @param {string} status - 维护状态代码
   * @returns {string} 状态文本
   */
  getMaintenanceStatusText(status) {
    const statusMap = {
      'normal': '正常',
      'warning': '需要检查',
      'required': '需要维护'
    };
    return statusMap[status] || '未知';
  }

  /**
   * 控制设备
   * @param {string} deviceId - 设备ID
   * @param {Object} command - 控制命令
   * @returns {Object} 控制结果
   */
  controlDevice(deviceId, command) {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      return { success: false, message: '设备不存在' };
    }

    // 模拟控制逻辑
    if (command.action === 'switch') {
      device.isOn = command.value;
      device.status = command.value ? 'online' : 'offline';
    } else if (command.action === 'setMode') {
      device.mode = command.value;
    } else if (command.action === 'setParams') {
      Object.assign(device, command.params);
    }

    return {
      success: true,
      data: device,
      message: '控制成功'
    };
  }

  /**
   * 添加设备
   * @param {Object} deviceInfo - 设备信息
   * @returns {Object} 添加结果
   */
  addDevice(deviceInfo) {
    const newDevice = {
      id: 'device_' + Date.now(),
      ...deviceInfo,
      status: 'online',
      isOn: false,
      hasAlert: false,
      addTime: new Date().toISOString()
    };

    this.devices.push(newDevice);

    return {
      success: true,
      data: newDevice,
      message: '设备添加成功'
    };
  }

  // ==================== 历史数据与报告 ====================

  /**
   * 获取历史能耗数据
   * @param {Object} params - 查询参数
   * @returns {Object} 历史数据
   */
  getHistoryEnergyData(params) {
    const { timeRange, energyType, deviceId } = params;

    // 直接使用文件顶部定义的 TODAY_ENERGY_DATA 和 carbonEmissionFactors 常量
    // const TODAY_ENERGY_DATA = { ... };
    // const carbonEmissionFactors = { ... };

    // 如果请求的是“今日”数据，则返回固定的首页数据
    if (timeRange === 'day') {
      const electricityValue = TODAY_ENERGY_DATA.electricity;
      const waterValue = TODAY_ENERGY_DATA.water;
      const gasValue = TODAY_ENERGY_DATA.gas;
      const totalValue = electricityValue + waterValue + gasValue;

      // 计算碳排放量
      const carbonElectricity = (electricityValue * carbonEmissionFactors.electricity / 1000).toFixed(2); // 转换为吨
      const carbonWater = (waterValue * carbonEmissionFactors.water / 1000).toFixed(2); // 转换为吨
      const carbonGas = (gasValue * carbonEmissionFactors.gas / 1000).toFixed(2); // 转换为吨
      const carbonTotal = (parseFloat(carbonElectricity) + parseFloat(carbonWater) + parseFloat(carbonGas)).toFixed(2);

      // 计算百分比
      const electricityPercentage = Math.round((electricityValue / totalValue) * 100);
      const waterPercentage = Math.round((waterValue / totalValue) * 100);
      const gasPercentage = 100 - electricityPercentage - waterPercentage;

      return {
        success: true,
        data: {
          // 能耗曲线数据（今日数据可以模拟为平稳曲线或直接使用首页的负荷曲线）
          chartData: this.generateHistoryChartData(timeRange, energyType, TODAY_ENERGY_DATA),
          // 统计数据
          statistics: {
            total: totalValue, // 今日总能耗
            average: totalValue, // 今日平均值（因为是单日）
            peak: totalValue * 1.1, // 模拟峰值
            valley: totalValue * 0.9, // 模拟谷值
            growth: 0 // 今日数据无增长率概念，设为0
          },
          // 分项能耗
          breakdown: {
            electricity: { value: electricityValue, percentage: electricityPercentage },
            water: { value: waterValue, percentage: waterPercentage },
            gas: { value: gasValue, percentage: gasPercentage }
          },
          // 碳排放量
          carbonEmission: {
            total: parseFloat(carbonTotal), // 吨CO2
            electricity: parseFloat(carbonElectricity),
            gas: parseFloat(carbonGas)
          }
        }
      };
    }

    // 根据时间范围生成不同的基础数据
    const baseMultiplier = this.getTimeRangeMultiplier(timeRange);
    const randomFactor = Math.random() * 0.3 + 0.85; // 0.85-1.15的随机因子

    // 动态生成分项能耗数据
    // 根据新的基数和倍数生成能耗数据，确保与日数据量级匹配
    const electricityValue = Math.round((18500 * baseMultiplier * randomFactor) * 100) / 100; // 电力基数保持18500
    const waterValue = Math.round((922.5 * baseMultiplier * randomFactor) * 100) / 100; // 水能耗基数调整为922.5 (12.3 * 30 / 0.4)
    const gasValue = Math.round((652.5 * baseMultiplier * randomFactor) * 100) / 100; // 燃气能耗基数调整为652.5 (8.7 * 30 / 0.4)
    const totalValue = electricityValue + waterValue + gasValue;

    // 计算百分比
    const electricityPercentage = Math.round((electricityValue / totalValue) * 100);
    const waterPercentage = Math.round((waterValue / totalValue) * 100);
    const gasPercentage = 100 - electricityPercentage - waterPercentage;

    // 动态生成统计数据
    const total = totalValue;
    const average = Math.round((total / this.getTimeRangeDays(timeRange)) * 100) / 100;
    const peak = Math.round((average * 1.6) * 100) / 100;
    const valley = Math.round((average * 0.3) * 100) / 100;
    const growth = Math.round(((Math.random() - 0.5) * 20) * 10) / 10; // -10% 到 +10%

    // 动态生成碳排放数据
    const carbonTotal = Math.round((electricityValue * carbonEmissionFactors.electricity / 1000 + gasValue * carbonEmissionFactors.gas / 1000) * 100) / 100; // 转换为吨
    const carbonElectricity = Math.round((electricityValue * carbonEmissionFactors.electricity / 1000) * 100) / 100; // 转换为吨
    const carbonGas = Math.round((gasValue * carbonEmissionFactors.gas / 1000) * 100) / 100; // 转换为吨

    return {
      success: true,
      data: {
        // 能耗曲线数据
        chartData: this.generateHistoryChartData(timeRange, energyType),
        // 统计数据
        statistics: {
          total: total,
          average: average,
          peak: peak,
          valley: valley,
          growth: growth // 同比增长%
        },
        // 分项能耗
        breakdown: {
          electricity: { value: electricityValue, percentage: electricityPercentage },
          water: { value: waterValue, percentage: waterPercentage },
          gas: { value: gasValue, percentage: gasPercentage }
        },
        // 碳排放量
        carbonEmission: {
          total: carbonTotal, // 吨CO2
          electricity: carbonElectricity,
          gas: carbonGas
        }
      }
    };
  }

  /**
   * 生成能耗报告
   * @param {Object} params - 报告参数
   * @returns {Object} 报告数据
   */
  generateEnergyReport(params) {
    const { reportType, timeRange } = params;

    return {
      success: true,
      data: {
        reportId: 'report_' + Date.now(),
        reportType,
        timeRange,
        generateTime: new Date().toISOString(),
        summary: {
          totalConsumption: 28500.5,
          totalCost: 18525.33,
          carbonEmission: 14.25,
          efficiency: 0.89
        },
        trends: {
          consumption: 5.2, // 同比增长%
          cost: 3.8,
          efficiency: -2.1 // 负数表示效率提升
        },
        recommendations: [
          '建议在非生产时间关闭部分照明设备',
          '空调温度设置可适当调高1-2度',
          '考虑安装光伏发电系统'
        ],
        downloadUrl: 'https://example.com/reports/report_' + Date.now() + '.pdf'
      }
    };
  }

  // ==================== 告警管理 ====================

  /**
   * 获取告警列表 - 优化版本（支持缓存）
   * @param {Object} params - 查询参数
   * @returns {Object} 告警列表
   */
  getAlertList(params = {}) {
    const now = Date.now();

    // 检查缓存是否有效
    if (this.cache.alertList &&
      (now - this.cache.alertListTimestamp) < this.cacheExpiration) {
      // 使用缓存数据
      let result = [...this.cache.alertList];

      // 应用筛选
      if (params.status) {
        result = result.filter(alert => alert.status === params.status);
      }
      if (params.level) {
        result = result.filter(alert => alert.level === params.level);
      }
      if (params.type) {
        result = result.filter(alert => alert.type === params.type);
      }

      return {
        success: true,
        data: {
          list: result,
          total: result.length,
          summary: {
            unread: result.filter(a => a.status === 'unread').length,
            critical: result.filter(a => a.level === 'critical').length,
            warning: result.filter(a => a.level === 'warning').length
          }
        }
      };
    }

    // 缓存无效，重新生成数据
    const alerts = [...this.alerts];

    // 更新缓存
    this.cache.alertList = alerts;
    this.cache.alertListTimestamp = now;

    // 应用筛选
    let result = [...alerts];
    if (params.status) {
      result = result.filter(alert => alert.status === params.status);
    }
    if (params.level) {
      result = result.filter(alert => alert.level === params.level);
    }
    if (params.type) {
      result = result.filter(alert => alert.type === params.type);
    }

    return {
      success: true,
      data: {
        list: result,
        total: result.length,
        summary: {
          unread: result.filter(a => a.status === 'unread').length,
          critical: result.filter(a => a.level === 'critical').length,
          warning: result.filter(a => a.level === 'warning').length
        }
      }
    };
  }

  /**
   * 获取告警详情
   * @param {string} alertId - 告警ID
   * @returns {Object} 告警详情
   */
  getAlertDetail(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      return {
        success: false,
        message: '告警不存在'
      };
    }

    // 获取相关设备信息
    const device = this.devices.find(d => d.id === alert.deviceId);

    // 获取处理历史（模拟数据）
    const handleHistory = [
      {
        id: 'history_001',
        action: 'view',
        operator: '陈志强',
        operatorId: 'user_001',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
        remark: '查看告警详情'
      }
    ];

    // 如果告警已处理，添加处理记录
    if (alert.status !== 'unread') {
      handleHistory.push({
        id: 'history_002',
        action: alert.status === 'resolved' ? 'resolve' : 'read',
        operator: '王晓敏',
        operatorId: 'user_002',
        time: alert.handleTime || new Date().toISOString(),
        remark: alert.status === 'resolved' ? '问题已解决' : '已标记为已读'
      });
    }

    // 获取相关能耗数据（如果是能耗异常告警）
    let energyData = null;
    if (alert.type === 'energy_abnormal' && device) {
      energyData = {
        current: device.energyConsumption || 0,
        normal: (device.energyConsumption || 0) * 0.8, // 正常值为当前的80%
        trend: [
          { time: '00:00', value: (device.energyConsumption || 0) * 0.7 },
          { time: '06:00', value: (device.energyConsumption || 0) * 0.9 },
          { time: '12:00', value: device.energyConsumption || 0 },
          { time: '18:00', value: (device.energyConsumption || 0) * 1.1 },
          { time: '24:00', value: (device.energyConsumption || 0) * 0.8 }
        ]
      };
    }

    // 获取建议处理方案
    const suggestions = this.getAlertSuggestions(alert.type, alert.level);

    return {
      success: true,
      data: {
        ...alert,
        device: device ? {
          id: device.id,
          name: device.name,
          type: device.type,
          location: device.location,
          status: device.status,
          model: device.model || '未知型号',
          installDate: device.installDate || '2023-01-01'
        } : null,
        energyData,
        handleHistory,
        suggestions,
        // 格式化时间显示
        createTimeFormatted: this.formatTime(alert.createTime),
        handleTimeFormatted: alert.handleTime ? this.formatTime(alert.handleTime) : null
      }
    };
  }

  /**
   * 获取告警处理建议
   * @param {string} type - 告警类型
   * @param {string} level - 告警级别
   * @returns {Array} 建议列表
   */
  getAlertSuggestions(type, level) {
    const suggestions = {
      device_offline: [
        '检查设备电源连接是否正常',
        '确认网络连接状态',
        '重启设备尝试恢复连接',
        '联系技术支持进行远程诊断'
      ],
      energy_abnormal: [
        '检查设备运行参数设置',
        '确认设备是否存在故障',
        '分析历史能耗数据找出异常原因',
        '考虑调整设备运行策略'
      ],
      temperature_high: [
        '立即调整空调温度设置',
        '检查空调系统运行状态',
        '确认房间密封性是否良好',
        '考虑增加通风或制冷设备'
      ],
      temperature_low: [
        '检查加热设备运行状态',
        '确认温度传感器是否正常',
        '检查保温设施是否完好',
        '调整加热设备参数'
      ],
      maintenance_reminder: [
        '联系专业维护人员',
        '准备维护所需工具和材料',
        '安排合适的维护时间',
        '制定维护计划和检查清单'
      ],
      energy_saving_tip: [
        '立即关闭不必要的设备',
        '设置自动化控制规则',
        '优化设备运行时间',
        '制定节能管理制度'
      ]
    };

    return suggestions[type] || ['请联系技术支持获取专业建议'];
  }

  /**
   * 格式化时间显示
   * @param {string|Date} timeInput - 时间字符串或Date对象
   * @returns {string} 格式化后的时间
   */
  formatTime(timeInput) {
    // 处理不同类型的时间输入
    let date;
    if (timeInput instanceof Date) {
      date = timeInput;
    } else if (typeof timeInput === 'string') {
      date = parseDate(timeInput);
    } else if (typeof timeInput === 'number') {
      date = new Date(timeInput);
    } else {
      console.error('formatTime: 无效的时间参数', timeInput);
      return '时间格式错误';
    }

    // 检查Date对象是否有效
    if (isNaN(date.getTime())) {
      console.error('formatTime: 无效的日期', timeInput);
      return '无效日期';
    }

    const now = new Date();
    const diff = now - date;

    if (diff < 60 * 1000) {
      return '刚刚';
    } else if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }

  /**
   * 处理告警 - 优化版本（支持缓存清理）
   * @param {string} alertId - 告警ID
   * @param {string} action - 处理动作
   * @returns {Object} 处理结果
   */
  handleAlert(alertId, action) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      return { success: false, message: '告警不存在' };
    }

    // 根据动作更新告警状态
    switch (action) {
      case 'read':
        alert.status = 'read';
        alert.handleTime = new Date().toISOString();
        break;
      case 'ignore':
        alert.status = 'ignored';
        alert.handleTime = new Date().toISOString();
        break;
      case 'resolve':
        alert.status = 'resolved';
        alert.handleTime = new Date().toISOString();
        break;
      default:
        return { success: false, message: '不支持的处理动作' };
    }

    // 清除相关缓存，确保数据一致性
    this.cache.alertList = null;
    this.cache.alertListTimestamp = 0;
    this.cache.deviceList = null;
    this.cache.deviceListTimestamp = 0;

    // 更新设备的hasAlert状态
    this.updateDeviceAlertStatus();

    return {
      success: true,
      data: alert,
      message: '处理成功'
    };
  }

  // ==================== 自动化规则 ====================

  /**
   * 获取自动化规则列表
   * @returns {Object} 规则列表
   */
  getAutomationRules() {
    return {
      success: true,
      data: this.automationRules
    };
  }

  /**
   * 创建自动化规则
   * @param {Object} ruleData - 规则数据
   * @returns {Object} 创建结果
   */
  createAutomationRule(ruleData) {
    const newRule = {
      id: 'rule_' + Date.now(),
      ...ruleData,
      createTime: new Date().toISOString(),
      enabled: true,
      executeCount: 0
    };

    this.automationRules.push(newRule);

    return {
      success: true,
      data: newRule,
      message: '规则创建成功'
    };
  }

  /**
   * 更新自动化规则
   * @param {string} ruleId - 规则ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新结果
   */
  updateAutomationRule(ruleId, updateData) {
    const rule = this.automationRules.find(r => r.id === ruleId);
    if (!rule) {
      return { success: false, message: '规则不存在' };
    }

    Object.assign(rule, updateData);
    rule.updateTime = new Date().toISOString();

    return {
      success: true,
      data: rule,
      message: '规则更新成功'
    };
  }

  /**
   * 执行自动化规则
   * @param {string} ruleId - 规则ID
   * @returns {Object} 执行结果
   */
  executeAutomationRule(ruleId) {
    const rule = this.automationRules.find(r => r.id === ruleId);
    if (!rule) {
      return { success: false, message: '规则不存在' };
    }

    if (!rule.enabled) {
      return { success: false, message: '规则已禁用' };
    }

    // 模拟规则执行
    const executionResult = {
      ruleId,
      ruleName: rule.name,
      executeTime: new Date().toISOString(),
      duration: Math.floor(Math.random() * 5000) + 1000, // 1-6秒
      affectedDevices: rule.actions ? rule.actions.length : 0,
      energyImpact: this.automationRuleModel.calculateRuleEnergyImpact(rule),
      status: Math.random() > 0.05 ? 'success' : 'failed'
    };

    // 更新规则执行计数
    rule.executeCount = (rule.executeCount || 0) + 1;
    rule.lastExecuteTime = executionResult.executeTime;

    return {
      success: true,
      data: executionResult,
      message: '规则执行完成'
    };
  }

  /**
   * 获取规则执行历史
   * @param {string} ruleId - 规则ID
   * @param {string} timeRange - 时间范围
   * @returns {Object} 执行历史
   */
  getRuleExecutionHistory(ruleId, timeRange = '7d') {
    const rule = this.automationRules.find(r => r.id === ruleId);
    if (!rule) {
      return { success: false, message: '规则不存在' };
    }

    // 模拟执行历史数据
    const history = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 7;
    const executionCount = Math.min(rule.executeCount || 0, days * 3);

    for (let i = 0; i < executionCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(i / 3));
      date.setHours(Math.floor(Math.random() * 24));

      history.push({
        id: `exec_${ruleId}_${i}`,
        ruleId,
        ruleName: rule.name,
        executeTime: date.toISOString(),
        duration: Math.floor(Math.random() * 5000) + 1000,
        affectedDevices: rule.actions ? rule.actions.length : 0,
        energyChange: (Math.random() - 0.5) * 8, // -4到4kW的变化
        status: Math.random() > 0.05 ? 'success' : 'failed',
        triggerCondition: rule.conditions ? rule.conditions[0]?.type : 'unknown'
      });
    }

    return {
      success: true,
      data: history.sort((a, b) => new Date(b.executeTime) - new Date(a.executeTime))
    };
  }

  /**
   * 测试规则执行
   * @param {Object} ruleData - 规则数据
   * @returns {Object} 测试结果
   */
  testAutomationRule(ruleData) {
    // 模拟规则测试
    const testResult = {
      testTime: new Date().toISOString(),
      conditionsValid: true,
      actionsExecutable: true,
      estimatedDuration: Math.floor(Math.random() * 3000) + 500,
      estimatedEnergyImpact: this.automationRuleModel.evaluateRuleTrigger(ruleData.conditions || []),
      warnings: [],
      errors: []
    };

    // 模拟一些测试警告
    if (Math.random() > 0.8) {
      testResult.warnings.push('部分设备可能不在线');
    }

    if (Math.random() > 0.9) {
      testResult.errors.push('条件配置存在冲突');
      testResult.conditionsValid = false;
    }

    return {
      success: true,
      data: testResult
    };
  }

  /**
   * 获取规则性能统计
   * @param {string} ruleId - 规则ID
   * @returns {Object} 性能统计
   */
  getRulePerformanceStats(ruleId) {
    const rule = this.automationRules.find(r => r.id === ruleId);
    if (!rule) {
      return { success: false, message: '规则不存在' };
    }

    const stats = {
      ruleId,
      ruleName: rule.name,
      totalExecutions: rule.executeCount || 0,
      successRate: Math.random() * 0.1 + 0.9, // 90-100%成功率
      averageDuration: Math.floor(Math.random() * 2000) + 1000,
      totalEnergySaved: (rule.executeCount || 0) * (Math.random() * 2 + 0.5),
      totalCostSaved: 0,
      lastExecuteTime: rule.lastExecuteTime || null,
      performance: 'excellent' // excellent, good, average, poor
    };

    stats.totalCostSaved = stats.totalEnergySaved * 0.65; // 电价0.65元/kWh

    if (stats.successRate < 0.95) stats.performance = 'good';
    if (stats.successRate < 0.9) stats.performance = 'average';
    if (stats.successRate < 0.8) stats.performance = 'poor';

    return {
      success: true,
      data: stats
    };
  }

  /**
   * 批量启用/禁用规则
   * @param {Array} ruleIds - 规则ID列表
   * @param {boolean} enabled - 启用状态
   * @returns {Object} 操作结果
   */
  batchUpdateRuleStatus(ruleIds, enabled) {
    const results = [];

    ruleIds.forEach(ruleId => {
      const rule = this.automationRules.find(r => r.id === ruleId);
      if (rule) {
        rule.enabled = enabled;
        rule.updateTime = new Date().toISOString();
        results.push({
          ruleId,
          ruleName: rule.name,
          success: true,
          newStatus: enabled ? 'enabled' : 'disabled'
        });
      } else {
        results.push({
          ruleId,
          success: false,
          error: '规则不存在'
        });
      }
    });

    return {
      success: true,
      data: {
        total: ruleIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    };
  }

  /**
   * 获取规则冲突检测
   * @returns {Object} 冲突检测结果
   */
  detectRuleConflicts() {
    const conflicts = [];

    // 模拟规则冲突检测
    for (let i = 0; i < this.automationRules.length; i++) {
      for (let j = i + 1; j < this.automationRules.length; j++) {
        const rule1 = this.automationRules[i];
        const rule2 = this.automationRules[j];

        // 模拟冲突检测逻辑
        if (Math.random() > 0.9 && rule1.enabled && rule2.enabled) {
          conflicts.push({
            id: `conflict_${rule1.id}_${rule2.id}`,
            type: 'device_action_conflict',
            severity: Math.random() > 0.5 ? 'high' : 'medium',
            rule1: { id: rule1.id, name: rule1.name },
            rule2: { id: rule2.id, name: rule2.name },
            description: `规则 "${rule1.name}" 和 "${rule2.name}" 可能对同一设备执行冲突操作`,
            suggestion: '建议调整规则执行条件或优先级'
          });
        }
      }
    }

    return {
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflictCount: conflicts.length,
        conflicts
      }
    };
  }

  // ==================== 场景模式 ====================

  /**
   * 获取场景模式列表
   * @returns {Object} 场景列表
   */
  getSceneModes() {
    return {
      success: true,
      data: this.sceneMode
    };
  }

  /**
   * 切换场景模式
   * @param {string} sceneId - 场景ID
   * @returns {Object} 切换结果
   */
  switchSceneMode(sceneId) {
    const scene = this.sceneMode.find(s => s.id === sceneId);
    if (!scene) {
      return { success: false, message: '场景不存在' };
    }

    // 更新当前场景状态
    this.sceneMode.forEach(s => s.isActive = false);
    scene.isActive = true;
    scene.lastActiveTime = new Date().toISOString();

    // 模拟场景切换对设备的影响
    const affectedDeviceIds = scene.deviceSettings ? scene.deviceSettings.map(setting => setting.deviceId) : [];

    return {
      success: true,
      data: {
        ...scene,
        deviceSettings: scene.deviceSettings || [],
        affectedDevices: affectedDeviceIds,
        energyImpact: this.sceneModeModel.calculateEnergyImpact(scene)
      },
      message: '场景切换成功'
    };
  }

  /**
   * 获取场景执行历史
   * @param {string} sceneId - 场景ID
   * @param {string} timeRange - 时间范围
   * @returns {Object} 执行历史
   */
  getSceneExecutionHistory(sceneId, timeRange = '7d') {
    const scene = this.sceneMode.find(s => s.id === sceneId);
    if (!scene) {
      return { success: false, message: '场景不存在' };
    }

    // 模拟执行历史数据
    const history = [];
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 7;

    for (let i = 0; i < Math.min(days * 2, 20); i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(i / 2));
      date.setHours(Math.floor(Math.random() * 24));

      history.push({
        id: `exec_${sceneId}_${i}`,
        sceneId,
        sceneName: scene.name,
        executeTime: date.toISOString(),
        duration: Math.floor(Math.random() * 60) + 10, // 10-70秒
        affectedDevices: Math.floor(Math.random() * 5) + 1,
        energyChange: (Math.random() - 0.5) * 10, // -5到5kW的变化
        status: Math.random() > 0.1 ? 'success' : 'failed'
      });
    }

    return {
      success: true,
      data: history.sort((a, b) => new Date(b.executeTime) - new Date(a.executeTime))
    };
  }

  /**
   * 创建自定义场景
   * @param {Object} sceneData - 场景数据
   * @returns {Object} 创建结果
   */
  createSceneMode(sceneData) {
    const newScene = {
      id: 'scene_' + Date.now(),
      ...sceneData,
      createTime: new Date().toISOString(),
      isActive: false,
      isCustom: true,
      executeCount: 0
    };

    this.sceneMode.push(newScene);

    return {
      success: true,
      data: newScene,
      message: '场景创建成功'
    };
  }

  /**
   * 更新场景配置
   * @param {string} sceneId - 场景ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新结果
   */
  updateSceneMode(sceneId, updateData) {
    const scene = this.sceneMode.find(s => s.id === sceneId);
    if (!scene) {
      return { success: false, message: '场景不存在' };
    }

    Object.assign(scene, updateData);
    scene.updateTime = new Date().toISOString();

    return {
      success: true,
      data: scene,
      message: '场景更新成功'
    };
  }

  /**
   * 获取场景对能耗的影响分析
   * @param {string} sceneId - 场景ID
   * @returns {Object} 影响分析
   */
  getSceneEnergyImpact(sceneId) {
    const scene = this.sceneMode.find(s => s.id === sceneId);
    if (!scene) {
      return { success: false, message: '场景不存在' };
    }

    const impact = this.sceneModeModel.getSceneDeviceImpact(sceneId);

    return {
      success: true,
      data: {
        sceneId,
        sceneName: scene.name,
        estimatedEnergyChange: impact ? impact.estimatedEnergyChange : 0,
        affectedDevices: impact ? impact.affectedDevices : 0,
        executionTime: impact ? impact.executionTime : 30,
        costImpact: (impact ? impact.estimatedEnergyChange : 0) * 0.65, // 假设电价0.65元/kWh
        carbonImpact: (impact ? impact.estimatedEnergyChange : 0) * 0.785 // 碳排放系数
      }
    };
  }

  /**
   * 批量获取设备状态
   * @param {Array} deviceIds - 设备ID列表
   * @returns {Object} 设备状态列表
   */
  getDevicesByIds(deviceIds) {
    const devices = this.devices.filter(device => deviceIds.includes(device.id));

    return {
      success: true,
      data: devices.map(device => ({
        id: device.id,
        name: device.name,
        status: device.status,
        isOn: device.isOn,
        currentPower: device.currentPower || 0,
        lastUpdateTime: new Date().toISOString()
      }))
    };
  }

  // ==================== 节能方案 ====================

  /**
   * 获取节能方案
   * @returns {Object} 节能方案
   */
  getSavingPlans() {
    return {
      success: true,
      data: {
        plans: this.savingPlans,
        achievements: {
          totalSaved: 2580.5, // kWh
          costSaved: 1677.33, // 元
          carbonReduced: 1.29 // 吨CO2
        },
        tips: [
          '合理设置空调温度，夏季26°C，冬季20°C',
          '及时关闭不必要的照明设备',
          '定期维护设备，保持最佳运行状态',
          '利用自然光，减少人工照明时间'
        ]
      }
    };
  }

  // ==================== 数据初始化方法 ====================

  initUsers() {
    this.users = [
      {
        id: '001',
        phone: '13800138001',
        nickname: '能源管理员',
        avatar: '/images/default-avatar.svg',
        role: 'admin',
        company: '智慧科技有限公司',
        department: '能源管理部',
        permissions: ['device_control', 'data_view', 'user_manage', 'system_config']
      },
      {
        id: '002',
        phone: '13800138002',
        nickname: '设备操作员',
        avatar: '/images/default-avatar.svg',
        role: 'user',
        company: '智慧科技有限公司',
        department: '生产部',
        permissions: ['device_control', 'data_view']
      },
      {
        id: '003',
        phone: '13800138003',
        nickname: '数据分析师',
        avatar: '/images/default-avatar.png',
        role: 'user',
        company: '智慧科技有限公司',
        department: '技术部',
        permissions: ['data_view']
      }
    ];
  }

  initDevices() {
    this.devices = [
      // 电力设备
      {
        id: 'device_001',
        name: '生产车间空调系统',
        type: 'air_conditioner',
        category: 'electricity', // 设备类别：电力设备
        location: '生产车间A区',
        status: 'online',
        isOn: true,
        hasAlert: false,
        power: 15.5, // kW
        mode: 'cooling',
        temperature: 26,
        brand: '格力',
        model: 'GMV-120WL/A',
        healthStatus: 95, // 设备健康度百分比
        uptime: 1250, // 运行时间（小时）
        maintenanceStatus: 'normal', // 维护状态：normal, warning, required
        energyEfficiency: 'A++', // 能效等级
        lastMaintenance: '2023-12-15',
        // 完善的技术规格
        specifications: {
          ratedPower: 18.0, // 额定功率 kW
          ratedVoltage: 380, // 额定电压 V
          ratedCurrent: 27.3, // 额定电流 A
          coolingCapacity: 120, // 制冷量 kW
          heatingCapacity: 135, // 制热量 kW
          refrigerant: 'R410A', // 制冷剂类型
          airFlow: 20000, // 风量 m³/h
          noiseLevel: 58, // 噪音等级 dB
          dimensions: '1200×800×1600', // 尺寸 mm
          weight: 280, // 重量 kg
          operatingTempRange: '-15~50', // 工作温度范围 °C
          protectionLevel: 'IP54' // 防护等级
        },
        // 运行参数
        operatingParams: {
          setTemperature: 26, // 设定温度 °C
          actualTemperature: 25.8, // 实际温度 °C
          humidity: 55, // 湿度 %
          fanSpeed: 'auto', // 风速档位
          compressorStatus: 'running', // 压缩机状态
          defrostMode: false, // 除霜模式
          filterStatus: 'clean', // 滤网状态
          energyConsumption: 12.8 // 当前能耗 kW
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-03-15',
          maintenanceInterval: 90, // 维护间隔天数
          lastMaintenanceType: 'routine', // 上次维护类型
          warrantyExpiry: '2025-06-30',
          serviceProvider: '格力售后服务中心',
          maintenanceHistory: [
            { date: '2023-12-15', type: 'routine', description: '常规保养，清洁滤网' },
            { date: '2023-09-15', type: 'repair', description: '更换温度传感器' }
          ]
        }
      },
      {
        id: 'device_002',
        name: '办公区照明系统',
        type: 'lighting',
        category: 'electricity',
        location: '办公楼2层',
        status: 'offline',
        isOn: false,
        hasAlert: false,
        power: 8.2,
        brightness: 80,
        brand: '飞利浦',
        model: 'LED-Panel-600x600',
        healthStatus: 98,
        uptime: 2150,
        maintenanceStatus: 'normal',
        energyEfficiency: 'A+',
        lastMaintenance: '2023-11-20',
        // 完善的技术规格
        specifications: {
          ratedPower: 36, // 额定功率 W
          ratedVoltage: 220, // 额定电压 V
          ratedCurrent: 0.16, // 额定电流 A
          luminousFlux: 3600, // 光通量 lm
          colorTemperature: 4000, // 色温 K
          colorRenderingIndex: 80, // 显色指数
          beamAngle: 120, // 光束角度 °
          lifespan: 50000, // 使用寿命 h
          dimensions: '600×600×12', // 尺寸 mm
          weight: 2.8, // 重量 kg
          operatingTempRange: '-20~40', // 工作温度范围 °C
          protectionLevel: 'IP40' // 防护等级
        },
        // 运行参数
        operatingParams: {
          currentBrightness: 80, // 当前亮度 %
          dimmerLevel: 80, // 调光等级 %
          lightSensorValue: 450, // 光感值 lux
          motionDetected: false, // 人体感应
          autoMode: true, // 自动模式
          scheduledOn: '08:00', // 定时开启
          scheduledOff: '18:00', // 定时关闭
          energyConsumption: 7.8 // 当前能耗 W
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-05-20',
          maintenanceInterval: 180, // 维护间隔天数
          lastMaintenanceType: 'inspection', // 上次维护类型
          warrantyExpiry: '2026-11-20',
          serviceProvider: '飞利浦照明服务',
          maintenanceHistory: [
            { date: '2023-11-20', type: 'inspection', description: '灯具检查，清洁灯罩' },
            { date: '2023-05-20', type: 'routine', description: '定期检查，测试调光功能' }
          ]
        }
      },
      {
        id: 'device_003',
        name: '电力配电柜',
        type: 'power_distribution',
        category: 'electricity',
        location: '配电室',
        status: 'online',
        isOn: true,
        hasAlert: true,
        power: 120.5,
        voltage: 380,
        current: 315,
        brand: 'ABB',
        model: 'MNS-iS',
        healthStatus: 88,
        uptime: 7650,
        maintenanceStatus: 'warning',
        energyEfficiency: 'B',
        lastMaintenance: '2023-09-10',
        // 完善的技术规格
        specifications: {
          ratedVoltage: 380, // 额定电压 V
          ratedCurrent: 400, // 额定电流 A
          ratedFrequency: 50, // 额定频率 Hz
          shortCircuitCapacity: 50, // 短路容量 kA
          busbarMaterial: '铜排', // 母排材质
          switchType: '真空断路器', // 开关类型
          protectionLevel: 'IP54', // 防护等级
          dimensions: '2200×800×600', // 尺寸 mm
          weight: 850, // 重量 kg
          operatingTempRange: '-5~40', // 工作温度范围 °C
          altitude: 2000, // 使用海拔 m
          insulationLevel: 'AC-3' // 绝缘等级
        },
        // 运行参数
        operatingParams: {
          loadRate: 78.8, // 负载率 %
          powerFactor: 0.92, // 功率因数
          frequency: 49.98, // 频率 Hz
          threePhaseBalance: 98.5, // 三相平衡度 %
          harmonicDistortion: 3.2, // 谐波畸变率 %
          temperature: 35, // 柜内温度 °C
          humidity: 45, // 柜内湿度 %
          vibration: 0.2, // 振动值 mm/s
          switchOperations: 1250 // 开关操作次数
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-03-10',
          maintenanceInterval: 180, // 维护间隔天数
          lastMaintenanceType: 'inspection', // 上次维护类型
          warrantyExpiry: '2025-09-10',
          serviceProvider: 'ABB电气服务',
          maintenanceHistory: [
            { date: '2023-09-10', type: 'inspection', description: '电气检查，紧固连接' },
            { date: '2023-03-10', type: 'calibration', description: '保护装置校验' }
          ]
        },
        alerts: [
          {
            id: 'alert_e001',
            message: '电流波动异常',
            content: '检测到配电柜电流波动超出正常范围',
            time: (() => {
              const now = new Date();
              const maxDays = 20;
              const randomDays = Math.floor(Math.random() * maxDays);
              const randomHours = Math.floor(Math.random() * 24);
              const randomMinutes = Math.floor(Math.random() * 60);

              const date = new Date(now);
              date.setDate(date.getDate() - randomDays);
              date.setHours(date.getHours() - randomHours);
              date.setMinutes(date.getMinutes() - randomMinutes);

              return date.toISOString();
            })(),
            severity: 'warning',
            status: 'unread'
          }
        ]
      },
      {
        id: 'device_004',
        name: '智能电表',
        type: 'smart_meter',
        category: 'electricity',
        location: '配电房',
        status: 'online',
        isOn: true,
        hasAlert: false,
        power: 0,
        voltage: 220,
        current: 0,
        brand: '华立',
        model: 'DDS102-1',
        healthStatus: 92,
        uptime: 8760, // 一年的小时数
        maintenanceStatus: 'normal',
        lastMaintenance: '2023-10-05',
        // 完善的技术规格
        specifications: {
          ratedVoltage: 220, // 额定电压 V
          ratedCurrent: 60, // 额定电流 A
          ratedFrequency: 50, // 额定频率 Hz
          accuracy: 'Class 1', // 精度等级
          pulseConstant: 1600, // 脉冲常数 imp/kWh
          displayType: 'LCD', // 显示类型
          communicationType: 'RS485/载波', // 通信方式
          dataStorage: 12, // 数据存储月数
          protectionLevel: 'IP54', // 防护等级
          dimensions: '180×280×75', // 尺寸 mm
          weight: 1.5, // 重量 kg
          operatingTempRange: '-25~60', // 工作温度范围 °C
          certificationStandard: 'GB/T 17215.321' // 认证标准
        },
        // 运行参数
        operatingParams: {
          totalEnergy: 125680, // 总电量 kWh
          peakEnergy: 45230, // 峰时电量 kWh
          valleyEnergy: 38450, // 谷时电量 kWh
          flatEnergy: 42000, // 平时电量 kWh
          maxDemand: 85.5, // 最大需量 kW
          powerFactor: 0.95, // 功率因数
          frequency: 50.02, // 频率 Hz
          phaseSequence: 'positive', // 相序
          voltageUnbalance: 1.2, // 电压不平衡度 %
          currentUnbalance: 0.8, // 电流不平衡度 %
          lastReadingTime: '2024-01-15T00:00:00Z' // 最后抄表时间
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-04-05',
          maintenanceInterval: 180, // 维护间隔天数
          lastMaintenanceType: 'calibration', // 上次维护类型
          warrantyExpiry: '2025-10-05',
          serviceProvider: '华立科技服务',
          maintenanceHistory: [
            { date: '2023-10-05', type: 'calibration', description: '计量校准，通信测试' },
            { date: '2023-04-05', type: 'inspection', description: '设备检查，数据核对' }
          ]
        }
      },
      {
        id: 'device_005',
        name: '光伏逆变器',
        type: 'solar_inverter',
        category: 'electricity',
        location: '屋顶',
        status: 'offline',
        isOn: false,
        hasAlert: true,
        power: 0,
        voltage: 0,
        current: 0,
        brand: '华为',
        model: 'SUN2000-20KTL',
        healthStatus: 60,
        uptime: 5840,
        maintenanceStatus: 'required',
        energyEfficiency: 'A',
        lastMaintenance: '2023-08-15',
        alerts: [
          {
            id: 'alert_e002',
            message: '设备离线',
            content: '光伏逆变器通信中断，请检查网络连接',
            time: (() => {
              const now = new Date();
              const maxDays = 20;
              const randomDays = Math.floor(Math.random() * maxDays);
              const randomHours = Math.floor(Math.random() * 24);
              const randomMinutes = Math.floor(Math.random() * 60);

              const date = new Date(now);
              date.setDate(date.getDate() - randomDays);
              date.setHours(date.getHours() - randomHours);
              date.setMinutes(date.getMinutes() - randomMinutes);

              return date.toISOString();
            })(),
            severity: 'critical',
            status: 'unread'
          }
        ]
      },

      // 水资源设备
      {
        id: 'device_006',
        name: '智能水表',
        type: 'water_meter',
        category: 'water',
        location: '供水入口',
        status: 'online',
        isOn: true,
        hasAlert: false,
        flowRate: 25.8, // m³/h
        totalFlow: 12580, // m³
        pressure: 0.4, // MPa
        brand: '三川智慧',
        model: 'NB-IoT-20',
        healthStatus: 96,
        uptime: 6500,
        maintenanceStatus: 'normal',
        lastMaintenance: '2023-11-15',
        // 完善的技术规格
        specifications: {
          nominalDiameter: 50, // 公称直径 mm
          maxFlowRate: 40, // 最大流量 m³/h
          minFlowRate: 0.4, // 最小流量 m³/h
          workingPressure: 1.6, // 工作压力 MPa
          accuracy: 'Class 2', // 精度等级
          temperatureRange: '0~50', // 测量温度范围 °C
          communicationType: 'NB-IoT', // 通信方式
          batteryLife: 6, // 电池寿命 年
          protectionLevel: 'IP68', // 防护等级
          dimensions: '260×190×160', // 尺寸 mm
          weight: 4.5, // 重量 kg
          installationType: '水平安装', // 安装方式
          materialBody: '球墨铸铁' // 表体材质
        },
        // 运行参数
        operatingParams: {
          instantFlow: 25.8, // 瞬时流量 m³/h
          cumulativeFlow: 12580, // 累计流量 m³
          waterPressure: 0.42, // 水压 MPa
          waterTemperature: 18, // 水温 °C
          signalStrength: -85, // 信号强度 dBm
          batteryLevel: 85, // 电池电量 %
          dataUploadInterval: 60, // 数据上传间隔 分钟
          valveStatus: 'open', // 阀门状态
          leakageDetection: false // 漏水检测
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-05-15',
          maintenanceInterval: 180, // 维护间隔天数
          lastMaintenanceType: 'calibration', // 上次维护类型
          warrantyExpiry: '2026-11-15',
          serviceProvider: '三川智慧水务',
          maintenanceHistory: [
            { date: '2023-11-15', type: 'calibration', description: '流量计校准，数据核对' },
            { date: '2023-05-15', type: 'inspection', description: '设备检查，清洁滤网' }
          ]
        }
      },
      {
        id: 'device_007',
        name: '热水器系统',
        type: 'water_heater',
        category: 'water',
        location: '员工宿舍',
        status: 'offline',
        isOn: false,
        hasAlert: true,
        power: 12.0,
        temperature: 55,
        waterFlow: 0.8, // L/min
        brand: '美的',
        model: 'F60-21WB1',
        healthStatus: 75,
        uptime: 980,
        maintenanceStatus: 'warning',
        energyEfficiency: 'B+',
        lastMaintenance: '2023-12-01',
        alerts: [
          {
            id: 'alert_w001',
            message: '能耗异常',
            content: '热水器系统能耗超出正常范围20%',
            time: (() => {
              const now = new Date();
              const maxDays = 20;
              const randomDays = Math.floor(Math.random() * maxDays);
              const randomHours = Math.floor(Math.random() * 24);
              const randomMinutes = Math.floor(Math.random() * 60);

              const date = new Date(now);
              date.setDate(date.getDate() - randomDays);
              date.setHours(date.getHours() - randomHours);
              date.setMinutes(date.getMinutes() - randomMinutes);

              return date.toISOString();
            })(),
            severity: 'warning',
            status: 'unread'
          }
        ]
      },
      {
        id: 'device_008',
        name: '废水处理系统',
        type: 'water_treatment',
        category: 'water',
        location: '环保处理区',
        status: 'online',
        isOn: true,
        hasAlert: false,
        power: 25.5,
        flowRate: 50, // m³/h
        waterQuality: 'good', // 水质状态
        brand: '威立雅',
        model: 'WTP-500',
        healthStatus: 82,
        uptime: 5200,
        maintenanceStatus: 'normal',
        lastMaintenance: '2023-10-20'
      },
      {
        id: 'device_009',
        name: '冷却水循环系统',
        type: 'cooling_water',
        category: 'water',
        location: '冷却塔',
        status: 'alarm',
        isOn: true,
        hasAlert: true,
        power: 18.5,
        flowRate: 85, // m³/h
        temperature: 38, // 温度过高
        pressure: 0.35, // MPa
        brand: '开利',
        model: 'CW-2000',
        healthStatus: 68,
        uptime: 4200,
        maintenanceStatus: 'required',
        lastMaintenance: '2023-09-05',
        alerts: [
          {
            id: 'alert_w002',
            message: '水温过高',
            content: '冷却水温度达到38°C，超出正常范围',
            time: (() => {
              const now = new Date();
              const maxDays = 20;
              const randomDays = Math.floor(Math.random() * maxDays);
              const randomHours = Math.floor(Math.random() * 24);
              const randomMinutes = Math.floor(Math.random() * 60);

              const date = new Date(now);
              date.setDate(date.getDate() - randomDays);
              date.setHours(date.getHours() - randomHours);
              date.setMinutes(date.getMinutes() - randomMinutes);

              return date.toISOString();
            })(),
            severity: 'critical',
            status: 'unread'
          }
        ]
      },
      {
        id: 'device_010',
        name: '太阳能热水系统',
        type: 'solar_water_heater',
        category: 'water',
        location: '宿舍楼顶',
        status: 'online', // 修复为在线状态
        isOn: true,
        hasAlert: false, // 修复告警状态
        power: 2.5, // 太阳能系统正常运行功率
        temperature: 65, // 正常水温范围
        waterFlow: 8.5, // L/min 正常流量
        brand: '力诺瑞特',
        model: 'SWH-300',
        healthStatus: 92, // 提升健康度
        uptime: 3650,
        maintenanceStatus: 'normal', // 改为正常状态
        energyEfficiency: 'A+',
        lastMaintenance: '2024-01-15', // 更新维护时间
        // 移除告警数据，表示设备已修复
        alerts: [],
        // 添加设备健康度详细信息
        healthDetails: {
          operationalScore: 95, // 运行状态得分
          maintenanceScore: 90, // 维护状态得分
          performanceScore: 88, // 性能得分
          reliabilityScore: 94, // 可靠性得分
          lastHealthCheck: '2024-01-15T10:30:00Z',
          healthTrend: 'improving' // improving, stable, declining
        },
        // 完善的技术规格
        specifications: {
          collectorArea: 3.0, // 集热器面积 m²
          tankCapacity: 300, // 水箱容量 L
          maxTemperature: 95, // 最高工作温度 °C
          workingPressure: 0.6, // 工作压力 MPa
          heatExchangerType: '盘管式', // 换热器类型
          insulationMaterial: '聚氨酯发泡', // 保温材料
          collectorType: '真空管集热器', // 集热器类型
          protectionLevel: 'IP65', // 防护等级
          dimensions: '2000×1500×2200', // 尺寸 mm
          weight: 180, // 重量 kg
          operatingTempRange: '-30~95', // 工作温度范围 °C
          antiFreezingTemp: -25 // 防冻温度 °C
        },
        // 运行参数
        operatingParams: {
          waterTemperature: 65, // 水温 °C
          ambientTemperature: 22, // 环境温度 °C
          solarRadiation: 850, // 太阳辐射 W/m²
          collectorEfficiency: 88, // 集热器效率 %
          heatGain: 12.5, // 热量获得 kW
          waterFlow: 8.5, // 水流量 L/min
          systemPressure: 0.45, // 系统压力 MPa
          pumpStatus: 'auto', // 循环泵状态
          valvePosition: 'open', // 阀门位置
          frostProtection: false, // 防冻保护状态
          operatingHours: 3650 // 运行小时数
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-07-15',
          maintenanceInterval: 180, // 维护间隔天数
          lastMaintenanceType: 'comprehensive', // 上次维护类型
          warrantyExpiry: '2026-11-10',
          serviceProvider: '力诺瑞特售后服务',
          maintenanceHistory: [
            { date: '2024-01-15', type: 'comprehensive', description: '全面检查，清洁集热器，更换密封件' },
            { date: '2023-07-15', type: 'routine', description: '常规保养，检查管路和阀门' }
          ]
        }
      },
      {
        id: 'device_011',
        name: '净水处理系统',
        type: 'water_treatment',
        category: 'water',
        location: '净水车间',
        status: 'online',
        isOn: true,
        hasAlert: false,
        power: 32.5,
        flowRate: 120, // m³/h
        waterQuality: 'excellent',
        brand: '海德能',
        model: 'RO-5000',
        healthStatus: 92,
        uptime: 6800,
        maintenanceStatus: 'normal',
        lastMaintenance: '2023-11-25',
        specifications: {
          treatmentCapacity: 5000, // 处理能力 m³/d
          recoveryRate: 75, // 回收率 %
          membraneType: 'RO反渗透膜',
          filterStages: 5,
          operatingPressure: 1.5, // 工作压力 MPa
          powerConsumption: 35, // 功耗 kW
          dimensions: '6000×2000×2500', // 尺寸 mm
          weight: 3500 // 重量 kg
        }
      },
      {
        id: 'device_012',
        name: '循环水处理站',
        type: 'cooling_water',
        category: 'water',
        location: '循环水站',
        status: 'online',
        isOn: true,
        hasAlert: false,
        power: 45.8,
        flowRate: 200, // m³/h
        temperature: 32,
        pressure: 0.4, // MPa
        brand: '蓝星',
        model: 'CWT-8000',
        healthStatus: 89,
        uptime: 5200,
        maintenanceStatus: 'normal',
        lastMaintenance: '2023-10-15',
        specifications: {
          circulationCapacity: 8000, // 循环量 m³/h
          coolingCapacity: 2000, // 冷却能力 kW
          temperatureRange: '25~45', // 温度范围 °C
          chemicalDosing: '自动加药',
          filterType: '砂滤+活性炭',
          pumpPower: 50, // 泵功率 kW
          dimensions: '8000×4000×3000', // 尺寸 mm
          weight: 12000 // 重量 kg
        }
      },
      {
        id: 'device_013',
        name: '污水预处理系统',
        type: 'water_treatment',
        category: 'water',
        location: '污水处理区',
        status: 'online',
        isOn: true,
        hasAlert: false,
        power: 28.3,
        flowRate: 80, // m³/h
        waterQuality: 'good',
        brand: '碧水源',
        model: 'MBR-3000',
        healthStatus: 85,
        uptime: 4100,
        maintenanceStatus: 'normal',
        lastMaintenance: '2023-12-05',
        specifications: {
          treatmentCapacity: 3000, // 处理能力 m³/d
          treatmentProcess: 'MBR膜生物反应器',
          membraneArea: 500, // 膜面积 m²
          sludgeAge: 25, // 污泥龄 天
          efficiencyBOD: 95, // BOD去除率 %
          efficiencyCOD: 90, // COD去除率 %
          dimensions: '10000×6000×4000', // 尺寸 mm
          weight: 15000 // 重量 kg
        }
      },

      // 燃气设备
      {
        id: 'device_014',
        name: '智能燃气表',
        type: 'gas_meter',
        category: 'gas',
        location: '燃气站',
        status: 'online',
        isOn: true,
        hasAlert: false,
        flowRate: 15.2, // m³/h
        totalFlow: 8560, // m³
        pressure: 0.02, // MPa
        brand: '金卡',
        model: 'G4-NB',
        healthStatus: 94,
        uptime: 7300,
        maintenanceStatus: 'normal',
        lastMaintenance: '2023-12-10',
        // 完善的技术规格
        specifications: {
          nominalSize: 'G4', // 公称尺寸
          maxFlowRate: 6, // 最大流量 m³/h
          minFlowRate: 0.04, // 最小流量 m³/h
          workingPressure: 0.05, // 工作压力 MPa
          accuracy: 'Class 1.5', // 精度等级
          temperatureRange: '-10~60', // 测量温度范围 °C
          communicationType: 'NB-IoT', // 通信方式
          batteryLife: 8, // 电池寿命 年
          valveType: '内置球阀', // 阀门类型
          protectionLevel: 'IP65', // 防护等级
          dimensions: '220×165×110', // 尺寸 mm
          weight: 2.8, // 重量 kg
          installationType: '螺纹连接', // 安装方式
          materialBody: '铝合金' // 表体材质
        },
        // 运行参数
        operatingParams: {
          instantFlow: 15.2, // 瞬时流量 m³/h
          cumulativeFlow: 8560, // 累计流量 m³
          gasPressure: 0.022, // 燃气压力 MPa
          gasTemperature: 22, // 燃气温度 °C
          signalStrength: -78, // 信号强度 dBm
          batteryLevel: 88, // 电池电量 %
          dataUploadInterval: 120, // 数据上传间隔 分钟
          valveStatus: 'open', // 阀门状态
          leakageDetection: false, // 漏气检测
          tamperDetection: false, // 防拆检测
          magneticInterference: false // 磁干扰检测
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-06-10',
          maintenanceInterval: 180, // 维护间隔天数
          lastMaintenanceType: 'inspection', // 上次维护类型
          warrantyExpiry: '2026-12-10',
          serviceProvider: '金卡智能燃气',
          maintenanceHistory: [
            { date: '2023-12-10', type: 'inspection', description: '设备检查，阀门测试' },
            { date: '2023-06-10', type: 'calibration', description: '流量计校准，通信测试' }
          ]
        }
      },
      {
        id: 'device_015',
        name: '燃气锅炉',
        type: 'gas_boiler',
        category: 'gas',
        location: '锅炉房',
        status: 'online', // 修复为在线状态
        isOn: true,
        hasAlert: false, // 修复告警状态
        power: 75.0, // 降低功率到正常范围
        temperature: 78, // 降低温度到正常范围
        pressure: 0.5, // MPa 正常压力
        gasConsumption: 9.8, // m³/h 正常消耗
        brand: '博世',
        model: 'UT-L 50',
        healthStatus: 88, // 提升健康度
        uptime: 6500,
        maintenanceStatus: 'normal', // 改为正常状态
        energyEfficiency: 'A', // 提升能效等级
        lastMaintenance: '2024-01-10', // 更新维护时间
        // 完善的技术规格
        specifications: {
          ratedPower: 100, // 额定功率 kW
          ratedPressure: 0.8, // 额定压力 MPa
          maxTemperature: 85, // 最高工作温度 °C
          gasType: '天然气', // 燃气类型
          gasConsumptionRate: 10.5, // 额定燃气消耗 m³/h
          efficiency: 92, // 热效率 %
          waterCapacity: 50, // 水容量 L
          heatExchangerType: '板式换热器', // 换热器类型
          burnerType: '全预混燃烧器', // 燃烧器类型
          protectionLevel: 'IP44', // 防护等级
          dimensions: '800×600×1200', // 尺寸 mm
          weight: 180, // 重量 kg
          operatingTempRange: '5~85', // 工作温度范围 °C
          emissionStandard: 'NOx Class 5' // 排放标准
        },
        // 运行参数
        operatingParams: {
          outletTemperature: 78, // 出水温度 °C 降低到正常范围
          inletTemperature: 65, // 进水温度 °C
          waterPressure: 0.5, // 水压 MPa 正常压力
          gasPressure: 0.02, // 燃气压力 MPa
          flameStatus: 'burning', // 火焰状态
          pumpStatus: 'running', // 循环泵状态
          fanStatus: 'running', // 风机状态
          exhaustTemperature: 95, // 排烟温度 °C 降低到正常范围
          oxygenContent: 9.2, // 烟气含氧量 % 优化燃烧
          carbonMonoxide: 8, // 一氧化碳浓度 ppm 降低到安全范围
          operatingHours: 6500 // 运行小时数
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-07-10',
          maintenanceInterval: 180, // 维护间隔天数 延长到6个月
          lastMaintenanceType: 'comprehensive', // 上次维护类型
          warrantyExpiry: '2025-08-20',
          serviceProvider: '博世热力技术服务',
          maintenanceHistory: [
            { date: '2024-01-10', type: 'comprehensive', description: '全面检修，更换燃烧器部件，清洁换热器，调试控制系统' },
            { date: '2023-08-20', type: 'repair', description: '更换燃烧器部件，清洁换热器' },
            { date: '2023-05-20', type: 'inspection', description: '安全检查，调试燃烧参数' }
          ]
        },
        // 移除告警数据，表示设备已修复
        alerts: [],
        // 添加设备健康度详细信息
        healthDetails: {
          operationalScore: 90, // 运行状态得分
          maintenanceScore: 88, // 维护状态得分
          performanceScore: 85, // 性能得分
          reliabilityScore: 89, // 可靠性得分
          lastHealthCheck: '2024-01-10T14:30:00Z',
          healthTrend: 'improving' // improving, stable, declining
        }
      },
      {
        id: 'device_016',
        name: '燃气泄漏检测器',
        type: 'gas_detector',
        category: 'gas',
        location: '燃气管道区',
        status: 'online',
        isOn: true,
        hasAlert: false, // 修复告警状态
        power: 0.2,
        gasConcentration: 0.15, // 降低到安全范围
        brand: '霍尼韦尔',
        model: 'GD-2000',
        healthStatus: 95, // 提升健康度
        uptime: 4500,
        maintenanceStatus: 'normal', // 改为正常状态
        lastMaintenance: '2024-01-08', // 更新维护时间
        // 移除告警数据，表示设备已修复
        alerts: [],
        // 添加设备健康度详细信息
        healthDetails: {
          operationalScore: 96, // 运行状态得分
          maintenanceScore: 94, // 维护状态得分
          performanceScore: 95, // 性能得分
          reliabilityScore: 95, // 可靠性得分
          lastHealthCheck: '2024-01-08T09:15:00Z',
          healthTrend: 'stable' // improving, stable, declining
        },
        // 完善的技术规格
        specifications: {
          detectionRange: '0-100%LEL', // 检测范围
          detectionPrinciple: '催化燃烧式', // 检测原理
          responseTime: 30, // 响应时间 秒
          accuracy: '±3%FS', // 精度
          alarmThreshold: '25%LEL', // 报警阈值
          operatingTemp: '-40~70', // 工作温度范围 °C
          operatingHumidity: '0~95%RH', // 工作湿度范围
          powerConsumption: 0.2, // 功耗 W
          protectionLevel: 'IP65', // 防护等级
          dimensions: '120×80×45', // 尺寸 mm
          weight: 0.3, // 重量 kg
          communicationType: '4-20mA', // 通信方式
          certifications: ['Ex', 'CE', 'ATEX'] // 认证标准
        },
        // 运行参数
        operatingParams: {
          currentConcentration: 0.15, // 当前浓度 %LEL
          ambientTemperature: 22, // 环境温度 °C
          ambientHumidity: 45, // 环境湿度 %RH
          sensorStatus: 'normal', // 传感器状态
          calibrationDate: '2024-01-08', // 校准日期
          driftValue: 0.02, // 漂移值 %LEL
          signalOutput: 4.6, // 信号输出 mA
          alarmStatus: 'normal', // 报警状态
          faultStatus: 'none', // 故障状态
          operatingHours: 4500 // 运行小时数
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-07-08',
          maintenanceInterval: 180, // 维护间隔天数
          lastMaintenanceType: 'calibration', // 上次维护类型
          warrantyExpiry: '2025-10-15',
          serviceProvider: '霍尼韦尔安全系统',
          maintenanceHistory: [
            { date: '2024-01-08', type: 'calibration', description: '传感器校准，清洁检测头，功能测试' },
            { date: '2023-07-08', type: 'routine', description: '常规检查，清洁外壳，检查接线' }
          ]
        }
      },

      // 其他设备
      {
        id: 'device_017',
        name: '生产线电机',
        type: 'motor',
        category: 'electricity',
        location: '生产车间B区',
        status: 'offline',
        isOn: false,
        hasAlert: false,
        power: 22.8,
        speed: 1750, // RPM
        temperature: 48,
        brand: '西门子',
        model: 'SIMOTICS SD',
        healthStatus: 88,
        uptime: 3250,
        maintenanceStatus: 'normal',
        energyEfficiency: 'A',
        lastMaintenance: '2023-11-25',
        // 完善的技术规格
        specifications: {
          ratedPower: 30, // 额定功率 kW
          ratedVoltage: 380, // 额定电压 V
          ratedCurrent: 57, // 额定电流 A
          ratedSpeed: 1750, // 额定转速 RPM
          ratedTorque: 164, // 额定转矩 Nm
          motorType: '三相异步电机', // 电机类型
          insulationClass: 'F', // 绝缘等级
          protectionLevel: 'IP55', // 防护等级
          coolingMethod: 'IC411', // 冷却方式
          bearingType: '滚动轴承', // 轴承类型
          dimensions: '315×200×200', // 尺寸 mm
          weight: 85, // 重量 kg
          operatingTempRange: '-20~40', // 工作温度范围 °C
          vibrationLevel: 'A' // 振动等级
        },
        // 运行参数
        operatingParams: {
          actualSpeed: 1748, // 实际转速 RPM
          actualTorque: 125, // 实际转矩 Nm
          motorTemperature: 48, // 电机温度 °C
          bearingTemperature: 42, // 轴承温度 °C
          vibrationValue: 1.8, // 振动值 mm/s
          loadRate: 76, // 负载率 %
          efficiency: 94.2, // 运行效率 %
          powerFactor: 0.89, // 功率因数
          startupCount: 1250, // 启动次数
          runningHours: 3250 // 运行小时数
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-05-25',
          maintenanceInterval: 180, // 维护间隔天数
          lastMaintenanceType: 'routine', // 上次维护类型
          warrantyExpiry: '2025-11-25',
          serviceProvider: '西门子工业服务',
          maintenanceHistory: [
            { date: '2023-11-25', type: 'routine', description: '润滑保养，轴承检查' },
            { date: '2023-05-25', type: 'inspection', description: '绝缘测试，振动检测' }
          ]
        }
      },
      {
        id: 'device_018',
        name: '压缩空气系统',
        type: 'air_compressor',
        category: 'electricity',
        location: '动力车间',
        status: 'online', // 修复为在线状态
        isOn: true, // 修复为开启状态
        hasAlert: false, // 修复告警状态
        power: 68.5, // 恢复正常功率
        pressure: 0.8, // MPa 正常压力
        brand: '阿特拉斯',
        model: 'GA75',
        healthStatus: 89, // 提升健康度
        uptime: 12500,
        maintenanceStatus: 'normal', // 改为正常状态
        energyEfficiency: 'A', // 提升能效等级
        lastMaintenance: '2024-01-12', // 更新维护时间
        // 移除告警数据，表示设备已修复
        alerts: [],
        // 添加设备健康度详细信息
        healthDetails: {
          operationalScore: 91, // 运行状态得分
          maintenanceScore: 88, // 维护状态得分
          performanceScore: 87, // 性能得分
          reliabilityScore: 90, // 可靠性得分
          lastHealthCheck: '2024-01-12T16:45:00Z',
          healthTrend: 'improving' // improving, stable, declining
        },
        // 完善的技术规格
        specifications: {
          ratedPower: 75, // 额定功率 kW
          maxPressure: 1.0, // 最大压力 MPa
          airFlow: 12.5, // 排气量 m³/min
          compressionRatio: 8.5, // 压缩比
          coolingMethod: '风冷', // 冷却方式
          lubricationType: '喷油螺杆', // 润滑方式
          motorType: '异步电机', // 电机类型
          protectionLevel: 'IP54', // 防护等级
          dimensions: '2200×1500×1800', // 尺寸 mm
          weight: 1850, // 重量 kg
          operatingTempRange: '5~45', // 工作温度范围 °C
          noiseLevel: 68 // 噪音等级 dB(A)
        },
        // 运行参数
        operatingParams: {
          dischargePressure: 0.8, // 排气压力 MPa
          dischargeTemperature: 85, // 排气温度 °C
          oilTemperature: 75, // 油温 °C
          motorCurrent: 125, // 电机电流 A
          loadRate: 85, // 负载率 %
          vibrationLevel: 2.5, // 振动值 mm/s
          airQuality: 'ISO 8573-1 Class 1', // 空气质量等级
          filterCondition: 'good', // 过滤器状态
          oilLevel: 'normal', // 油位状态
          operatingHours: 12500 // 运行小时数
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-07-12',
          maintenanceInterval: 180, // 维护间隔天数
          lastMaintenanceType: 'comprehensive', // 上次维护类型
          warrantyExpiry: '2025-07-10',
          serviceProvider: '阿特拉斯·科普柯服务',
          maintenanceHistory: [
            { date: '2024-01-12', type: 'comprehensive', description: '全面检修，更换空滤、油滤、油分，检查压缩机本体' },
            { date: '2023-07-10', type: 'routine', description: '常规保养，更换润滑油，清洁冷却器' }
          ]
        }
      },
      {
        id: 'device_019',
        name: '环境监测站',
        type: 'environment_monitor',
        category: 'other',
        location: '厂区中心',
        status: 'online',
        isOn: true,
        hasAlert: false,
        power: 0.5,
        temperature: 25,
        humidity: 65,
        airQuality: 85, // AQI指数
        brand: '绿林',
        model: 'EM-2000',
        healthStatus: 95,
        uptime: 5200,
        maintenanceStatus: 'normal',
        lastMaintenance: '2023-12-05',
        // 完善的技术规格
        specifications: {
          temperatureRange: '-40~80', // 温度测量范围 °C
          temperatureAccuracy: '±0.3', // 温度精度 °C
          humidityRange: '0~100', // 湿度测量范围 %RH
          humidityAccuracy: '±3', // 湿度精度 %RH
          pm25Range: '0~500', // PM2.5测量范围 μg/m³
          pm10Range: '0~1000', // PM10测量范围 μg/m³
          co2Range: '0~5000', // CO2测量范围 ppm
          noiseRange: '30~130', // 噪音测量范围 dB
          windSpeedRange: '0~60', // 风速测量范围 m/s
          communicationType: '4G/WiFi', // 通信方式
          powerSupply: '太阳能+锂电池', // 供电方式
          protectionLevel: 'IP65', // 防护等级
          dimensions: '600×400×300', // 尺寸 mm
          weight: 15, // 重量 kg
          operatingTempRange: '-30~70' // 工作温度范围 °C
        },
        // 运行参数
        operatingParams: {
          ambientTemperature: 25.2, // 环境温度 °C
          relativeHumidity: 65, // 相对湿度 %
          pm25Concentration: 35, // PM2.5浓度 μg/m³
          pm10Concentration: 58, // PM10浓度 μg/m³
          co2Concentration: 420, // CO2浓度 ppm
          noiseLevel: 45, // 噪音等级 dB
          windSpeed: 2.3, // 风速 m/s
          windDirection: 'NE', // 风向
          atmosphericPressure: 1013.2, // 大气压 hPa
          solarRadiation: 650, // 太阳辐射 W/m²
          batteryLevel: 92, // 电池电量 %
          dataUploadInterval: 10 // 数据上传间隔 分钟
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-06-05',
          maintenanceInterval: 180, // 维护间隔天数
          lastMaintenanceType: 'calibration', // 上次维护类型
          warrantyExpiry: '2025-12-05',
          serviceProvider: '绿林环境科技',
          maintenanceHistory: [
            { date: '2023-12-05', type: 'calibration', description: '传感器校准，数据验证' },
            { date: '2023-06-05', type: 'cleaning', description: '设备清洁，太阳能板维护' }
          ]
        }
      },
      {
        id: 'device_020',
        name: '仓库温湿度监控',
        type: 'environment_sensor',
        category: 'other',
        location: '原料仓库',
        status: 'online',
        isOn: true,
        hasAlert: true,
        power: 0.1,
        temperature: 28,
        humidity: 75, // 湿度过高
        brand: '欧姆龙',
        model: 'E5CC',
        healthStatus: 85,
        uptime: 4300,
        maintenanceStatus: 'warning',
        lastMaintenance: '2023-10-25',
        alerts: [
          {
            id: 'alert_o002',
            message: '湿度过高',
            content: '仓库湿度达到75%，超出正常范围',
            time: (() => {
              const now = new Date();
              const maxDays = 20;
              const randomDays = Math.floor(Math.random() * maxDays);
              const randomHours = Math.floor(Math.random() * 24);
              const randomMinutes = Math.floor(Math.random() * 60);

              const date = new Date(now);
              date.setDate(date.getDate() - randomDays);
              date.setHours(date.getHours() - randomHours);
              date.setMinutes(date.getMinutes() - randomMinutes);

              return date.toISOString();
            })(),
            severity: 'warning',
            status: 'unread'
          }
        ]
      },
      {
        id: 'device_021',
        name: '电动汽车充电桩',
        type: 'ev_charger',
        category: 'electricity',
        location: '停车场',
        status: 'idle',
        isOn: true,
        hasAlert: false,
        power: 0.5, // 待机功率
        maxPower: 60, // 最大充电功率
        brand: '特斯拉',
        model: 'Wall Connector',
        healthStatus: 96,
        uptime: 1850,
        maintenanceStatus: 'normal',
        energyEfficiency: 'A+',
        lastMaintenance: '2023-12-15'
      },
      {
        id: 'device_022',
        name: '数据中心UPS',
        type: 'ups',
        category: 'electricity',
        location: '机房',
        status: 'online',
        isOn: true,
        hasAlert: false,
        power: 12.8,
        batteryLevel: 95, // 电池电量百分比
        brand: 'APC',
        model: 'Smart-UPS 10000',
        healthStatus: 94,
        uptime: 8900,
        maintenanceStatus: 'normal',
        lastMaintenance: '2023-11-05',
        // 完善的技术规格
        specifications: {
          ratedPower: 10000, // 额定功率 VA
          ratedOutputPower: 8000, // 额定输出功率 W
          inputVoltage: '220/230/240V', // 输入电压范围
          outputVoltage: '220/230/240V', // 输出电压
          frequency: '50/60Hz', // 频率
          batteryType: '密封铅酸电池', // 电池类型
          batteryCapacity: 192, // 电池容量 Ah
          backupTime: 15, // 满载备用时间 分钟
          transferTime: 4, // 转换时间 ms
          efficiency: 95, // 效率 %
          protectionLevel: 'IP20', // 防护等级
          dimensions: '432×660×130', // 尺寸 mm
          weight: 68, // 重量 kg
          operatingTempRange: '0~40', // 工作温度范围 °C
          communicationType: 'USB/串口/网络' // 通信接口
        },
        // 运行参数
        operatingParams: {
          inputVoltage: 228, // 输入电压 V
          outputVoltage: 230, // 输出电压 V
          inputFrequency: 50.1, // 输入频率 Hz
          outputFrequency: 50.0, // 输出频率 Hz
          loadPercentage: 64, // 负载百分比 %
          batteryVoltage: 54.2, // 电池电压 V
          batteryTemperature: 25, // 电池温度 °C
          remainingRuntime: 23, // 剩余运行时间 分钟
          operatingMode: 'online', // 运行模式
          lastBatteryTest: '2024-01-10', // 最后电池测试日期
          totalSwitchCount: 15 // 总切换次数
        },
        // 维护信息
        maintenanceInfo: {
          nextMaintenance: '2024-05-05',
          maintenanceInterval: 180, // 维护间隔天数
          lastMaintenanceType: 'battery_test', // 上次维护类型
          warrantyExpiry: '2025-11-05',
          serviceProvider: 'APC施耐德电气',
          maintenanceHistory: [
            { date: '2023-11-05', type: 'battery_test', description: '电池测试，性能检查' },
            { date: '2023-05-05', type: 'inspection', description: '设备检查，清洁维护' }
          ]
        }
      },
      {
        id: 'device_023',
        name: '会议室智能系统',
        type: 'smart_control',
        category: 'other',
        location: '办公楼3层',
        status: 'online',
        isOn: true,
        hasAlert: false,
        power: 1.2,
        mode: 'auto',
        brand: '霍尼韦尔',
        model: 'SC-2000',
        healthStatus: 99,
        uptime: 720,
        maintenanceStatus: 'normal',
        lastMaintenance: '2024-01-05'
      }
    ];

    return this.devices;
  }

  initEnergyData() {
    this.energyData = {
      realTime: {
        electricity: 125.5,
        water: 8.2,
        gas: 15.8
      },
      history: {
        daily: this.generateDailyData(30),
        monthly: this.generateMonthlyData(12)
      }
    };
  }

  /**
   * 更新设备的告警状态
   * 根据当前告警数据更新设备的hasAlert字段
   * @param {Array} alertsData - 可选的告警数据数组，如果不提供则使用this.alerts
   */
  updateDeviceAlertStatus(alertsData) {
    // 使用提供的告警数据或默认使用this.alerts
    const alerts = alertsData || this.alerts;

    // 如果没有告警数据，直接返回
    if (!alerts) return;

    // 获取所有未解决的告警（未读、已读、已忽略，但不包括已解决）
    const activeAlerts = alerts.filter(alert => alert.status !== 'resolved');

    // 获取所有有未解决告警的设备ID
    const deviceIdsWithAlerts = new Set(activeAlerts.map(alert => alert.deviceId));

    // 更新设备的hasAlert字段
    this.devices.forEach(device => {
      device.hasAlert = deviceIdsWithAlerts.has(device.id);

      // 添加智能分析结果
      if (device.hasAlert) {
        const deviceAlerts = activeAlerts.filter(alert => alert.deviceId === device.id);
        device.alertCount = deviceAlerts.length;
        device.intelligentAnalysis = {
          riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          predictedFailure: Math.random() > 0.8,
          maintenanceRecommended: Math.random() > 0.7,
          efficiencyScore: Math.floor(Math.random() * 40) + 60, // 60-100
          rootCauseAnalysis: {
            primaryCause: ['network_issue', 'hardware_fault', 'software_error', 'environmental_factor'][Math.floor(Math.random() * 4)],
            confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
            suggestedActions: ['restart_device', 'check_connections', 'schedule_maintenance', 'replace_component']
          },
          impactAssessment: {
            energyLoss: Math.floor(Math.random() * 50) + 10, // 10-60 kWh
            costImpact: Math.floor(Math.random() * 100) + 20, // 20-120 元
            carbonImpact: Math.floor(Math.random() * 25) + 5 // 5-30 kg CO2
          }
        };
      } else {
        device.alertCount = 0;
        device.intelligentAnalysis = null;
      }
    });
  }

  initAlerts() {
    // 定义告警数据
    const now = new Date();

    // 生成随机时间，最长不超过20天
    const getRandomTime = () => {
      const maxDays = 20;
      const randomDays = Math.floor(Math.random() * maxDays);
      const randomHours = Math.floor(Math.random() * 24);
      const randomMinutes = Math.floor(Math.random() * 60);

      const date = new Date(now);
      date.setDate(date.getDate() - randomDays);
      date.setHours(date.getHours() - randomHours);
      date.setMinutes(date.getMinutes() - randomMinutes);

      return date.toISOString();
    };

    const alerts = [
      {
        id: 'alert_001',
        title: '设备离线告警',
        content: '光伏逆变器设备离线，请检查网络连接',
        description: '光伏逆变器设备已离线超过5分钟，可能影响发电效率。建议检查设备网络连接状态，确认设备电源是否正常。',
        level: 'critical', // critical, warning, info
        type: 'device_offline',
        deviceId: 'device_005',
        deviceName: '光伏逆变器',
        location: '屋顶',
        status: 'unread', // unread, read, ignored, resolved
        createTime: getRandomTime(),
        handleTime: null
      },
      {
        id: 'alert_002',
        title: '能耗异常告警',
        content: '热水器系统能耗超出正常范围20%',
        description: '热水器系统当前能耗为15.6kWh，超出正常范围20%。可能原因包括设备老化、温度设置过高或系统故障。建议检查设备运行状态。',
        level: 'warning',
        type: 'energy_abnormal',
        deviceId: 'device_003',
        deviceName: '热水器系统',
        location: '员工宿舍',
        status: 'unread',
        createTime: getRandomTime(),
        handleTime: null
      },
      {
        id: 'alert_003',
        title: '温度过高告警',
        content: '生产车间温度达到32°C，建议调整空调设置',
        description: '生产车间A区温度持续超过30°C已达15分钟，可能影响设备运行效率和员工舒适度。建议立即调整空调温度设置或检查空调系统运行状态。',
        level: 'warning',
        type: 'temperature_high',
        deviceId: 'device_001',
        deviceName: '生产车间空调系统',
        location: '生产车间A区',
        status: 'read',
        createTime: getRandomTime(),
        handleTime: getRandomTime()
      },
      {
        id: 'alert_004',
        title: '定期维护提醒',
        content: '智能电表需要进行季度维护检查',
        description: '智能电表已运行90天，根据维护计划需要进行季度检查。维护内容包括：数据校准、接线检查、清洁保养等。请联系维护人员安排检查时间。',
        level: 'info',
        type: 'maintenance_reminder',
        deviceId: 'device_004',
        deviceName: '智能电表',
        location: '配电房',
        status: 'unread',
        createTime: getRandomTime(),
        handleTime: null
      },
      {
        id: 'alert_005',
        title: '节能建议',
        content: '检测到非工作时间照明系统仍在运行，建议关闭',
        description: '办公楼2层照明系统在22:30仍处于开启状态，预计将产生不必要的能耗约2.5kWh。建议设置自动关闭时间或手动关闭以节约能源。',
        level: 'info',
        type: 'energy_saving_tip',
        deviceId: 'device_002',
        deviceName: '办公区照明系统',
        location: '办公楼2层',
        status: 'ignored',
        createTime: getRandomTime(),
        handleTime: getRandomTime()
      },
      {
        id: 'alert_006',
        title: '太阳能热水系统告警',
        content: '太阳能热水系统水温低于正常值，请检查',
        description: '太阳能热水系统当前水温为35°C，低于正常运行温度45°C。可能原因：天气阴雨、集热器故障或管路问题。建议检查系统运行状态。',
        level: 'warning',
        type: 'temperature_low',
        deviceId: 'device_010',
        deviceName: '太阳能热水系统',
        location: '宿舍楼顶',
        status: 'unread',
        createTime: getRandomTime(),
        handleTime: null
      }
    ];

    // 保存告警数据
    this.alerts = alerts;

    // 更新设备的告警状态
    this.updateDeviceAlertStatus(this.alerts);

    return this.alerts;
  }

  initAutomationRules() {
    this.automationRules = [
      // 定时类型规则
      {
        id: 'rule_001',
        name: '工作日自动照明',
        description: '工作日早8点自动开启办公区照明，晚6点自动关闭',
        enabled: true,
        trigger: {
          type: 'time',
          conditions: [
            { time: '08:00', days: [1, 2, 3, 4, 5] },
            { time: '18:00', days: [1, 2, 3, 4, 5] }
          ]
        },
        actions: [
          {
            deviceId: 'device_002',
            action: 'switch',
            params: { on: true, brightness: 80 }
          }
        ],
        createTime: '2024-01-10T10:00:00Z',
        executeCount: 15
      },
      {
        id: 'rule_002',
        name: '周末节能模式',
        description: '周末自动关闭办公区所有设备，减少待机能耗',
        enabled: true,
        trigger: {
          type: 'time',
          conditions: [
            { time: '20:00', days: [5] }, // 周五晚上
            { time: '08:00', days: [1] }  // 周一早上
          ]
        },
        actions: [
          {
            deviceId: 'device_002',
            action: 'switch',
            params: { on: false }
          },
          {
            deviceId: 'device_001',
            action: 'setParams',
            params: { mode: 'eco' }
          }
        ],
        createTime: '2024-01-12T16:45:00Z',
        executeCount: 6
      },
      {
        id: 'rule_003',
        name: '夜间安全巡检',
        description: '每晚12点自动开启安全监控系统进行巡检',
        enabled: false, // 禁用状态的规则
        trigger: {
          type: 'time',
          conditions: [
            { time: '00:00', days: [0, 1, 2, 3, 4, 5, 6] } // 每天
          ]
        },
        actions: [
          {
            deviceId: 'device_005',
            action: 'runProgram',
            params: { program: 'security_check' }
          }
        ],
        createTime: '2024-01-05T09:20:00Z',
        executeCount: 10
      },

      // 条件类型规则
      {
        id: 'rule_004',
        name: '温度自动调节',
        description: '当车间温度超过30°C时自动调低空调温度',
        enabled: true,
        trigger: {
          type: 'condition',
          conditions: [
            { deviceId: 'device_001', parameter: 'temperature', operator: '>', value: 30 }
          ]
        },
        actions: [
          {
            deviceId: 'device_001',
            action: 'setParams',
            params: { temperature: 26 }
          }
        ],
        createTime: '2024-01-08T14:30:00Z',
        executeCount: 8
      },
      {
        id: 'rule_005',
        name: '能耗超标预警',
        description: '当日能耗超过预设阈值时发送预警通知',
        enabled: true,
        trigger: {
          type: 'condition',
          conditions: [
            { deviceId: 'device_004', parameter: 'dailyEnergy', operator: '>', value: 500 }
          ]
        },
        actions: [
          {
            deviceId: 'system',
            action: 'sendNotification',
            params: { level: 'warning', message: '日能耗超标，请检查用能设备' }
          }
        ],
        createTime: '2024-01-14T11:15:00Z',
        executeCount: 3
      },
      {
        id: 'rule_006',
        name: '水量异常处理',
        description: '当检测到用水量异常增加时自动关闭主阀门并通知管理员',
        enabled: true,
        trigger: {
          type: 'condition',
          conditions: [
            { deviceId: 'device_006', parameter: 'waterFlow', operator: '>', value: 20 }
          ]
        },
        actions: [
          {
            deviceId: 'device_006',
            action: 'closeValve',
            params: { emergency: true }
          },
          {
            deviceId: 'system',
            action: 'sendNotification',
            params: { level: 'critical', message: '检测到水量异常，已自动关闭主阀门' }
          }
        ],
        createTime: '2024-01-07T08:40:00Z',
        executeCount: 1
      },

      // 场景类型规则
      {
        id: 'rule_007',
        name: '会议室智能场景',
        description: '会议开始时自动调整会议室环境，包括灯光、温度和投影仪',
        enabled: true,
        trigger: {
          type: 'scene',
          conditions: [
            { sceneId: 'scene_001', sceneName: '会议模式' }
          ]
        },
        actions: [
          {
            deviceId: 'device_007',
            action: 'setParams',
            params: { brightness: 60, color: 'warm' }
          },
          {
            deviceId: 'device_008',
            action: 'setParams',
            params: { temperature: 24 }
          },
          {
            deviceId: 'device_009',
            action: 'switch',
            params: { on: true }
          }
        ],
        createTime: '2024-01-11T13:25:00Z',
        executeCount: 12
      },
      {
        id: 'rule_008',
        name: '离开办公室场景',
        description: '最后一人离开办公室时自动关闭所有设备并开启安防系统',
        enabled: false,
        trigger: {
          type: 'scene',
          conditions: [
            { sceneId: 'scene_002', sceneName: '无人办公室' }
          ]
        },
        actions: [
          {
            deviceId: 'device_group_001',
            action: 'groupControl',
            params: { command: 'shutDown' }
          },
          {
            deviceId: 'device_010',
            action: 'setMode',
            params: { mode: 'guard' }
          }
        ],
        createTime: '2024-01-09T17:50:00Z',
        executeCount: 20
      },
      {
        id: 'rule_009',
        name: '节假日模式',
        description: '节假日期间自动启用低功耗模式并加强安防监控',
        enabled: true,
        trigger: {
          type: 'scene',
          conditions: [
            { sceneId: 'scene_003', sceneName: '节假日模式' }
          ]
        },
        actions: [
          {
            deviceId: 'system',
            action: 'setEnergyMode',
            params: { mode: 'ultraLowPower' }
          },
          {
            deviceId: 'device_010',
            action: 'setParams',
            params: { securityLevel: 'high', monitorInterval: 10 }
          }
        ],
        createTime: '2024-01-15T09:10:00Z',
        executeCount: 2
      },
      {
        id: 'rule_010',
        name: '节假日节能模式',
        description: '节假日自动关闭非必要设备',
        enabled: false,
        trigger: {
          type: 'holiday',
          conditions: []
        },
        actions: [
          {
            deviceId: 'device_002',
            action: 'switch',
            params: { on: false }
          }
        ],
        createTime: '2024-01-05T16:20:00Z',
        executeCount: 0
      }
    ];
  }

  initSceneMode() {
    this.sceneMode = [
      {
        id: 'scene_001',
        name: '工作日模式',
        description: '正常工作时间的设备运行模式',
        type: 'office', // factory, school, office
        isActive: true,
        devices: [
          { deviceId: 'device_001', settings: { on: true, temperature: 26 } },
          { deviceId: 'device_002', settings: { on: true, brightness: 80 } }
        ],
        schedule: {
          startTime: '08:00',
          endTime: '18:00',
          days: [1, 2, 3, 4, 5]
        },
        lastActiveTime: '2024-01-15T08:00:00Z'
      },
      {
        id: 'scene_002',
        name: '非工作日模式',
        description: '周末和节假日的节能运行模式',
        type: 'office',
        isActive: false,
        devices: [
          { deviceId: 'device_001', settings: { on: false } },
          { deviceId: 'device_002', settings: { on: false } }
        ],
        schedule: {
          startTime: '00:00',
          endTime: '23:59',
          days: [0, 6]
        },
        lastActiveTime: '2024-01-13T00:00:00Z'
      },
      {
        id: 'scene_003',
        name: '夜间模式',
        description: '夜间安防和应急照明模式',
        type: 'office',
        isActive: false,
        devices: [
          { deviceId: 'device_001', settings: { on: false } },
          { deviceId: 'device_002', settings: { on: true, brightness: 20 } }
        ],
        schedule: {
          startTime: '22:00',
          endTime: '06:00',
          days: [0, 1, 2, 3, 4, 5, 6]
        },
        lastActiveTime: '2024-01-14T22:00:00Z'
      }
    ];
  }

  initReports() {
    this.reports = [
      {
        id: 'report_001',
        title: '2024年1月能耗报告',
        type: 'monthly',
        period: '2024-01',
        generateTime: '2024-02-01T09:00:00Z',
        status: 'completed',
        downloadUrl: 'https://example.com/reports/202401.pdf'
      }
    ];
  }

  initSavingPlans() {
    this.savingPlans = [
      {
        id: 'plan_001',
        title: '照明系统节能优化',
        description: '通过智能调光和定时控制，预计节能15%',
        category: 'lighting',
        estimatedSaving: {
          energy: 450.5, // kWh/月
          cost: 292.83, // 元/月
          carbon: 0.225 // 吨CO2/月
        },
        implementation: {
          difficulty: 'easy',
          cost: 5000,
          paybackPeriod: 8 // 月
        },
        status: 'recommended' // recommended, implementing, completed
      },
      {
        id: 'plan_002',
        title: '空调系统智能控制',
        description: '根据人员在岗情况和环境温度智能调节',
        category: 'hvac',
        estimatedSaving: {
          energy: 680.2,
          cost: 442.13,
          carbon: 0.340
        },
        implementation: {
          difficulty: 'medium',
          cost: 12000,
          paybackPeriod: 15
        },
        status: 'implementing'
      },
      {
        id: 'plan_003',
        title: '屋顶光伏发电系统',
        description: '安装20kW光伏发电系统，自发自用',
        category: 'renewable',
        estimatedSaving: {
          energy: 2500.0,
          cost: 1625.0,
          carbon: 1.25
        },
        implementation: {
          difficulty: 'hard',
          cost: 80000,
          paybackPeriod: 60
        },
        status: 'recommended'
      }
    ];
  }

  /**
   * 初始化设备分组数据
   * @returns {Array} 设备分组列表
   */
  initDeviceGroups() {
    this.deviceGroups = [
      {
        id: 'group_001',
        name: '生产区域',
        description: '工厂车间及生产线设备',
        icon: 'factory',
        deviceCount: 7,
        onlineCount: 6,
        totalPower: 135.6,
        energyToday: 1625.8,
        deviceIds: ['device_004', 'device_006', 'device_007', 'device_013', 'device_016', 'device_018', 'device_021'],
        createdAt: '2024-01-05T08:00:00Z',
        updatedAt: '2024-01-15T12:45:00Z',
        autoGrouping: {
          enabled: true,
          rules: ['location', 'production_line', 'criticality'],
          lastUpdate: '2024-01-15T12:45:00Z',
          confidence: 0.92
        },
        efficiencyAnalysis: {
          currentScore: 82,
          trend: '+0.8%',
          recommendations: [
            '生产线电机运行效率良好，建议保持当前维护计划',
            '可考虑在低负荷时段降低设备运行功率',
            '建议升级老旧设备以进一步提升效率'
          ],
          potentialSavings: {
            energy: 78.5,
            cost: 54.95,
            carbonReduction: 39.3
          },
          benchmarkComparison: {
            industryAverage: 80,
            bestPractice: 88,
            ranking: 'above_average'
          }
        },
        historicalData: {
          dailyConsumption: this.generateGroupHistoricalData('daily', 30),
          weeklyTrend: this.generateGroupHistoricalData('weekly', 12),
          monthlyComparison: this.generateGroupHistoricalData('monthly', 6)
        },
        alertConfig: {
          energyThreshold: 1800.0,
          efficiencyThreshold: 75,
          autoActions: {
            highConsumption: 'optimize_production_schedule',
            lowEfficiency: 'immediate_inspection',
            deviceOffline: 'halt_production_line'
          }
        }
      },
      {
        id: 'group_002',
        name: '办公区域',
        description: '办公室、会议室及接待区设备',
        icon: 'office',
        deviceCount: 6,
        onlineCount: 6,
        totalPower: 12.5,
        energyToday: 98.4,
        deviceIds: ['device_001', 'device_002', 'device_005', 'device_008', 'device_014', 'device_020'],
        createdAt: '2024-01-08T10:15:00Z',
        updatedAt: '2024-01-15T16:20:00Z',
        autoGrouping: {
          enabled: true,
          rules: ['location', 'type', 'efficiency'],
          lastUpdate: '2024-01-15T16:20:00Z',
          confidence: 0.95
        },
        efficiencyAnalysis: {
          currentScore: 86,
          trend: '+2.5%',
          recommendations: [
            '建议在非工作时间自动关闭照明设备',
            '可考虑使用智能调光系统节约能源',
            '空调温度设置为26°C可节约能源'
          ],
          potentialSavings: {
            energy: 12.8,
            cost: 8.96,
            carbonReduction: 6.4
          },
          benchmarkComparison: {
            industryAverage: 82,
            bestPractice: 92,
            ranking: 'above_average'
          }
        },
        historicalData: {
          dailyConsumption: this.generateGroupHistoricalData('daily', 30),
          weeklyTrend: this.generateGroupHistoricalData('weekly', 12),
          monthlyComparison: this.generateGroupHistoricalData('monthly', 6)
        },
        alertConfig: {
          energyThreshold: 120.0,
          efficiencyThreshold: 80,
          autoActions: {
            highConsumption: 'notify_manager',
            lowEfficiency: 'suggest_optimization',
            deviceOffline: 'send_maintenance_request'
          }
        }
      },
      {
        id: 'group_003',
        name: '公共区域',
        description: '室外、园区及公共场所设备',
        icon: 'public',
        deviceCount: 4,
        onlineCount: 4,
        totalPower: 8.2,
        energyToday: 196.8,
        deviceIds: ['device_009', 'device_011', 'device_019', 'device_023'],
        createdAt: '2024-01-12T11:30:00Z',
        updatedAt: '2024-01-15T10:15:00Z',
        autoGrouping: {
          enabled: true,
          rules: ['location', 'outdoor', 'public_access'],
          lastUpdate: '2024-01-15T10:15:00Z',
          confidence: 0.91
        },
        efficiencyAnalysis: {
          currentScore: 84,
          trend: '+1.2%',
          recommendations: [
            '户外照明可根据日照时间自动调整',
            '公共区域设备可采用人流感应控制'
          ],
          potentialSavings: {
            energy: 15.6,
            cost: 10.92,
            carbonReduction: 7.8
          },
          benchmarkComparison: {
            industryAverage: 79,
            bestPractice: 90,
            ranking: 'above_average'
          }
        },
        historicalData: {
          dailyConsumption: this.generateGroupHistoricalData('daily', 30),
          weeklyTrend: this.generateGroupHistoricalData('weekly', 12),
          monthlyComparison: this.generateGroupHistoricalData('monthly', 6)
        },
        alertConfig: {
          energyThreshold: 220.0,
          efficiencyThreshold: 75,
          autoActions: {
            highConsumption: 'adjust_schedule',
            lowEfficiency: 'maintenance_check',
            deviceOffline: 'send_technician'
          }
        }
      },
      {
        id: 'group_004',
        name: '设备机房',
        description: '机房、配电室及控制中心设备',
        icon: 'server',
        deviceCount: 3,
        onlineCount: 3,
        totalPower: 42.5,
        energyToday: 1020.0,
        deviceIds: ['device_003', 'device_010', 'device_017'],
        createdAt: '2024-01-10T09:30:00Z',
        updatedAt: '2024-01-15T14:20:00Z',
        autoGrouping: {
          enabled: true,
          rules: ['location', 'criticality', 'security'],
          lastUpdate: '2024-01-15T14:20:00Z',
          confidence: 0.94
        },
        efficiencyAnalysis: {
          currentScore: 78,
          trend: '-0.5%',
          recommendations: [
            '机房温度控制在22-24°C可提高设备效率',
            '建议优化UPS负载分配',
            '考虑使用热通道/冷通道布局降低制冷需求'
          ],
          potentialSavings: {
            energy: 102.0,
            cost: 71.4,
            carbonReduction: 51.0
          },
          benchmarkComparison: {
            industryAverage: 75,
            bestPractice: 85,
            ranking: 'above_average'
          }
        },
        historicalData: {
          dailyConsumption: this.generateGroupHistoricalData('daily', 30),
          weeklyTrend: this.generateGroupHistoricalData('weekly', 12),
          monthlyComparison: this.generateGroupHistoricalData('monthly', 6)
        },
        alertConfig: {
          energyThreshold: 1100.0,
          efficiencyThreshold: 72,
          autoActions: {
            highConsumption: 'optimize_cooling',
            lowEfficiency: 'critical_inspection',
            deviceOffline: 'immediate_response'
          }
        }
      },
      {
        id: 'group_005',
        name: '仓储区域',
        description: '仓库、物料及货物存储区设备',
        icon: 'warehouse',
        deviceCount: 3,
        onlineCount: 2,
        totalPower: 18.4,
        energyToday: 441.6,
        deviceIds: ['device_012', 'device_015', 'device_022'],
        createdAt: '2024-01-14T09:45:00Z',
        updatedAt: '2024-01-15T11:45:00Z',
        autoGrouping: {
          enabled: true,
          rules: ['location', 'storage', 'inventory'],
          lastUpdate: '2024-01-15T11:45:00Z',
          confidence: 0.89
        },
        efficiencyAnalysis: {
          currentScore: 80,
          trend: '+0.3%',
          recommendations: [
            '仓库照明可采用分区控制减少能耗',
            '温湿度控制设备可根据存储物品需求优化设置'
          ],
          potentialSavings: {
            energy: 22.1,
            cost: 15.47,
            carbonReduction: 11.0
          },
          benchmarkComparison: {
            industryAverage: 78,
            bestPractice: 88,
            ranking: 'above_average'
          }
        },
        historicalData: {
          dailyConsumption: this.generateGroupHistoricalData('daily', 30),
          weeklyTrend: this.generateGroupHistoricalData('weekly', 12),
          monthlyComparison: this.generateGroupHistoricalData('monthly', 6)
        },
        alertConfig: {
          energyThreshold: 480.0,
          efficiencyThreshold: 75,
          autoActions: {
            highConsumption: 'adjust_environment_control',
            lowEfficiency: 'schedule_maintenance',
            deviceOffline: 'check_power_supply'
          }
        }
      }
    ];

    return this.deviceGroups;
  }

  /**
   * 生成分组历史数据
   * @param {string} type - 数据类型：daily, weekly, monthly
   * @param {number} count - 数据点数量
   * @returns {Array} 历史数据
   */
  generateGroupHistoricalData(type, count) {
    const data = [];
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      let timeKey, consumption;

      switch (type) {
        case 'daily':
          date.setDate(date.getDate() - i);
          timeKey = date.toISOString().split('T')[0];
          consumption = {
            electricity: Math.random() * 100 + 50,
            water: Math.random() * 20 + 10,
            gas: Math.random() * 30 + 15,
            carbon: Math.random() * 5 + 2
          };
          break;
        case 'weekly':
          date.setDate(date.getDate() - i * 7);
          timeKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
          consumption = {
            electricity: Math.random() * 700 + 350,
            water: Math.random() * 140 + 70,
            gas: Math.random() * 210 + 105,
            carbon: Math.random() * 35 + 14
          };
          break;
        case 'monthly':
          date.setMonth(date.getMonth() - i);
          timeKey = date.toISOString().substr(0, 7);
          consumption = {
            electricity: Math.random() * 3000 + 1500,
            water: Math.random() * 600 + 300,
            gas: Math.random() * 900 + 450,
            carbon: Math.random() * 150 + 60
          };
          break;
      }

      data.push({
        time: timeKey,
        ...consumption,
        efficiency: Math.random() * 30 + 70, // 70-100的效率分数
        cost: consumption.electricity * 0.7 + consumption.water * 3.5 + consumption.gas * 2.8
      });
    }

    return data;
  }

  // ==================== 设备分组管理相关 ====================

  /**
   * 获取设备分组列表
   * @param {Object} params - 查询参数
   * @returns {Object} 分组列表
   */
  getDeviceGroups(params = {}) {
    let groups = [...this.deviceGroups];

    // 筛选逻辑
    if (params.keyword) {
      groups = groups.filter(g =>
        g.name.includes(params.keyword) ||
        g.description.includes(params.keyword)
      );
    }

    return {
      success: true,
      data: {
        list: groups,
        total: groups.length,
        summary: {
          totalGroups: this.deviceGroups.length,
          totalDevices: this.deviceGroups.reduce((sum, g) => sum + g.deviceCount, 0),
          onlineDevices: this.deviceGroups.reduce((sum, g) => sum + g.onlineCount, 0)
        }
      },
      message: '获取分组列表成功'
    };
  }

  /**
   * 创建设备分组
   * @param {Object} groupData - 分组数据
   * @returns {Object} 创建结果
   */
  createDeviceGroup(groupData) {
    const newGroup = {
      id: 'group_' + Date.now(),
      name: groupData.name,
      description: groupData.description || '',
      icon: groupData.icon || 'default',
      deviceCount: 0,
      onlineCount: 0,
      totalPower: 0,
      energyToday: 0,
      deviceIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.deviceGroups.push(newGroup);

    return {
      success: true,
      data: newGroup,
      message: '分组创建成功'
    };
  }

  /**
   * 更新设备分组
   * @param {string} groupId - 分组ID
   * @param {Object} groupData - 更新数据
   * @returns {Object} 更新结果
   */
  updateDeviceGroup(groupId, groupData) {
    const groupIndex = this.deviceGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      return {
        success: false,
        message: '分组不存在'
      };
    }

    // 更新分组信息
    Object.assign(this.deviceGroups[groupIndex], {
      ...groupData,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      data: this.deviceGroups[groupIndex],
      message: '分组更新成功'
    };
  }

  /**
   * 删除设备分组
   * @param {string} groupId - 分组ID
   * @returns {Object} 删除结果
   */
  deleteDeviceGroup(groupId) {
    const groupIndex = this.deviceGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      return {
        success: false,
        message: '分组不存在'
      };
    }

    this.deviceGroups.splice(groupIndex, 1);

    return {
      success: true,
      message: '分组删除成功'
    };
  }

  /**
   * 添加设备到分组
   * @param {string} groupId - 分组ID
   * @param {Array} deviceIds - 设备ID列表
   * @returns {Object} 操作结果
   */
  addDevicesToGroup(groupId, deviceIds) {
    const group = this.deviceGroups.find(g => g.id === groupId);
    if (!group) {
      return {
        success: false,
        message: '分组不存在'
      };
    }

    // 添加设备到分组
    deviceIds.forEach(deviceId => {
      if (!group.deviceIds.includes(deviceId)) {
        group.deviceIds.push(deviceId);
        group.deviceCount++;

        // 检查设备是否在线
        const device = this.devices.find(d => d.id === deviceId);
        if (device && device.status === 'online') {
          group.onlineCount++;
        }
      }
    });

    group.updatedAt = new Date().toISOString();

    return {
      success: true,
      data: group,
      message: '设备添加成功'
    };
  }

  /**
   * 从分组中移除设备
   * @param {string} groupId - 分组ID
   * @param {Array} deviceIds - 设备ID列表
   * @returns {Object} 操作结果
   */
  removeDevicesFromGroup(groupId, deviceIds) {
    const group = this.deviceGroups.find(g => g.id === groupId);
    if (!group) {
      return {
        success: false,
        message: '分组不存在'
      };
    }

    // 从分组中移除设备
    deviceIds.forEach(deviceId => {
      const index = group.deviceIds.indexOf(deviceId);
      if (index > -1) {
        group.deviceIds.splice(index, 1);
        group.deviceCount--;

        // 检查设备是否在线
        const device = this.devices.find(d => d.id === deviceId);
        if (device && device.status === 'online') {
          group.onlineCount--;
        }
      }
    });

    group.updatedAt = new Date().toISOString();

    return {
      success: true,
      data: group,
      message: '设备移除成功'
    };
  }

  /**
   * 分组批量控制
   * @param {string} groupId - 分组ID
   * @param {Object} command - 控制命令
   * @returns {Object} 控制结果
   */
  controlDeviceGroup(groupId, command) {
    const group = this.deviceGroups.find(g => g.id === groupId);
    if (!group) {
      return {
        success: false,
        message: '分组不存在'
      };
    }

    const results = [];

    // 对分组中的每个设备执行控制命令
    group.deviceIds.forEach(deviceId => {
      const result = this.controlDevice(deviceId, command);
      results.push({
        deviceId,
        success: result.success,
        message: result.message
      });
    });

    const successCount = results.filter(r => r.success).length;

    return {
      success: true,
      data: {
        groupId,
        totalDevices: group.deviceIds.length,
        successCount,
        failCount: group.deviceIds.length - successCount,
        results
      },
      message: `批量控制完成，成功${successCount}个，失败${group.deviceIds.length - successCount}个`
    };
  }

  // ==================== 辅助方法 ====================

  generateLoadCurve() {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push({
        time: i.toString().padStart(2, '0') + ':00',
        power: (Math.random() * 100 + 50 + (i >= 8 && i <= 18 ? 50 : 0)).toFixed(1)
      });
    }
    return hours;
  }

  /**
   * 获取设备能耗数据 - 优化版本（使用统一数据模型）
   * @param {string} deviceId - 设备ID
   * @param {string} timeRange - 时间范围
   * @returns {Object} 能耗数据
   */
  getDeviceEnergyData(deviceId, timeRange) {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) return { success: false, message: '设备不存在' };

    // 使用统一模型计算能耗
    return {
      success: true,
      data: this.energyModel.getDeviceEnergyData(deviceId, timeRange)
    };
  }

  /**
   * 生成确定性时间序列数据 - 优化版本
   * @param {string} timeRange - 时间范围
   * @param {string} type - 数据类型
   * @returns {Array} 时间序列数据
   */
  generateTimeSeriesData(timeRange, type) {
    const now = new Date();
    const result = [];

    // 根据时间范围设置数据点数量和间隔
    let points, interval;
    switch (timeRange) {
      case '1h': points = 60; interval = 60 * 1000; break; // 每分钟一个点
      case '6h': points = 72; interval = 5 * 60 * 1000; break; // 每5分钟一个点
      case '12h': points = 72; interval = 10 * 60 * 1000; break; // 每10分钟一个点
      case '24h': points = 96; interval = 15 * 60 * 1000; break; // 每15分钟一个点
      case '7d': points = 168; interval = 60 * 60 * 1000; break; // 每小时一个点
      default: points = 24; interval = 60 * 60 * 1000; // 默认每小时一个点
    }

    // 使用确定性函数生成数据
    for (let i = 0; i < points; i++) {
      const time = new Date(now.getTime() - (points - i - 1) * interval);

      // 基于时间的确定性函数，而非随机数
      const hour = time.getHours();
      const dayOfWeek = time.getDay(); // 0是周日，1-6是周一到周六
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isWorkHour = hour >= 9 && hour <= 18;

      // 基础值 + 时间模式调整
      let value;
      if (isWeekend) {
        value = 30 + Math.sin(hour / 4) * 10; // 周末负载较低
      } else if (isWorkHour) {
        value = 70 + Math.sin((hour - 9) / 9 * Math.PI) * 30; // 工作时间负载曲线
      } else {
        value = 40 + Math.sin(hour / 12 * Math.PI) * 15; // 非工作时间负载
      }

      // 根据类型调整数值
      if (type === 'water') value = value * 0.4;
      if (type === 'gas') value = value * 0.2;

      result.push({
        time: time.toISOString(),
        value: parseFloat(value.toFixed(2))
      });
    }

    return result;
  }

  /**
   * 生成能耗时间序列数据 - 兼容旧版本接口
   * @param {string} timeRange - 时间范围
   * @returns {Array} 能耗时间序列数据
   */
  generateEnergyTimeSeries(timeRange = '24h') {
    const electricityData = this.generateTimeSeriesData(timeRange, 'electricity');
    const waterData = this.generateTimeSeriesData(timeRange, 'water');
    const gasData = this.generateTimeSeriesData(timeRange, 'gas');

    // 合并数据并格式化为旧版本格式
    return electricityData.map((item, index) => {
      const time = new Date(item.time);
      const formattedTime = timeRange === '7d' ?
        this.formatTime(time, 'MM-DD') :
        this.formatTime(time, 'HH:mm');

      return {
        time: formattedTime,
        electricity: item.value,
        water: waterData[index] ? waterData[index].value : 0,
        gas: gasData[index] ? gasData[index].value : 0
      };
    });
  }

  // 辅助方法：格式化时间
  formatTime(dateInput, format) {
    // 处理不同类型的时间输入
    let date;
    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      date = parseDate(dateInput);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      console.error('formatTime: 无效的时间参数', dateInput);
      return '时间格式错误';
    }

    // 检查Date对象是否有效
    if (isNaN(date.getTime())) {
      console.error('formatTime: 无效的日期', dateInput);
      return '无效日期';
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (format === 'MM-DD') {
      return `${month}-${day}`;
    } else if (format === 'HH:mm') {
      return `${hours}:${minutes}`;
    } else {
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
  }

  /**
   * 根据时间范围和能源类型生成时间序列数据
   * @param {String} timeRange - 时间范围：1h, 6h, 12h, 24h, 7d
   * @param {String} energyType - 能源类型：power(电)、water(水)、gas(气)、carbon(碳)
   * @returns {Array} 时间序列数据
   */
  generateTimeSeriesData(timeRange, energyType) {
    let count = 24; // 默认24小时
    let interval = 60; // 默认间隔60分钟
    let format = 'HH:mm';

    // 根据时间范围设置数据点数量和间隔
    switch (timeRange) {
      case '1h':
        count = 12; // 1小时显示12个刻度（每5分钟一个）
        interval = 5; // 5分钟间隔
        break;
      case '6h':
        count = 12; // 6小时显示12个刻度（每30分钟一个）
        interval = 30; // 30分钟间隔
        break;
      case '12h':
        count = 12; // 12小时显示12个刻度（每1小时一个）
        interval = 60; // 60分钟间隔
        break;
      case '24h':
        count = 12; // 24小时显示12个刻度（每2小时一个）
        interval = 120; // 120分钟间隔
        break;
      case '7d':
        count = 7; // 7天显示7个刻度（每天一个）
        interval = 24 * 60; // 24小时间隔
        format = 'MM-DD';
        break;
      default:
        count = 12;
        interval = 60;
    }

    // 生成时间点
    const now = new Date();
    const data = [];

    // 确保生成固定数量的数据点
    for (let i = 0; i < count; i++) {
      // 计算时间偏移，确保数据点分布均匀
      // 对于7d时间范围，从最早的日期开始，确保日期连续
      const timeOffset = (count - 1 - i) * interval * 60 * 1000;
      const time = new Date(now.getTime() - timeOffset);
      let value = 0;

      // 根据能源类型设置不同的数据生成函数
      switch (energyType) {
        case 'power':
          // 电力消耗曲线
          if (timeRange === '7d') {
            // 增加7天数据的差异性，使周末和工作日的差异更明显
            const dayOfWeek = time.getDay(); // 0是周日，6是周六
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            // 工作日和周末的用电量差异更大
            value = isWeekend ? 70 + Math.random() * 30 : 120 + Math.random() * 40;
          } else {
            value = 100 + Math.sin(time.getHours() / 3) * 50 + (time.getHours() % 5) * 2;
          }
          break;
        case 'water':
          // 用水量曲线
          if (timeRange === '7d') {
            // 增加7天数据的差异性
            const dayOfWeek = time.getDay();
            // 周一和周四用水量峰值
            if (dayOfWeek === 1) { // 周一
              value = 35 + Math.random() * 10;
            } else if (dayOfWeek === 4) { // 周四
              value = 40 + Math.random() * 15;
            } else if (dayOfWeek === 0 || dayOfWeek === 6) { // 周末
              value = 15 + Math.random() * 10;
            } else { // 其他工作日
              value = 25 + Math.random() * 10;
            }
          } else {
            value = 20 + Math.cos(time.getHours() / 6) * 15 + (time.getHours() % 4) * 1.2;
          }
          break;
        case 'gas':
          // 燃气用量曲线
          if (timeRange === '7d') {
            // 增加7天数据的差异性
            const dayOfWeek = time.getDay();
            // 周末燃气用量高，周三次之，其他日期较低
            if (dayOfWeek === 0 || dayOfWeek === 6) { // 周末
              value = 50 + Math.random() * 20;
            } else if (dayOfWeek === 3) { // 周三
              value = 40 + Math.random() * 15;
            } else { // 其他工作日
              value = 25 + Math.random() * 10;
            }
          } else {
            const hour = time.getHours();
            value = 30 + (hour > 6 && hour < 22 ? 20 : 0) + (hour % 6) * 1.5;
          }
          break;
        case 'carbon':
          // 碳排放曲线
          if (timeRange === '7d') {
            // 增加7天数据的差异性
            const dayOfWeek = time.getDay();
            // 工作日碳排放高，周末低
            if (dayOfWeek >= 1 && dayOfWeek <= 5) { // 工作日
              // 周三碳排放最高
              const peakFactor = dayOfWeek === 3 ? 1.3 : 1.0;
              value = (100 + Math.random() * 30) * peakFactor;
            } else { // 周末
              value = 50 + Math.random() * 20;
            }
          } else {
            value = 70 + Math.sin(time.getHours() / 4) * 30 + (time.getHours() % 7) * 2;
          }
          break;
        default:
          value = 50 + Math.random() * 50;
      }

      data.push({
        time: this.formatTime(time, format),
        value: parseFloat(value.toFixed(1))
      });
    }

    return data;
  }

  /**
   * 生成历史能耗曲线数据
   * @param {string} timeRange - 时间范围 (day, week, month, year, custom)
   * @param {string} energyType - 能源类型 (electricity, water, gas, total)
   * @param {Object} [fixedData] - 可选参数，用于生成固定数据（如今日数据）
   * @returns {Array} 曲线数据
   */
  generateHistoryChartData(timeRange, energyType, fixedData) {
    const data = [];

    // 如果是“今日”数据且提供了固定值，则生成基于固定值的曲线
    if (timeRange === 'day' && fixedData) {
      const now = new Date();
      // 模拟24小时的曲线数据，基于固定值进行小幅波动
      for (let i = 0; i < 24; i++) {
        const hour = String(i).padStart(2, '0');
        const value = fixedData.electricity / 24 + (Math.random() - 0.5) * (fixedData.electricity / 100); // 模拟小时波动
        data.push({
          time: `${hour}:00`,
          value: parseFloat(value.toFixed(2))
        });
      }
      return data;
    }

    // 其他时间范围（周、月、年）继续使用随机生成逻辑
    let numPoints;
    let timeUnit;
    switch (timeRange) {
      case 'week':
        numPoints = 7; // 7天
        timeUnit = 'day';
        break;
      case 'month':
        numPoints = 30; // 30天
        timeUnit = 'day';
        break;
      case 'year':
        numPoints = 12; // 12个月
        timeUnit = 'month';
        break;
      case 'custom':
        // 对于自定义范围，这里简化处理，实际应根据params中的startDate和endDate计算
        numPoints = 30; // 默认30天
        timeUnit = 'day';
        break;
      default:
        numPoints = 24; // 默认24小时
        timeUnit = 'hour';
    }

    for (let i = numPoints - 1; i >= 0; i--) {
      const date = new Date();
      let label;
      if (timeUnit === 'day') {
        date.setDate(date.getDate() - i);
        label = date.toISOString().split('T')[0];
      } else if (timeUnit === 'month') {
        date.setMonth(date.getMonth() - i);
        label = date.toISOString().substr(0, 7);
      } else if (timeUnit === 'hour') {
        date.setHours(date.getHours() - i);
        label = `${String(date.getHours()).padStart(2, '0')}:00`;
      }

      // 根据能源类型生成不同的随机值
      let value;
      switch (energyType) {
        case 'electricity':
          value = Math.random() * 1000 + 500;
          break;
        case 'water':
          value = Math.random() * 100 + 50;
          break;
        case 'gas':
          value = Math.random() * 200 + 100;
          break;
        case 'total':
        default:
          value = Math.random() * 1500 + 700;
          break;
      }

      data.push({
        time: label,
        value: parseFloat(value.toFixed(2))
      });
    }

    return data;
  }

  generateDailyData(days) {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        electricity: Math.random() * 1000 + 500,
        water: Math.random() * 100 + 50,
        gas: Math.random() * 200 + 100
      });
    }
    return data;
  }

  generateMonthlyData(months) {
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      data.push({
        month: date.toISOString().substr(0, 7),
        electricity: Math.random() * 30000 + 15000,
        water: Math.random() * 3000 + 1500,
        gas: Math.random() * 6000 + 3000
      });
    }
    return data;
  }

  /**
   * 获取设备实时数据（普通API请求替代WebSocket）
   * @param {Array} deviceIds - 设备ID数组
   * @param {String} energyType - 能源类型：power(电)、water(水)、gas(气)、carbon(碳)
   * @param {String} timeRange - 时间范围：1h, 6h, 12h, 24h, 7d
   * @returns {Object} 设备实时数据
   */
  getDeviceRealTimeData(deviceIds, energyType, timeRange = '24h') {
    // 如果是空数组，返回总览数据或分类汇总数据
    if (!deviceIds || deviceIds.length === 0) {
      // 如果指定了能源类型，返回该类型的分类汇总数据
      if (energyType) {
        // 根据能源类型生成相应的分类汇总数据
        let categoryData = {};
        let timeSeriesData = [];

        // 根据能源类型设置不同的数据
        switch (energyType) {
          case 'power':
            categoryData = {
              title: '电力消耗',
              totalValue: 156.8,
              unit: 'kW',
              devices: 12,
              trend: '+5.2%',
              distribution: [
                { name: '照明', value: 35.2, percentage: 22 },
                { name: '空调', value: 68.5, percentage: 44 },
                { name: '电器', value: 42.3, percentage: 27 },
                { name: '其他', value: 10.8, percentage: 7 }
              ]
            };
            // 根据时间范围生成电力消耗曲线数据
            timeSeriesData = this.generateTimeSeriesData(timeRange, 'power');
            break;
          case 'water':
            categoryData = {
              title: '用水量',
              totalValue: 28.5,
              unit: 'm³',
              devices: 8,
              trend: '-2.1%',
              distribution: [
                { name: '生活用水', value: 12.3, percentage: 43 },
                { name: '清洁用水', value: 8.7, percentage: 31 },
                { name: '灌溉', value: 5.2, percentage: 18 },
                { name: '其他', value: 2.3, percentage: 8 }
              ]
            };
            // 根据时间范围生成用水量曲线数据
            timeSeriesData = this.generateTimeSeriesData(timeRange, 'water');
            break;
          case 'gas':
            categoryData = {
              title: '燃气用量',
              totalValue: 42.6,
              unit: 'm³',
              devices: 5,
              trend: '+1.8%',
              distribution: [
                { name: '厨房', value: 28.4, percentage: 67 },
                { name: '热水', value: 10.2, percentage: 24 },
                { name: '取暖', value: 2.5, percentage: 6 },
                { name: '其他', value: 1.5, percentage: 3 }
              ]
            };
            // 根据时间范围生成燃气用量曲线数据
            timeSeriesData = this.generateTimeSeriesData(timeRange, 'gas');
            break;
          case 'carbon':
            categoryData = {
              title: '碳排放',
              totalValue: 85.3,
              unit: 'kg',
              devices: 25,
              trend: '+3.5%',
              distribution: [
                { name: '电力', value: 45.2, percentage: 53 },
                { name: '燃气', value: 22.8, percentage: 27 },
                { name: '水资源', value: 12.5, percentage: 15 },
                { name: '其他', value: 4.8, percentage: 5 }
              ]
            };
            // 根据时间范围生成碳排放曲线数据
            timeSeriesData = this.generateTimeSeriesData(timeRange, 'carbon');
            break;
          default:
            categoryData = {
              title: '能源消耗',
              totalValue: 0,
              unit: '',
              devices: 0,
              trend: '0%',
              distribution: []
            };
            timeSeriesData = [];
        }

        // 添加时间序列数据到分类数据中
        categoryData.timeSeriesData = timeSeriesData;

        return {
          success: true,
          data: {
            categoryOverview: categoryData
          }
        };
      }

      // 如果没有指定能源类型，返回总览数据
      return {
        success: true,
        data: {
          overview: {
            totalPower: 156.8,
            totalEnergy: 2345.6,
            deviceCount: this.devices.length,
            onlineCount: this.devices.filter(d => d.status === 'online').length,
            alertCount: this.alerts.filter(a => a.status === 'active').length
          }
        }
      };
    }

    // 获取指定设备的实时数据
    const realTimeData = deviceIds.map(id => {
      const device = this.devices.find(d => d.id === id);
      if (!device) return null;

      // 根据设备状态生成实时参数（关机设备功率为0）
      let power = 0;
      if (device.isOn && device.status === 'online') {
        // 只有开机且在线的设备才有功率
        power = device.power ? device.power * (0.9 + Math.random() * 0.2) : 0;
      }

      const voltage = 220 * (0.95 + Math.random() * 0.1);
      const current = power > 0 ? (power * 1000 / voltage).toFixed(2) : 0;
      const frequency = 50 * (0.99 + Math.random() * 0.02);
      const powerFactor = 0.85 + Math.random() * 0.15;

      // 根据设备类别生成相应的实时参数
      let realTimeParams = {};

      // 基础电力参数（所有设备都有）
      realTimeParams.power = power.toFixed(1);
      realTimeParams.voltage = voltage.toFixed(1);
      realTimeParams.current = current;
      realTimeParams.frequency = frequency.toFixed(2);
      realTimeParams.powerFactor = powerFactor.toFixed(2);

      // 根据设备类别添加特定参数
      switch (device.category) {
        case 'water':
          // 水设备的实时参数（关机设备流量为0）
          if (device.isOn && device.status === 'online') {
            realTimeParams.water = (device.flowRate ? device.flowRate * (0.8 + Math.random() * 0.4) : Math.random() * 30 + 10).toFixed(1); // 水流量 m³/h
            realTimeParams.waterPressure = (device.pressure ? device.pressure * (0.9 + Math.random() * 0.2) : Math.random() * 0.5 + 0.2).toFixed(2); // 水压 MPa
            realTimeParams.waterTemperature = (device.temperature ? device.temperature * (0.95 + Math.random() * 0.1) : Math.random() * 20 + 15).toFixed(1); // 水温 °C
          } else {
            realTimeParams.water = '0.0'; // 关机设备水流量为0
            realTimeParams.waterPressure = '0.00'; // 关机设备水压为0
            realTimeParams.waterTemperature = '0.0'; // 关机设备水温为0
          }
          break;
        case 'gas':
          // 燃气设备的实时参数（关机设备流量为0）
          if (device.isOn && device.status === 'online') {
            realTimeParams.gas = (device.flowRate ? device.flowRate * (0.8 + Math.random() * 0.4) : Math.random() * 20 + 5).toFixed(1); // 燃气流量 m³/h
            realTimeParams.gasPressure = (device.pressure ? device.pressure * (0.9 + Math.random() * 0.2) : Math.random() * 0.1 + 0.01).toFixed(3); // 燃气压力 MPa
            realTimeParams.gasTemperature = (device.temperature ? device.temperature * (0.95 + Math.random() * 0.1) : Math.random() * 30 + 20).toFixed(1); // 燃气温度 °C
          } else {
            realTimeParams.gas = '0.0'; // 关机设备燃气流量为0
            realTimeParams.gasPressure = '0.000'; // 关机设备燃气压力为0
            realTimeParams.gasTemperature = '0.0'; // 关机设备燃气温度为0
          }
          break;
        case 'electricity':
        default:
          // 电力设备保持原有参数即可
          break;
      }

      // 计算碳排放率（基于功率和设备类型，关机设备排放为0）
      let carbonEmissionRate = 0;
      if (device.isOn && device.status === 'online') {
        if (device.category === 'electricity') {
          // 电力设备：0.5-0.8 kg CO2/kWh
          carbonEmissionRate = power * (0.5 + Math.random() * 0.3);
        } else if (device.category === 'gas') {
          // 燃气设备：1.8-2.2 kg CO2/m³
          const gasFlow = parseFloat(realTimeParams.gas || 0);
          carbonEmissionRate = gasFlow * (1.8 + Math.random() * 0.4);
        } else if (device.category === 'water') {
          // 水设备：0.1-0.3 kg CO2/m³（主要来自水处理和输送）
          const waterFlow = parseFloat(realTimeParams.water || 0);
          carbonEmissionRate = waterFlow * (0.1 + Math.random() * 0.2);
        }
      }
      realTimeParams.carbon = carbonEmissionRate.toFixed(2); // 碳排放率 kg CO2/h

      return {
        deviceId: device.id,
        timestamp: Date.now(),
        status: device.status,
        realTimeParams: realTimeParams,
        environmentParams: {
          temperature: (device.temperature || 25 + Math.random() * 10).toFixed(1),
          humidity: (50 + Math.random() * 20).toFixed(1),
          airQuality: Math.floor(70 + Math.random() * 30)
        },
        signalStrength: Math.floor(60 + Math.random() * 40),
        alerts: this.alerts.filter(a => a.deviceId === device.id && a.status === 'active').slice(0, 3)
      };
    }).filter(data => data !== null);

    return {
      success: true,
      data: realTimeData
    };
  }

  // 获取智能分析概览
  getIntelligentAnalysisOverview() {
    const devices = this.getDevices().data;
    const devicesWithAnalysis = devices.filter(device => device.intelligentAnalysis);

    const highRiskCount = devicesWithAnalysis.filter(d => d.intelligentAnalysis.riskLevel === 'high').length;
    const mediumRiskCount = devicesWithAnalysis.filter(d => d.intelligentAnalysis.riskLevel === 'medium').length;
    const lowRiskCount = devicesWithAnalysis.filter(d => d.intelligentAnalysis.riskLevel === 'low').length;

    const predictedFailures = devicesWithAnalysis.filter(d => d.intelligentAnalysis.predictedFailure).length;
    const maintenanceNeeded = devicesWithAnalysis.filter(d => d.intelligentAnalysis.maintenanceRecommended).length;

    const avgEfficiencyScore = devicesWithAnalysis.length > 0
      ? Math.round(devicesWithAnalysis.reduce((sum, d) => sum + d.intelligentAnalysis.efficiencyScore, 0) / devicesWithAnalysis.length)
      : 0;

    return {
      success: true,
      data: {
        totalDevices: devicesWithAnalysis.length,
        riskDistribution: {
          high: highRiskCount,
          medium: mediumRiskCount,
          low: lowRiskCount
        },
        predictions: {
          predictedFailures,
          maintenanceNeeded
        },
        efficiency: {
          averageScore: avgEfficiencyScore,
          trend: ['+2.3%', '+1.8%', '+0.5%', '-0.2%'][Math.floor(Math.random() * 4)]
        },
        totalImpact: {
          energyLoss: devicesWithAnalysis.reduce((sum, d) => sum + (d.intelligentAnalysis.impactAssessment?.energyLoss || 0), 0),
          costImpact: devicesWithAnalysis.reduce((sum, d) => sum + (d.intelligentAnalysis.impactAssessment?.costImpact || 0), 0),
          carbonImpact: devicesWithAnalysis.reduce((sum, d) => sum + (d.intelligentAnalysis.impactAssessment?.carbonImpact || 0), 0)
        }
      }
    };
  }

  // 获取设备智能分析详情
  getDeviceIntelligentAnalysis(deviceId) {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device || !device.intelligentAnalysis) {
      return {
        success: false,
        message: '设备不存在或无智能分析数据'
      };
    }

    return {
      success: true,
      data: {
        deviceId,
        deviceName: device.name,
        analysis: device.intelligentAnalysis,
        historicalTrend: this.generateAnalysisTrend(),
        recommendations: this.generateDeviceRecommendations(device),
        relatedAlerts: this.getAlerts().data.filter(alert => alert.deviceId === deviceId)
      }
    };
  }

  // 生成分析趋势数据
  generateAnalysisTrend() {
    const days = 7;
    const trend = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      trend.push({
        date: date.toISOString().split('T')[0],
        efficiencyScore: Math.floor(Math.random() * 30) + 70,
        riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        alertCount: Math.floor(Math.random() * 5)
      });
    }

    return trend;
  }

  // 生成设备推荐
  generateDeviceRecommendations(device) {
    const recommendations = [];
    const analysis = device.intelligentAnalysis;

    if (analysis.riskLevel === 'high') {
      recommendations.push({
        type: 'urgent',
        title: '立即检查设备状态',
        description: '设备存在高风险，建议立即进行全面检查',
        priority: 1,
        estimatedTime: '2小时',
        estimatedCost: '¥500-1000'
      });
    }

    if (analysis.predictedFailure) {
      recommendations.push({
        type: 'maintenance',
        title: '预防性维护',
        description: '根据AI预测，设备可能在近期出现故障',
        priority: 2,
        estimatedTime: '4小时',
        estimatedCost: '¥800-1500'
      });
    }

    if (analysis.efficiencyScore < 80) {
      recommendations.push({
        type: 'optimization',
        title: '效率优化',
        description: '设备效率偏低，建议进行参数调优',
        priority: 3,
        estimatedTime: '1小时',
        estimatedCost: '¥200-500'
      });
    }

    return recommendations;
  }

  /**
   * 根据时间范围获取数据倍数
   * @param {String} timeRange - 时间范围
   * @returns {Number} 倍数
   */
  getTimeRangeMultiplier(timeRange) {
    const multipliers = {
      'day': 0.033,    // 日数据（固定值，此倍数仅作参考）
      'week': 0.093,   // 周数据约为日数据的7倍，相对于18500的比例
      'month': 0.4,    // 月数据基准，使得18500 * 0.4 接近日数据 * 30
      'year': 4.8,     // 年数据约为月数据的12倍
      'custom': 0.2    // 自定义默认为月数据的一半
    };
    return multipliers[timeRange] || 1;
  }

  /**
   * 根据时间范围获取天数
   * @param {String} timeRange - 时间范围
   * @returns {Number} 天数
   */
  getTimeRangeDays(timeRange) {
    const days = {
      'day': 1,
      'week': 7,
      'month': 30,
      'year': 365,
      'custom': 15  // 自定义默认15天
    };
    return days[timeRange] || 30;
  }
}

// 导出类和实例
const energyAPI = new EnergyMockAPI();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnergyMockAPI;
  module.exports.instance = energyAPI;
} else if (typeof window !== 'undefined') {
  window.EnergyMockAPI = EnergyMockAPI;
  window.energyAPI = energyAPI;
}

// 使用示例：
// const homeData = energyAPI.getHomeOverview();
// const deviceList = energyAPI.getDeviceList({ type: 'air_conditioner' });
// const controlResult = energyAPI.controlDevice('device_001', { action: 'switch', value: false });
