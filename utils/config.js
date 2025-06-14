/**
 * 智慧能源管理小程序 - 配置文件
 * 定义常量、配置项和枚举值
 */

// ==================== 基础配置 ====================

// 应用基础信息
export const APP_CONFIG = {
  name: '智慧能源管理',
  version: '1.0.0',
  author: '智慧科技有限公司',
  description: '智慧能源管理解决方案'
};

// API配置
export const API_CONFIG = {
  baseUrl: 'https://api.energy.example.com',
  timeout: 10000,
  retryTimes: 3,
  mockMode: true // 是否使用模拟数据
};

// ==================== 设备相关配置 ====================

// 设备类型
export const DEVICE_TYPES = {
  AIR_CONDITIONER: 'air_conditioner',
  LIGHTING: 'lighting',
  WATER_HEATER: 'water_heater',
  SMART_METER: 'smart_meter',
  SOLAR_INVERTER: 'solar_inverter',
  ENERGY_STORAGE: 'energy_storage',
  CHARGING_PILE: 'charging_pile',
  SENSOR: 'sensor',
  GATEWAY: 'gateway',
  INDUSTRIAL_CONTROL: 'industrial_control'
};

// 设备类型显示名称
export const DEVICE_TYPE_NAMES = {
  [DEVICE_TYPES.AIR_CONDITIONER]: '空调系统',
  [DEVICE_TYPES.LIGHTING]: '照明系统',
  [DEVICE_TYPES.WATER_HEATER]: '热水器',
  [DEVICE_TYPES.SMART_METER]: '智能电表',
  [DEVICE_TYPES.SOLAR_INVERTER]: '光伏逆变器',
  [DEVICE_TYPES.ENERGY_STORAGE]: '储能系统',
  [DEVICE_TYPES.CHARGING_PILE]: '充电桩',
  [DEVICE_TYPES.SENSOR]: '传感器',
  [DEVICE_TYPES.GATEWAY]: '智能网关',
  [DEVICE_TYPES.INDUSTRIAL_CONTROL]: '工业控制设备'
};

// 设备状态
export const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  FAULT: 'fault',
  MAINTENANCE: 'maintenance'
};

// 设备状态显示名称
export const DEVICE_STATUS_NAMES = {
  [DEVICE_STATUS.ONLINE]: '在线',
  [DEVICE_STATUS.OFFLINE]: '离线',
  [DEVICE_STATUS.FAULT]: '故障',
  [DEVICE_STATUS.MAINTENANCE]: '维护中'
};

// 设备状态颜色
export const DEVICE_STATUS_COLORS = {
  [DEVICE_STATUS.ONLINE]: '#52c41a',
  [DEVICE_STATUS.OFFLINE]: '#d9d9d9',
  [DEVICE_STATUS.FAULT]: '#ff4d4f',
  [DEVICE_STATUS.MAINTENANCE]: '#faad14'
};

// ==================== 能源相关配置 ====================

// 能源类型
export const ENERGY_TYPES = {
  ELECTRICITY: 'electricity',
  WATER: 'water',
  GAS: 'gas',
  SOLAR: 'solar',
  STORAGE: 'storage'
};

// 能源类型显示名称
export const ENERGY_TYPE_NAMES = {
  [ENERGY_TYPES.ELECTRICITY]: '电力',
  [ENERGY_TYPES.WATER]: '水',
  [ENERGY_TYPES.GAS]: '燃气',
  [ENERGY_TYPES.SOLAR]: '光伏',
  [ENERGY_TYPES.STORAGE]: '储能'
};

// 能源单位
export const ENERGY_UNITS = {
  [ENERGY_TYPES.ELECTRICITY]: 'kWh',
  [ENERGY_TYPES.WATER]: '吨',
  [ENERGY_TYPES.GAS]: '立方米',
  [ENERGY_TYPES.SOLAR]: 'kWh',
  [ENERGY_TYPES.STORAGE]: 'kWh'
};

// 时间范围
export const TIME_RANGES = {
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  CUSTOM: 'custom'
};

// 时间范围显示名称
export const TIME_RANGE_NAMES = {
  [TIME_RANGES.HOUR]: '小时',
  [TIME_RANGES.DAY]: '日',
  [TIME_RANGES.WEEK]: '周',
  [TIME_RANGES.MONTH]: '月',
  [TIME_RANGES.YEAR]: '年',
  [TIME_RANGES.CUSTOM]: '自定义'
};

// ==================== 告警相关配置 ====================

// 告警级别
export const ALERT_LEVELS = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info'
};

// 告警级别显示名称
export const ALERT_LEVEL_NAMES = {
  [ALERT_LEVELS.CRITICAL]: '严重',
  [ALERT_LEVELS.WARNING]: '警告',
  [ALERT_LEVELS.INFO]: '信息'
};

// 告警级别颜色
export const ALERT_LEVEL_COLORS = {
  [ALERT_LEVELS.CRITICAL]: '#ff4d4f',
  [ALERT_LEVELS.WARNING]: '#faad14',
  [ALERT_LEVELS.INFO]: '#1890ff'
};

