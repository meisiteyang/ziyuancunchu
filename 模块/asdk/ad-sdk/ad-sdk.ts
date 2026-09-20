/**
 * 聚合广告 SDK - 主入口
 *
 * 使用方式：
 *   import { AdSdk, AdPlatform, AdEvent } from './ad-sdk';
 *   await AdSdk.init({ platform: AdPlatform.Xiaomi });
 *   const result = await AdSdk.requestAd({ cpId: 'cp_001', rewardType: 'extra_life', triggerScene: 'game_over' });
 */

import {
  AdPlatform,
  AdType,
  AdEvent,
  AdErrorCode,
  DevicePlatform,
  KeyCode,
  KeyAction,
} from './types/enums';
import {
  IAdSdk,
  IAdSdkConfig,
  IAdAdapter,
  IAdRequest,
  IAdRewardResult,
  IAdEventData,
  IDeviceInfo,
  IAccountInfo,
  IEventHandler,
  IKeyEvent,
  IKeyEventHandler,
} from './types/interfaces';
import { XiaomiAdapter } from './adapters/xiaomi-adapter';
import { EventEmitter } from './event-emitter';
import { Reporter, ActionType } from './reporters/reporter';

// ────────────────────────────────────────
// 适配器注册表
// ────────────────────────────────────────

const BUILTIN_ADAPTERS: Partial<Record<AdPlatform, new () => IAdAdapter>> = {};
BUILTIN_ADAPTERS[AdPlatform.Xiaomi] = XiaomiAdapter;

// ────────────────────────────────────────
// SDK 实现
// ────────────────────────────────────────

class AdSdkImpl implements IAdSdk {
  private _initialized: boolean;
  private _currentPlatform: AdPlatform;
  private _adapters: Map<AdPlatform, IAdAdapter>;
  private _emitter: EventEmitter;
  private _globalEventHandler: ((event: AdEvent, data: IAdEventData) => void) | null;
  private _keyHandlers: IKeyEventHandler[];
  private _adapterKeyHandler: IKeyEventHandler | null;

  constructor() {
    this._initialized = false;
    this._currentPlatform = AdPlatform.Xiaomi;
    this._adapters = new Map();
    this._emitter = new EventEmitter();
    this._globalEventHandler = null;
    this._keyHandlers = [];
    this._adapterKeyHandler = null;
  }

  get currentPlatform(): AdPlatform {
    return this._currentPlatform;
  }

  /**
   * 初始化 SDK
   * @param config
   */
  async init(config: IAdSdkConfig): Promise<void> {
    if (this._initialized) {
      console.warn('[AdSdk] Already initialized. Call destroy() first if you need to re-init.');
      return;
    }

    this._currentPlatform = config.platform;
    this._globalEventHandler = config.onEvent || null;

    if (config.customAdapters) {
      for (const adapter of config.customAdapters) {
        this._adapters.set(adapter.platform, adapter);
      }
    }

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

    const adapter = this._adapters.get(config.platform)!;
    const adapterConfig = (config.adapters && config.adapters[config.platform]) || {};
    await adapter.init(adapterConfig);

    const self = this;
    const events: AdEvent[] = Object.values(AdEvent) as AdEvent[];
    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      adapter.on(evt, function (data: IAdEventData) {
        self._emitter.emit(evt, data);
        if (self._globalEventHandler) {
          self._globalEventHandler(evt, data);
        }
      });
    }

