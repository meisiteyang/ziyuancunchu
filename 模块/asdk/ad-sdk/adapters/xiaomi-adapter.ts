/**
 * 聚合广告 SDK - 小米电视适配器
 *
 * 底层通过 JSBridge 与电视应用商店客户端通信：
 *   H5 → Native:  window.AppBridge.call(json)
 *   Native → H5:  window.onNativeBridgeCallback(action, data)
 */

import { AdPlatform, AdEvent, AdErrorCode } from '../types/enums';
import {
  IAdAdapter,
  IAdapterConfig,
  IAdRequest,
  IAdRewardResult,
  IAdError,
  IDeviceInfo,
  IAccountInfo,
  IEventHandler,
  IKeyEvent,
  IKeyEventHandler,
} from '../types/interfaces';
import { EventEmitter } from '../event-emitter';

// ────────────────────────────────────────
// JSBridge 底层封装
// ────────────────────────────────────────

interface AppBridge {
  call: (json: string) => void;
}

interface BridgeMessage {
  action: string;
  data: Record<string, any>;
  callbackId?: string;
}

interface NativeCallbackData {
  callbackId?: string;
  code?: number;
  message?: string;
  data?: any;
  is_completed?: boolean;
  key?: string;
  action?: string;
  [key: string]: any;
}

interface CallbackEntry {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

/** 获取 JSBridge 全局对象 */
function getAppBridge(): AppBridge | null {
  if (typeof window === 'undefined') return null;
  return (window as any).AppBridge || null;
}

/** 检测是否在原生环境中 */
function isNativeEnv(): boolean {
  return !!getAppBridge();
}

/** 调用 JSBridge */
function bridgeCall(msg: BridgeMessage): void {
  const bridge = getAppBridge();
  if (!bridge) {
    console.warn('[AdSdk:Xiaomi] Not in native environment, bridge call ignored.');
    return;
  }
  bridge.call(JSON.stringify(msg));
}

// ────────────────────────────────────────
// 适配器实现
// ────────────────────────────────────────

export class XiaomiAdapter implements IAdAdapter {
  readonly platform: AdPlatform;
  private _config: IAdapterConfig;
  private _emitter: EventEmitter;
  private _cbId: number;
  private _callbacks: Map<string, CallbackEntry>;
  private _deviceCallbacks: Map<string, CallbackEntry>;
  private _accountCallbacks: Map<string, CallbackEntry>;
  private _adInProgress: boolean;
  private _originalCallback: ((action: string, data: NativeCallbackData) => void) | null;
  private _exitResolve: (() => void) | null;
  private _keyHandlers: IKeyEventHandler[];

  constructor() {
    this.platform = AdPlatform.Xiaomi;
    this._config = {};
    this._emitter = new EventEmitter();
    this._cbId = 0;
    this._callbacks = new Map();
    this._deviceCallbacks = new Map();
    this._accountCallbacks = new Map();
    this._adInProgress = false;
    this._originalCallback = null;
    this._exitResolve = null;
    this._keyHandlers = [];
  }

  /**
   * 初始化适配器
   * @param config
   */
  async init(config: IAdapterConfig): Promise<void> {
    this._config = config || {};

    if (typeof window !== 'undefined' && (window as any).onNativeBridgeCallback) {
      this._originalCallback = (window as any).onNativeBridgeCallback;
    }

    const self = this;
    (window as any).onNativeBridgeCallback = function (action: string, data: NativeCallbackData) {
      if (self._originalCallback) {
        try {
          self._originalCallback(action, data);
        } catch (_) {
          // ignore
        }
      }
      self._handleNativeCallback(action, data);
    };

    console.log('[AdSdk:Xiaomi] Adapter initialized.');
  }

