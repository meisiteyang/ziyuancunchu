/**
 * 聚合广告 SDK - 主入口
 *
 * 使用方式：
 *   const { AdSdk, AdPlatform, AdEvent } = require('./ad-sdk');
 *   await AdSdk.init({ platform: AdPlatform.Xiaomi });
 *   const result = await AdSdk.requestAd({ cpId: 'cp_001', rewardType: 'extra_life', triggerScene: 'game_over' });
 *
 * TS 项目中：
 *   import { AdSdk, AdPlatform } from './ad-sdk';
 */

const { AdPlatform, AdEvent, AdErrorCode } = require('./types/enums');
const { XiaomiAdapter } = require('./adapters/xiaomi-adapter');
const { EventEmitter } = require('./event-emitter');
const { Reporter, ActionType } = require('./reporters/reporter');
const { Leaderboard } = require('./leaderboard/leaderboard');
const KEY_EVENT_NAME = '__key_event__';

// ────────────────────────────────────────
// 适配器注册表
// ────────────────────────────────────────

const BUILTIN_ADAPTERS = {};
BUILTIN_ADAPTERS[AdPlatform.Xiaomi] = XiaomiAdapter;
// 后续扩展：
// BUILTIN_ADAPTERS[AdPlatform.Huawei] = HuaweiAdapter;
// BUILTIN_ADAPTERS[AdPlatform.Tencent] = TencentAdapter;

// ────────────────────────────────────────
// SDK 实现
// ────────────────────────────────────────

class AdSdkImpl {
  constructor() {
    this._initialized = false;
    this._currentPlatform = AdPlatform.Xiaomi;
    this._adapters = new Map();
    this._emitter = new EventEmitter();
    this._globalEventHandler = null;
    this._keyHandlers = [];
    this._adapterKeyHandler = null;
  }

  get currentPlatform() {
    return this._currentPlatform;
  }

  /**
   * 初始化 SDK
   * @param {import('./types/interfaces').IAdSdkConfig} config
   */
  async init(config) {
    if (this._initialized) {
      console.warn('[AdSdk] Already initialized. Call destroy() first if you need to re-init.');
      return;
    }

    this._currentPlatform = config.platform;
    this._globalEventHandler = config.onEvent || null;

    // 注册自定义适配器
    if (config.customAdapters) {
      for (const adapter of config.customAdapters) {
        this._adapters.set(adapter.platform, adapter);
      }
    }

    // 注册内置适配器（不覆盖自定义的）
    if (!this._adapters.has(config.platform)) {
      const AdapterClass = BUILTIN_ADAPTERS[config.platform];
      if (!AdapterClass) {
        throw new Error(
          '[AdSdk] No adapter found for platform "' + config.platform + '". ' +
          'Available: ' + Object.keys(BUILTIN_ADAPTERS).join(', ') + '. ' +
          'You can also provide a custom adapter via config.customAdapters.'
        );
      }
      const instance = new AdapterClass();
      this._adapters.set(config.platform, instance);
    }

    // 初始化当前平台的适配器
    const adapter = this._adapters.get(config.platform);
    const adapterConfig = (config.adapters && config.adapters[config.platform]) || {};
    await adapter.init(adapterConfig);

    // 桥接适配器事件到全局
    const self = this;
    const events = Object.values(AdEvent);
    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      adapter.on(evt, function (data) {
        self._emitter.emit(evt, data);
        if (self._globalEventHandler) {
          self._globalEventHandler(evt, data);
        }
      });
    }

    // 桥接适配器的按键事件
    if (adapter.onKeyEvent) {
      self._adapterKeyHandler = function (keyEvent) {
        for (var j = 0; j < self._keyHandlers.length; j++) {
          try {
            self._keyHandlers[j](keyEvent);
          } catch (e) {
            console.error('[AdSdk] Key event handler error:', e);
          }
        }
      };
      adapter.onKeyEvent(self._adapterKeyHandler);
    }