    if (adapter.onKeyEvent) {
      self._adapterKeyHandler = function (keyEvent: IKeyEvent) {
        for (let j = 0; j < self._keyHandlers.length; j++) {
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
   * @returns
   */
  async getDeviceInfo(): Promise<IDeviceInfo> {
    this._ensureInit();
    const adapter = this._getAdapter();
    if (adapter.getDeviceInfo) {
      return adapter.getDeviceInfo();
    }
    throw new Error('[AdSdk] getDeviceInfo is not supported by the current adapter.');
  }

  /**
   * 获取玩家账户信息
   * @returns
   */
  async getAccount(): Promise<IAccountInfo> {
    this._ensureInit();
    const adapter = this._getAdapter();
    if (adapter.getAccount) {
      return adapter.getAccount();
    }
    throw new Error('[AdSdk] getAccount is not supported by the current adapter.');
  }

  /**
   * 请求播放广告
   * @param request
   * @returns
   */
  async requestAd(request: IAdRequest): Promise<IAdRewardResult> {
    this._ensureInit();
    return this._getAdapter().requestAd(request);
  }

  /**
   * 通知游戏加载完成
   * @param version
   */
  onGameReady(version: string): void {
    this._ensureInit();
    const adapter = this._getAdapter();
    if (adapter.onGameReady) {
      adapter.onGameReady(version);
    }
  }

  /** 通知游戏暂停 */
  onGamePause(): void {
    this._ensureInit();
    const adapter = this._getAdapter();
    if (adapter.onGamePause) {
      adapter.onGamePause();
    }
  }

  /** 通知游戏恢复 */
  onGameResume(): void {
    this._ensureInit();
    const adapter = this._getAdapter();
    if (adapter.onGameResume) {
      adapter.onGameResume();
    }
  }

  /**
   * 退出游戏
   * @returns
   */
  async exitGame(): Promise<void> {
    this._ensureInit();
    const adapter = this._getAdapter();
    if (adapter.exitGame) {
      return adapter.exitGame();
    }
  }

  /**
   * 监听广告事件
   * @param event
   * @param handler
   */
  on(event: AdEvent, handler: IEventHandler): void {
    this._emitter.on(event, handler);
  }

  /**
   * 取消监听
   * @param event
   * @param handler
   */
  off(event: AdEvent, handler?: IEventHandler): void {
    this._emitter.off(event, handler);
  }

  /**
   * 监听遥控器按键事件
   * @param handler - 回调函数，接收 { key, action } 对象
   */
  onKeyEvent(handler: IKeyEventHandler): void {
    if (typeof handler === 'function' && this._keyHandlers.indexOf(handler) === -1) {
      this._keyHandlers.push(handler);
    }
  }

  /**
   * 取消监听遥控器按键事件
   * @param handler - 不传则清除所有
   */
  offKeyEvent(handler?: IKeyEventHandler): void {
    if (!handler) {
      this._keyHandlers = [];
    } else {
      const idx = this._keyHandlers.indexOf(handler);
      if (idx !== -1) {
        this._keyHandlers.splice(idx, 1);
      }
    }
  }

  /**
   * 切换广告平台
   * @param platform
   */
  switchPlatform(platform: AdPlatform): void {
    if (platform === this._currentPlatform) return;

    const adapter = this._adapters.get(platform);
    if (!adapter) {
      throw new Error('[AdSdk] Platform "' + platform + '" not registered. Init with it first.');
    }

    this._currentPlatform = platform;
    console.log('[AdSdk] Switched to platform: ' + platform);
  }

  /** 销毁 SDK */
  destroy(): void {
    const adapter = this._getAdapter();
    if (adapter && adapter.offKeyEvent && this._adapterKeyHandler) {
      adapter.offKeyEvent(this._adapterKeyHandler);
    }

    for (const adp of this._adapters.values()) {
      adp.destroy();
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

  private _ensureInit(): void {
    if (!this._initialized) {
      throw new Error('[AdSdk] SDK not initialized. Call AdSdk.init() first.');
    }
  }

  private _getAdapter(): IAdAdapter {
    return this._adapters.get(this._currentPlatform)!;
  }
}

// ────────────────────────────────────────
// 导出单例
// ────────────────────────────────────────

export const AdSdk: IAdSdk = new AdSdkImpl();

export {
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

  // 类
  XiaomiAdapter,
  EventEmitter,
};

export type {
  IAdSdk,
  IAdSdkConfig,
  IAdAdapter,
  IAdapterConfig,
  IAdRequest,
  IAdRewardResult,
  IAdClosedResult,
  IAdError,
  IDeviceInfo,
  IAccountInfo,
  IAdEventData,
  IEventHandler,
  IKeyEvent,
  IKeyEventHandler,
  IReporterConfig,
  IReportItem,
} from './types/interfaces';