  /**
   * 请求播放广告
   * @param request
   * @returns
   */
  requestAd(request: IAdRequest): Promise<IAdRewardResult> {
    const self = this;
    return new Promise<IAdRewardResult>(function (resolve, reject) {
      if (!isNativeEnv()) {
        reject({
          code: AdErrorCode.PlatformNotSupported,
          message: 'Not in native JSBridge environment',
          platform: self.platform,
          requestId: '',
        } as IAdError);
        return;
      }

      if (self._adInProgress) {
        reject({
          code: AdErrorCode.AdInProgress,
          message: 'An ad is already in progress',
          platform: self.platform,
          requestId: '',
        } as IAdError);
        return;
      }

      self._adInProgress = true;
      const callbackId = 'ad_' + (++self._cbId);

      self._callbacks.set(callbackId, { resolve: resolve, reject: reject });

      self._emitter.emit(AdEvent.Loaded, { request: request });

      bridgeCall({
        action: 'requestAd',
        data: {
          cp_id: request.cpId || self._config.cpId,
          reward_type: request.rewardType,
          trigger_scene: request.triggerScene,
          ...(request.extra || {}),
        },
        callbackId: callbackId,
      });
    });
  }

  /**
   * 获取设备信息
   * @returns
   */
  getDeviceInfo(): Promise<IDeviceInfo> {
    const self = this;
    return new Promise<IDeviceInfo>(function (resolve, reject) {
      if (!isNativeEnv()) {
        reject({
          code: AdErrorCode.PlatformNotSupported,
          message: 'Not in native JSBridge environment',
          platform: self.platform,
          requestId: '',
        } as IAdError);
        return;
      }

      const callbackId = 'dev_' + (++self._cbId);
      self._deviceCallbacks.set(callbackId, { resolve: resolve, reject: reject });

      bridgeCall({
        action: 'getDeviceInfo',
        data: {},
        callbackId: callbackId,
      });
    });
  }

  /**
   * 获取玩家账户信息
   * @returns
   */
  getAccount(): Promise<IAccountInfo> {
    const self = this;
    return new Promise<IAccountInfo>(function (resolve, reject) {
      if (!isNativeEnv()) {
        reject({
          code: AdErrorCode.PlatformNotSupported,
          message: 'Not in native JSBridge environment',
          platform: self.platform,
          requestId: '',
        } as IAdError);
        return;
      }

      const callbackId = 'acc_' + (++self._cbId);
      self._accountCallbacks.set(callbackId, { resolve: resolve, reject: reject });

      bridgeCall({
        action: 'getAccount',
        data: {},
        callbackId: callbackId,
      });
    });
  }

  /**
   * 通知游戏加载完成
   * @param version
   */
  onGameReady(version: string): void {
    bridgeCall({
      action: 'onGameReady',
      data: { version: version },
    });
  }

  /** 通知游戏暂停 */
  onGamePause(): void {
    bridgeCall({
      action: 'onGamePause',
      data: {},
    });
  }

  /** 通知游戏恢复 */
  onGameResume(): void {
    bridgeCall({
      action: 'onGameResume',
      data: {},
    });
  }

