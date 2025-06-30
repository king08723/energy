/**
 * 智慧能源管理小程序 - 配置文件
 * 定义常量、配置项和枚举值
 */

// ==================== 基础配置 ====================

// 应用基础信息
const APP_CONFIG = {
  name: '智慧能源管理',
  version: '1.0.0',
  author: '智慧科技有限公司',
  description: '智慧能源管理解决方案'
};

// API配置
const API_CONFIG = {
  baseUrl: 'https://api.energy.example.com',
  timeout: 10000,
  retryTimes: 3,
  mockMode: true, // 是否使用模拟数据
  environment: 'development' // 默认环境
};

// ==================== 设备相关配置 ====================

// 能源类型
const ENERGY_TYPES = {
  ELECTRICITY: 'electricity',
  WATER: 'water',
  GAS: 'gas',
  SOLAR: 'solar',
  STORAGE: 'storage'
};

// 能源单位
const ENERGY_UNITS = {
  [ENERGY_TYPES.ELECTRICITY]: 'kWh',
  [ENERGY_TYPES.WATER]: '吨',
  [ENERGY_TYPES.GAS]: '立方米',
  [ENERGY_TYPES.SOLAR]: 'kWh',
  [ENERGY_TYPES.STORAGE]: 'kWh'
};

// 设备类型
const DEVICE_TYPES = {
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

// 设备状态
const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  FAULT: 'fault',
  MAINTENANCE: 'maintenance'
};

// 告警级别
const ALERT_LEVELS = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info'
};

// 告警类型
const ALERT_TYPES = {
  DEVICE_OFFLINE: 'device_offline',
  ENERGY_ABNORMAL: 'energy_abnormal',
  TEMPERATURE_HIGH: 'temperature_high',
  TEMPERATURE_LOW: 'temperature_low',
  MAINTENANCE_REMINDER: 'maintenance_reminder',
  ENERGY_SAVING_TIP: 'energy_saving_tip',
  SYSTEM_ERROR: 'system_error'
};

// 用户角色
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
};

// 场景类型
const SCENE_TYPES = {
  FACTORY: 'factory',
  SCHOOL: 'school',
  OFFICE: 'office',
  RESIDENTIAL: 'residential'
};

// 导出配置 - 使用CommonJS格式
module.exports = {
  APP_CONFIG,
  API_CONFIG,
  ENERGY_TYPES,
  ENERGY_UNITS,
  DEVICE_TYPES,
  DEVICE_STATUS,
  ALERT_LEVELS,
  ALERT_TYPES,
  USER_ROLES,
  SCENE_TYPES
};
