/**
 * 聚合广告 SDK - 小米电视适配器
 *
 * 底层通过 JSBridge 与电视应用商店客户端通信：
 *   H5 → Native:  window.AppBridge.call(json)
 *   Native → H5:  window.onNativeBridgeCallback(action, data)
 */

const { AdPlatform, AdEvent, AdErrorCode } = require('../types/enums');
const { EventEmitter } = require('../event-emitter');
const KEY_EVENT_NAME = '__key_event__';

// ────────────────────────────────────────
// JSBridge 底层封装
// ────────────────────────────────────────

/** 获取 JSBridge 全局对象 */
function getAppBridge() {
  if (typeof window === 'undefined') return null;
  return window.AppBridge || null;
}

/** 检测是否在原生环境中 */
function isNativeEnv() {
  return !!getAppBridge();
}

/** 调用 JSBridge */
function bridgeCall(msg) {
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

class XiaomiAdapter {
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
   * @param {import('../types/interfaces').IAdapterConfig} config
   */
  async init(config) {
    this._config = config || {};

    // 保存已有的 onNativeBridgeCallback，避免覆盖
    if (typeof window !== 'undefined' && window.onNativeBridgeCallback) {
      this._originalCallback = window.onNativeBridgeCallback;
    }

    // 注册全局回调
    const self = this;
    window.onNativeBridgeCallback = function (action, data) {
      // 先调用原有回调
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
   * @param {import('../types/interfaces').IAdRequest} request
   * @returns {Promise<import('../types/interfaces').IAdRewardResult>}
   */
  requestAd(request) {
    const self = this;
    return new Promise(function (resolve, reject) {
      if (!isNativeEnv()) {
        reject({
          code: AdErrorCode.PlatformNotSupported,
          message: 'Not in native JSBridge environment',
          platform: self.platform,
          requestId: '',
        });
        return;
      }

      if (self._adInProgress) {
        reject({
          code: AdErrorCode.AdInProgress,
          message: 'An ad is already in progress',
          platform: self.platform,
          requestId: '',
        });
        return;
      }

      self._adInProgress = true;
      const callbackId = 'ad_' + (++self._cbId);

      self._callbacks.set(callbackId, { resolve: resolve, reject: reject });

      // 发出 loaded 事件
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
   * @returns {Promise<import('../types/interfaces').IDeviceInfo>}
   */
  getDeviceInfo() {
    const self = this;
    return new Promise(function (resolve, reject) {
      if (!isNativeEnv()) {
        reject({
          code: AdErrorCode.PlatformNotSupported,
          message: 'Not in native JSBridge environment',
          platform: self.platform,
          requestId: '',
        });
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
   * @returns {Promise<import('../types/interfaces').IAccountInfo>}
   */
  getAccount() {
    const self = this;
    return new Promise(function (resolve, reject) {
      if (!isNativeEnv()) {
        reject({
          code: AdErrorCode.PlatformNotSupported,
          message: 'Not in native JSBridge environment',
          platform: self.platform,
          requestId: '',
        });
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
   * @param {string} version
   */
  onGameReady(version) {
    bridgeCall({
      action: 'onGameReady',
      data: { version: version },
    });
  }

  /** 通知游戏暂停 */
  onGamePause() {
    bridgeCall({
      action: 'onGamePause',
      data: {},
    });
  }

  /** 通知游戏恢复 */
  onGameResume() {
    bridgeCall({
      action: 'onGameResume',
      data: {},
    });
  }

  /**
   * 退出游戏
   * @returns {Promise<void>}
   */
  exitGame() {
    const self = this;
    return new Promise(function (resolve) {
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
   * 监听事件
   * @param {string} event
   * @param {Function} handler
   */
  on(event, handler) {
    this._emitter.on(event, handler);
  }

  /**
   * 取消事件
   * @param {string} event
   * @param {Function} [handler]
   */
  off(event, handler) {
    this._emitter.off(event, handler);
  }

  /** 销毁适配器 */
  destroy() {
    this._callbacks.clear();
    this._deviceCallbacks.clear();
    this._accountCallbacks.clear();
    this._emitter.removeAllListeners();
    this._adInProgress = false;
    this._exitResolve = null;
    this._keyHandlers = [];

    // 恢复原有回调
    if (this._originalCallback && typeof window !== 'undefined') {
      window.onNativeBridgeCallback = this._originalCallback;
    }
  }

  // ────────────────────────────────────────
  // 内部方法
  // ────────────────────────────────────────

  /** @private 处理 Native 回调 */
  _handleNativeCallback(action, data) {
    console.log(`[AdSdk:Xiaomi] Received native callback: ${action}`, data);
    switch (action) {
      // ── 通用回调（getDeviceInfo / getAccount 等） ──
      case 'onBridgeCallback': {
        const cbId = data.callbackId;
        const code = data.code;

        // getDeviceInfo 回调
        if (this._deviceCallbacks.has(cbId)) {
          const entry = this._deviceCallbacks.get(cbId);
          this._deviceCallbacks.delete(cbId);
          if (code === 0) {
            entry.resolve(data.data || {});
          } else {
            entry.reject({
              code: code,
              message: data.message || 'getDeviceInfo failed',
              platform: this.platform,
              requestId: cbId,
            });
          }
          return;
        }

        // getAccount 回调
        if (this._accountCallbacks.has(cbId)) {
          const entry = this._accountCallbacks.get(cbId);
          this._accountCallbacks.delete(cbId);
          if (code === 0) {
            entry.resolve(data.data || {});
          } else {
            entry.reject({
              code: code,
              message: data.message || 'getAccount failed',
              platform: this.platform,
              requestId: cbId,
            });
          }
          return;
        }
        break;
      }

      // ── 广告奖励 ──
      case 'onReward': {
        const cbId = data.callbackId;
        const result = {
          isCompleted: true,
          requestId: cbId,
        };
        this._adInProgress = false;

        this._emitter.emit(AdEvent.Reward, result);

        if (this._callbacks.has(cbId)) {
          const entry = this._callbacks.get(cbId);
          this._callbacks.delete(cbId);
          entry.resolve(result);
        }
        break;
      }

      // ── 广告关闭 ──
      case 'onAdClosed': {
        const cbId = data.callbackId;
        const isCompleted = !!data.is_completed;
        const closedResult = {
          isCompleted: isCompleted,
          requestId: cbId,
        };
        this._adInProgress = false;

        this._emitter.emit(AdEvent.Closed, closedResult);

        if (this._callbacks.has(cbId)) {
          const entry = this._callbacks.get(cbId);
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
            });
          }
        }
        break;
      }

      // ── 广告失败 ──
      case 'onAdFailed': {
        const cbId = data.callbackId;
        const errorCode = data.code;
        const errorMsg = data.message;
        this._adInProgress = false;

        const adError = {
          code: errorCode,
          message: errorMsg,
          platform: this.platform,
          requestId: cbId,
        };

        this._emitter.emit(AdEvent.Error, adError);

        if (this._callbacks.has(cbId)) {
          const entry = this._callbacks.get(cbId);
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
        var keyEvent = {
          key: data.key || '',
          action: data.action || 'down',
        };
        for (var i = 0; i < this._keyHandlers.length; i++) {
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

module.exports = { XiaomiAdapter };