  /**
   * 退出游戏
   * @returns
   */
  exitGame(): Promise<void> {
    const self = this;
    return new Promise<void>(function (resolve) {
      if (!isNativeEnv()) {
        resolve();
        return;
      }
      self._exitResolve = resolve;
      bridgeCall({
        action: 'exitGame',
        data: {},
      });
    });
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
   * 监听事件
   * @param event
   * @param handler
   */
  on(event: AdEvent, handler: IEventHandler): void {
    this._emitter.on(event, handler);
  }

  /**
   * 取消事件
   * @param event
   * @param handler
   */
  off(event: AdEvent, handler?: IEventHandler): void {
    this._emitter.off(event, handler);
  }

  /** 销毁适配器 */
  destroy(): void {
    this._callbacks.clear();
    this._deviceCallbacks.clear();
    this._accountCallbacks.clear();
    this._emitter.removeAllListeners();
    this._adInProgress = false;
    this._exitResolve = null;
    this._keyHandlers = [];

    if (this._originalCallback && typeof window !== 'undefined') {
      (window as any).onNativeBridgeCallback = this._originalCallback;
    }
  }

  // ────────────────────────────────────────
  // 内部方法
  // ────────────────────────────────────────

  /** @private 处理 Native 回调 */
  private _handleNativeCallback(action: string, data: NativeCallbackData): void {
    console.log(`[AdSdk:Xiaomi] Received native callback: ${action}`, data);
    switch (action) {
      // ── 通用回调（getDeviceInfo / getAccount 等） ──
      case 'onBridgeCallback': {
        const cbId = data.callbackId!;
        const code = data.code!;

        if (this._deviceCallbacks.has(cbId)) {
          const entry = this._deviceCallbacks.get(cbId)!;
          this._deviceCallbacks.delete(cbId);
          if (code === 0) {
            entry.resolve(data.data || {});
          } else {
            entry.reject({
              code: code,
              message: data.message || 'getDeviceInfo failed',
              platform: this.platform,
              requestId: cbId,
            } as IAdError);
          }
          return;
        }

        if (this._accountCallbacks.has(cbId)) {
          const entry = this._accountCallbacks.get(cbId)!;
          this._accountCallbacks.delete(cbId);
          if (code === 0) {
            entry.resolve(data.data || {});
          } else {
            entry.reject({
              code: code,
              message: data.message || 'getAccount failed',
              platform: this.platform,
              requestId: cbId,
            } as IAdError);
          }
          return;
        }
        break;
      }

      // ── 广告奖励 ──
      case 'onReward': {
        const cbId = data.callbackId!;
        const result: IAdRewardResult = {
          isCompleted: true,
          requestId: cbId,
        };
        this._adInProgress = false;

        this._emitter.emit(AdEvent.Reward, result);

        if (this._callbacks.has(cbId)) {
          const entry = this._callbacks.get(cbId)!;
          this._callbacks.delete(cbId);
          entry.resolve(result);
        }
        break;
      }

      // ── 广告关闭 ──
      case 'onAdClosed': {
        const cbId = data.callbackId!;
        const isCompleted = !!data.is_completed;
        const closedResult = {
          isCompleted: isCompleted,
          requestId: cbId,
        };
        this._adInProgress = false;

        this._emitter.emit(AdEvent.Closed, closedResult);

        if (this._callbacks.has(cbId)) {
          const entry = this._callbacks.get(cbId)!;
          this._callbacks.delete(cbId);

          if (isCompleted) {
            entry.resolve({
              isCompleted: true,
              requestId: cbId,
            });
          } else {
            entry.reject({
              code: AdErrorCode.Unknown,
              message: 'Ad closed by user before completion',
              platform: this.platform,
              requestId: cbId,
            } as IAdError);
          }
        }
        break;
      }

      // ── 广告失败 ──
      case 'onAdFailed': {
        const cbId = data.callbackId!;
        const errorCode = data.code!;
        const errorMsg = data.message!;
        this._adInProgress = false;

        const adError: IAdError = {
          code: errorCode,
          message: errorMsg,
          platform: this.platform,
          requestId: cbId,
        };

        this._emitter.emit(AdEvent.Error, adError);

        if (this._callbacks.has(cbId)) {
          const entry = this._callbacks.get(cbId)!;
          this._callbacks.delete(cbId);
          entry.reject(adError);
        }
        break;
      }

      // ── 退出确认 ──
      case 'onExitConfirmed': {
        if (this._exitResolve) {
          this._exitResolve();
          this._exitResolve = null;
        }
        break;
      }

      // ── 遥控器按键 ──
      case 'onKeyEvent': {
        const keyEvent: IKeyEvent = {
          key: data.key || '',
          action: data.action || 'down',
        };
        for (let i = 0; i < this._keyHandlers.length; i++) {
          try {
            this._keyHandlers[i](keyEvent);
          } catch (e) {
            console.error('[AdSdk:Xiaomi] Key event handler error:', e);
          }
        }
        break;
      }
    }
  }
}