// 告警类型
export const ALERT_TYPES = {
  DEVICE_OFFLINE: 'device_offline',
  ENERGY_ABNORMAL: 'energy_abnormal',
  TEMPERATURE_HIGH: 'temperature_high',
  TEMPERATURE_LOW: 'temperature_low',
  MAINTENANCE_REMINDER: 'maintenance_reminder',
  ENERGY_SAVING_TIP: 'energy_saving_tip',
  SYSTEM_ERROR: 'system_error'
};

// 告警类型显示名称
export const ALERT_TYPE_NAMES = {
  [ALERT_TYPES.DEVICE_OFFLINE]: '设备离线',
  [ALERT_TYPES.ENERGY_ABNORMAL]: '能耗异常',
  [ALERT_TYPES.TEMPERATURE_HIGH]: '温度过高',
  [ALERT_TYPES.TEMPERATURE_LOW]: '温度过低',
  [ALERT_TYPES.MAINTENANCE_REMINDER]: '维护提醒',
  [ALERT_TYPES.ENERGY_SAVING_TIP]: '节能建议',
  [ALERT_TYPES.SYSTEM_ERROR]: '系统错误'
};

// 告警状态
export const ALERT_STATUS = {
  UNREAD: 'unread',
  READ: 'read',
  IGNORED: 'ignored',
  RESOLVED: 'resolved'
};

// 告警状态显示名称
export const ALERT_STATUS_NAMES = {
  [ALERT_STATUS.UNREAD]: '未读',
  [ALERT_STATUS.READ]: '已读',
  [ALERT_STATUS.IGNORED]: '已忽略',
  [ALERT_STATUS.RESOLVED]: '已解决'
};

// ==================== 用户相关配置 ====================

// 用户角色
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
};

// 用户角色显示名称
export const USER_ROLE_NAMES = {
  [USER_ROLES.ADMIN]: '管理员',
  [USER_ROLES.USER]: '普通用户',
  [USER_ROLES.GUEST]: '访客'
};

// 用户权限
export const USER_PERMISSIONS = {
  DEVICE_CONTROL: 'device_control',
  DATA_VIEW: 'data_view',
  USER_MANAGE: 'user_manage',
  SYSTEM_CONFIG: 'system_config',
  REPORT_EXPORT: 'report_export'
};

// 用户权限显示名称
export const USER_PERMISSION_NAMES = {
  [USER_PERMISSIONS.DEVICE_CONTROL]: '设备控制',
  [USER_PERMISSIONS.DATA_VIEW]: '数据查看',
  [USER_PERMISSIONS.USER_MANAGE]: '用户管理',
  [USER_PERMISSIONS.SYSTEM_CONFIG]: '系统配置',
  [USER_PERMISSIONS.REPORT_EXPORT]: '报告导出'
};

// ==================== 场景模式配置 ====================

// 场景类型
export const SCENE_TYPES = {
  FACTORY: 'factory',
  SCHOOL: 'school',
  OFFICE: 'office',
  RESIDENTIAL: 'residential'
};

// 场景类型显示名称
export const SCENE_TYPE_NAMES = {
  [SCENE_TYPES.FACTORY]: '工厂',
  [SCENE_TYPES.SCHOOL]: '学校',
  [SCENE_TYPES.OFFICE]: '办公楼',
  [SCENE_TYPES.RESIDENTIAL]: '住宅'
};

// 预设场景模式
export const PRESET_SCENES = {
  // 工厂场景
  FACTORY_PRODUCTION: 'factory_production',
  FACTORY_NON_PRODUCTION: 'factory_non_production',
  FACTORY_HOLIDAY: 'factory_holiday',
  
  // 学校场景
  SCHOOL_CLASS: 'school_class',
  SCHOOL_BREAK: 'school_break',
  SCHOOL_AFTER_SCHOOL: 'school_after_school',
  SCHOOL_HOLIDAY: 'school_holiday',
  
  // 办公楼场景
  OFFICE_WORKDAY: 'office_workday',
  OFFICE_NON_WORKDAY: 'office_non_workday',
  OFFICE_NIGHT: 'office_night'
};

// 预设场景模式显示名称
export const PRESET_SCENE_NAMES = {
  [PRESET_SCENES.FACTORY_PRODUCTION]: '生产模式',
  [PRESET_SCENES.FACTORY_NON_PRODUCTION]: '非生产模式',
  [PRESET_SCENES.FACTORY_HOLIDAY]: '节假日模式',
  [PRESET_SCENES.SCHOOL_CLASS]: '上课模式',
  [PRESET_SCENES.SCHOOL_BREAK]: '下课模式',
  [PRESET_SCENES.SCHOOL_AFTER_SCHOOL]: '放学模式',
  [PRESET_SCENES.SCHOOL_HOLIDAY]: '假期模式',
  [PRESET_SCENES.OFFICE_WORKDAY]: '工作日模式',
  [PRESET_SCENES.OFFICE_NON_WORKDAY]: '非工作日模式',
  [PRESET_SCENES.OFFICE_NIGHT]: '夜间模式'
};

