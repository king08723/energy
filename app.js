// app.js
let API;
try {
    API = require('./utils/api.js');
    console.log('API模块加载成功');
    console.log('API对象结构:', Object.keys(API));
    console.log('API.config存在:', !!API.config);
    if (API.config) {
        console.log('API.config方法:', Object.keys(API.config));
    }
} catch (error) {
    console.error('API模块加载失败:', error);
    // 创建一个基础的API对象作为备用
    API = {
        config: {
            setEnvironment: (env) => console.warn('API模块未正确加载，无法设置环境:', env),
            getCurrentConfig: () => ({}),
            setCustomConfig: () => console.warn('API模块未正确加载'),
            setMockMode: () => console.warn('API模块未正确加载'),
            setLogMode: () => console.warn('API模块未正确加载')
        }
    };
}

App({
    globalData: {
        // 用户信息
        userInfo: null,
        // 设备数据缓存
        devices: [],
        // 系统配置
        systemConfig: {
            enableDebug: false,
            enableMock: true,
            cacheTimeout: 5 * 60 * 1000 // 5分钟缓存
        },
        // 应用状态
        appState: {
            isFirstLaunch: true,
            lastActiveTime: Date.now(),
            networkStatus: 'unknown'
        }
    },

    onLaunch(options) {
        console.log('应用启动', options);

        // 记录启动时间
        const launchStartTime = Date.now();
        this.globalData.appState.launchStartTime = launchStartTime;

        // 初始化应用
        this.initApp().then(() => {
            const launchEndTime = Date.now();
            const launchDuration = launchEndTime - launchStartTime;
            console.log(`应用启动完成，耗时: ${launchDuration}ms`);

            // 如果启动时间过长，记录警告
            if (launchDuration > 3000) {
                console.warn(`应用启动时间过长: ${launchDuration}ms`);
            }
        }).catch(error => {
            console.error('应用初始化失败:', error);
        });
    },

    onShow(options) {
        console.log('应用显示', options);
        this.globalData.appState.lastActiveTime = Date.now();

        // 检查网络状态
        this.checkNetworkStatus();
    },

    onHide() {
        console.log('应用隐藏');
        // 清理定时器和连接
        this.cleanupResources();
    },

    onError(error) {
        console.error('应用错误:', error);
        // 错误上报
        this.reportError(error);
    },

    // 验证API模块是否正确加载
    validateAPIModule() {
        const requiredMethods = ['getDeviceList', 'getHomeOverview'];
        const requiredConfigMethods = ['setEnvironment', 'getCurrentConfig'];

        let isValid = true;
        const missingMethods = [];

        // 检查API对象
        if (!API) {
            console.error('API对象未定义');
            return false;
        }

        console.log('API对象可用方法:', Object.keys(API).filter(key => typeof API[key] === 'function'));

        // 检查API方法
        requiredMethods.forEach(method => {
            if (typeof API[method] !== 'function') {
                missingMethods.push(`API.${method}`);
                isValid = false;
                console.error(`缺少方法: API.${method}, 类型:`, typeof API[method]);
            } else {
                console.log(`✓ API.${method} 可用`);
            }
        });

        // 检查config对象和方法
        if (!API.config) {
            console.error('API.config对象未定义');
            isValid = false;
        } else {
            console.log('API.config可用方法:', Object.keys(API.config).filter(key => typeof API.config[key] === 'function'));
            requiredConfigMethods.forEach(method => {
                if (typeof API.config[method] !== 'function') {
                    missingMethods.push(`API.config.${method}`);
                    isValid = false;
                    console.error(`缺少方法: API.config.${method}, 类型:`, typeof API.config[method]);
                } else {
                    console.log(`✓ API.config.${method} 可用`);
                }
            });
        }

        if (!isValid) {
            console.error('API模块验证失败，缺少方法:', missingMethods);
        } else {
            console.log('✅ API模块验证通过');
        }

        return isValid;
    },

    // 应用初始化
    async initApp() {
        try {
            // 1. 验证API模块
            const isAPIValid = this.validateAPIModule();
            if (!isAPIValid) {
                console.warn('API模块验证失败，部分功能可能不可用');
            }

            // 2. 检查网络状态
            await this.checkNetworkStatus();

            // 3. 初始化API配置
            this.initAPIConfig();

            // 4. 预加载关键数据（仅在API可用时）
            if (isAPIValid) {
                await this.preloadCriticalData();
            } else {
                console.warn('跳过数据预加载，API模块不可用');
            }

            // 5. 初始化用户信息
            await this.initUserInfo();

            // 6. 设置应用状态
            this.globalData.appState.isFirstLaunch = false;

        } catch (error) {
            console.error('应用初始化过程中出错:', error);
            throw error;
        }
    },

    // 检查网络状态
    checkNetworkStatus() {
        return new Promise((resolve) => {
            wx.getNetworkType({
                success: (res) => {
                    this.globalData.appState.networkStatus = res.networkType;
                    console.log('网络状态:', res.networkType);
                    resolve(res.networkType);
                },
                fail: () => {
                    this.globalData.appState.networkStatus = 'none';
                    resolve('none');
                }
            });
        });
    },

    // 初始化API配置
    initAPIConfig() {
        try {
            // 检查API模块是否正确加载
            if (!API || !API.config || typeof API.config.setEnvironment !== 'function') {
                console.error('API模块未正确加载或config对象不存在');
                return;
            }

            // 根据环境配置API
            const accountInfo = wx.getAccountInfoSync();
            const envVersion = accountInfo.miniProgram.envVersion;

            if (envVersion === 'develop') {
                // 开发环境
                API.config.setEnvironment('development');
                this.globalData.systemConfig.enableDebug = true;
                this.globalData.systemConfig.enableMock = true;
            } else if (envVersion === 'trial') {
                // 体验版
                API.config.setEnvironment('staging');
                this.globalData.systemConfig.enableDebug = false;
                this.globalData.systemConfig.enableMock = false;
            } else {
                // 正式版
                API.config.setEnvironment('production');
                this.globalData.systemConfig.enableDebug = false;
                this.globalData.systemConfig.enableMock = false;
            }

            console.log('API环境配置完成:', envVersion);
        } catch (error) {
            console.error('API配置初始化失败:', error);
            // 设置默认配置
            this.globalData.systemConfig.enableDebug = true;
            this.globalData.systemConfig.enableMock = true;
        }
    },

    // 预加载关键数据
    async preloadCriticalData() {
        try {
            // 并行预加载多个关键数据
            const preloadPromises = [
                this.preloadDeviceList(),
                this.preloadUserSettings(),
                this.preloadSystemConfig()
            ];

            await Promise.allSettled(preloadPromises);
            console.log('关键数据预加载完成');
        } catch (error) {
            console.warn('预加载数据失败:', error);
        }
    },

    // 预加载设备列表
    async preloadDeviceList() {
        try {
            // 检查API是否可用
            if (!API || typeof API.getDeviceList !== 'function') {
                console.warn('API.getDeviceList方法不可用，跳过设备列表预加载');
                return;
            }

            const deviceRes = await API.getDeviceList({ limit: 20 });
            if (deviceRes && deviceRes.success && deviceRes.data) {
                this.globalData.devices = deviceRes.data;
                console.log('设备列表预加载完成:', deviceRes.data.length);
            }
        } catch (error) {
            console.warn('设备列表预加载失败:', error);
        }
    },

    // 预加载用户设置
    async preloadUserSettings() {
        try {
            // 从本地存储加载用户设置
            const settings = wx.getStorageSync('userSettings');
            if (settings) {
                this.globalData.userSettings = settings;
                console.log('用户设置预加载完成');
            }
        } catch (error) {
            console.warn('用户设置预加载失败:', error);
        }
    },

    // 预加载系统配置
    async preloadSystemConfig() {
        try {
            // 从本地存储加载系统配置
            const config = wx.getStorageSync('systemConfig');
            if (config) {
                Object.assign(this.globalData.systemConfig, config);
                console.log('系统配置预加载完成');
            }
        } catch (error) {
            console.warn('系统配置预加载失败:', error);
        }
    },

    // 初始化用户信息
    async initUserInfo() {
        try {
            // 检查本地是否有用户信息
            const userInfo = wx.getStorageSync('userInfo');
            if (userInfo) {
                this.globalData.userInfo = userInfo;
                console.log('用户信息初始化完成');
            }
        } catch (error) {
            console.warn('用户信息初始化失败:', error);
        }
    },

    // 清理资源
    cleanupResources() {
        // 清理定时器
        if (this.globalData.timers) {
            Object.values(this.globalData.timers).forEach(timer => {
                if (timer) clearInterval(timer);
            });
            this.globalData.timers = {};
        }

        // 断开WebSocket连接
        if (this.globalData.socketTask) {
            this.globalData.socketTask.close();
            this.globalData.socketTask = null;
        }
    },

    // 错误上报
    reportError(error) {
        // 在生产环境中可以上报到错误监控服务
        if (!this.globalData.systemConfig.enableDebug) {
            // 这里可以集成错误监控服务
            console.log('错误上报:', error);
        }
    },

    // 获取设备信息
    getDeviceById(deviceId) {
        return this.globalData.devices.find(device => device.id === deviceId);
    },

    // 更新设备信息
    updateDevice(deviceId, updates) {
        const deviceIndex = this.globalData.devices.findIndex(device => device.id === deviceId);
        if (deviceIndex !== -1) {
            Object.assign(this.globalData.devices[deviceIndex], updates);
        }
    }
})
