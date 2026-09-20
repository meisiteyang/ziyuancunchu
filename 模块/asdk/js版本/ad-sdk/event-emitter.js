/**
 * 聚合广告 SDK - 简易事件发射器
 */

const { AdEvent } = require('./types/enums');

class EventEmitter {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._handlers = new Map();
  }

  /**
   * 监听事件
   * @param {string} event - 事件名（AdEvent 枚举值）
   * @param {Function} handler - 事件处理函数
   */
  on(event, handler) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event).add(handler);
  }

  /**
   * 取消监听
   * @param {string} event - 事件名
   * @param {Function} [handler] - 不传则移除该事件所有监听
   */
  off(event, handler) {
    if (!handler) {
      this._handlers.delete(event);
      return;
    }
    const set = this._handlers.get(event);
    if (set) {
      set.delete(handler);
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    const set = this._handlers.get(event);
    if (set) {
      set.forEach((handler) => {
        try {
          handler(data);
        } catch (e) {
          console.error('[AdSdk] Event handler error on "' + event + '":', e);
        }
      });
    }
  }

  /** 移除所有监听 */
  removeAllListeners() {
    this._handlers.clear();
  }
}

module.exports = { EventEmitter };