    this._initialized = true;
    console.log('[AdSdk] Initialized with platform: ' + config.platform);
  }

  /**
   * 获取设备信息
   * @returns {Promise<import('./types/interfaces').IDeviceInfo>}
   */
  async getDeviceInfo() {
    this._ensureInit();
    const adapter = this._getAdapter();
    if (adapter.getDeviceInfo) {
      return adapter.getDeviceInfo();
    }
    throw new Error('[AdSdk] getDeviceInfo is not supported by the current adapter.');
  }

  /**
   * 获取玩家账户信息
   * @returns {Promise<import('./types/interfaces').IAccountInfo>}
   */
  async getAccount() {
    this._ensureInit();
    const adapter = this._getAdapter();
    if (adapter.getAccount) {
      return adapter.getAccount();
    }
    throw new Error('[AdSdk] getAccount is not supported by the current adapter.');
  }

  /**
   * 请求播放广告
   * @param {import('./types/interfaces').IAdRequest} request
   * @returns {Promise<import('./types/interfaces').IAdRewardResult>}
   */
  async requestAd(request) {
    this._ensureInit();
    return this._getAdapter().requestAd(request);
  }

  /**
   * 通知游戏加载完成
   * @param {string} version
   */
  onGameReady(version) {
    this._ensureInit();
    const adapter = this._getAdapter();
    if (adapter.onGameReady) {
      adapter.onGameReady(version);
    }
  }

  /** 通知游戏暂停 */
  onGamePause() {
    this._ensureInit();
    const adapter = this._getAdapter();
    if (adapter.onGamePause) {
      adapter.onGamePause();
    }
  }

  /** 通知游戏恢复 */
  onGameResume() {
    this._ensureInit();
    const adapter = this._getAdapter();
    if (adapter.onGameResume) {
      adapter.onGameResume();
    }
  }

  /**
   * 退出游戏
   * @returns {Promise<void>}
   */
  async exitGame() {
    this._ensureInit();
    const adapter = this._getAdapter();
    if (adapter.exitGame) {
      return adapter.exitGame();
    }
  }

  /**
   * 监听广告事件
   * @param {string} event
   * @param {Function} handler
   */
  on(event, handler) {
    this._emitter.on(event, handler);
  }

  /**
   * 取消监听
   * @param {string} event
   * @param {Function} [handler]
   */
  off(event, handler) {
    this._emitter.off(event, handler);
  }

  /**
   * 监听遥控器按键事件
   * @param {Function} handler - 回调函数，接收 { key, action } 对象
   */
  onKeyEvent(handler) {
    if (typeof handler === 'function' && this._keyHandlers.indexOf(handler) === -1) {
      this._keyHandlers.push(handler);
    }
  }

  /**
   * 取消监听遥控器按键事件
   * @param {Function} [handler] - 不传则清除所有
   */
  offKeyEvent(handler) {
    if (!handler) {
      this._keyHandlers = [];
    } else {
      var idx = this._keyHandlers.indexOf(handler);
      if (idx !== -1) {
        this._keyHandlers.splice(idx, 1);
      }
    }
  }

  /**
   * 切换广告平台
   * @param {string} platform
   */
  switchPlatform(platform) {
    if (platform === this._currentPlatform) return;

    const adapter = this._adapters.get(platform);
    if (!adapter) {
      throw new Error('[AdSdk] Platform "' + platform + '" not registered. Init with it first.');
    }

    this._currentPlatform = platform;
    console.log('[AdSdk] Switched to platform: ' + platform);
  }

  /** 销毁 SDK */
  destroy() {
    // 清理适配器的按键桥接
    const adapter = this._getAdapter();
    if (adapter && adapter.offKeyEvent && this._adapterKeyHandler) {
      adapter.offKeyEvent(this._adapterKeyHandler);
    }

    for (const adapter of this._adapters.values()) {
      adapter.destroy();
    }
    this._adapters.clear();
    this._emitter.removeAllListeners();
    this._globalEventHandler = null;
    this._keyHandlers = [];
    this._adapterKeyHandler = null;
    this._initialized = false;
  }

  // ────────────────────────────────────────
  // 内部
  // ────────────────────────────────────────

  _ensureInit() {
    if (!this._initialized) {
      throw new Error('[AdSdk] SDK not initialized. Call AdSdk.init() first.');
    }
  }

  _getAdapter() {
    return this._adapters.get(this._currentPlatform);
  }
}

// ────────────────────────────────────────
// 导出单例
// ────────────────────────────────────────

const AdSdk = new AdSdkImpl();

// 命名导出
const { AdType, DevicePlatform, KeyCode, KeyAction } = require('./types/enums');

module.exports = {
  // 单例
  AdSdk,

  // 枚举
  AdPlatform,
  AdType,
  AdEvent,
  AdErrorCode,
  DevicePlatform,
  KeyCode,
  KeyAction,

  // 数据上报
  Reporter,
  ActionType,

  // 排行榜
  Leaderboard,

  // 类
  XiaomiAdapter,
  EventEmitter,
};