// ==================== 报告相关配置 ====================

// 报告类型
export const REPORT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom'
};

// 报告类型显示名称
export const REPORT_TYPE_NAMES = {
  [REPORT_TYPES.DAILY]: '日报',
  [REPORT_TYPES.WEEKLY]: '周报',
  [REPORT_TYPES.MONTHLY]: '月报',
  [REPORT_TYPES.YEARLY]: '年报',
  [REPORT_TYPES.CUSTOM]: '自定义报告'
};

// 报告格式
export const REPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  WORD: 'word'
};

// ==================== 图表配置 ====================

// 图表类型
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  AREA: 'area',
  GAUGE: 'gauge'
};

// 图表颜色主题
export const CHART_COLORS = {
  PRIMARY: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
  ENERGY: ['#1890ff', '#52c41a', '#faad14', '#13c2c2', '#eb2f96'],
  GRADIENT: [
    { offset: 0, color: '#1890ff' },
    { offset: 1, color: '#69c0ff' }
  ]
};

// ==================== 存储配置 ====================

// 本地存储键名
export const STORAGE_KEYS = {
  USER_INFO: 'userInfo',
  TOKEN: 'token',
  SETTINGS: 'settings',
  DEVICE_CACHE: 'deviceCache',
  ENERGY_CACHE: 'energyCache'
};

// 缓存过期时间（毫秒）
export const CACHE_EXPIRE_TIME = {
  USER_INFO: 24 * 60 * 60 * 1000, // 24小时
  DEVICE_LIST: 5 * 60 * 1000, // 5分钟
  ENERGY_DATA: 1 * 60 * 1000, // 1分钟
  ALERT_LIST: 30 * 1000 // 30秒
};

// ==================== 界面配置 ====================

// 主题色
export const THEME_COLORS = {
  PRIMARY: '#1890ff',
  SUCCESS: '#52c41a',
  WARNING: '#faad14',
  ERROR: '#f5222d',
  INFO: '#1890ff'
};

// 页面配置
export const PAGE_CONFIG = {
  // 列表页每页显示数量
  PAGE_SIZE: 20,
  // 图表刷新间隔（毫秒）
  CHART_REFRESH_INTERVAL: 30000,
  // 实时数据刷新间隔（毫秒）
  REALTIME_REFRESH_INTERVAL: 5000
};

// ==================== 验证规则 ====================

// 表单验证规则
export const VALIDATION_RULES = {
  PHONE: /^1[3-9]\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,20}$/,
  DEVICE_NAME: /^[\u4e00-\u9fa5a-zA-Z0-9_-]{2,20}$/
};

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SERVER_ERROR: '服务器错误，请稍后重试',
  PERMISSION_DENIED: '权限不足，无法执行此操作',
  DEVICE_OFFLINE: '设备离线，无法控制',
  INVALID_PARAMS: '参数错误，请检查输入',
  LOGIN_REQUIRED: '请先登录',
  TOKEN_EXPIRED: '登录已过期，请重新登录'
};

// ==================== 默认配置 ====================

// 默认设置
export const DEFAULT_SETTINGS = {
  // 通知设置
  notifications: {
    alert: true,
    energySaving: true,
    maintenance: true,
    system: false
  },
  // 显示设置
  display: {
    theme: 'light',
    language: 'zh-CN',
    timeFormat: '24h',
    energyUnit: 'kWh'
  },
  // 自动刷新设置
  autoRefresh: {
    enabled: true,
    interval: 30000
  }
};

// 导出所有配置
export default {
  APP_CONFIG,
  API_CONFIG,
  DEVICE_TYPES,
  DEVICE_TYPE_NAMES,
  DEVICE_STATUS,
  DEVICE_STATUS_NAMES,
  DEVICE_STATUS_COLORS,
  ENERGY_TYPES,
  ENERGY_TYPE_NAMES,
  ENERGY_UNITS,
  TIME_RANGES,
  TIME_RANGE_NAMES,
  ALERT_LEVELS,
  ALERT_LEVEL_NAMES,
  ALERT_LEVEL_COLORS,
  ALERT_TYPES,
  ALERT_TYPE_NAMES,
  ALERT_STATUS,
  ALERT_STATUS_NAMES,
  USER_ROLES,
  USER_ROLE_NAMES,
  USER_PERMISSIONS,
  USER_PERMISSION_NAMES,
  SCENE_TYPES,
  SCENE_TYPE_NAMES,
  PRESET_SCENES,
  PRESET_SCENE_NAMES,
  REPORT_TYPES,
  REPORT_TYPE_NAMES,
  REPORT_FORMATS,
  CHART_TYPES,
  CHART_COLORS,
  STORAGE_KEYS,
  CACHE_EXPIRE_TIME,
  THEME_COLORS,
  PAGE_CONFIG,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  DEFAULT_SETTINGS
};