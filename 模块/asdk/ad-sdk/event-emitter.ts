/**
 * 聚合广告 SDK - 简易事件发射器
 */

import { AdEvent } from './types/enums';
import { IAdEventData, IEventHandler } from './types/interfaces';

export class EventEmitter {
  private _handlers: Map<string, Set<IEventHandler>>;

  constructor() {
    this._handlers = new Map();
  }

  /**
   * 监听事件
   * @param event - 事件名（AdEvent 枚举值）
   * @param handler - 事件处理函数
   */
  on(event: AdEvent, handler: IEventHandler): void {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event)!.add(handler);
  }

  /**
   * 取消监听
   * @param event - 事件名
   * @param handler - 不传则移除该事件所有监听
   */
  off(event: AdEvent, handler?: IEventHandler): void {
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
   * @param event - 事件名
   * @param data - 事件数据
   */
  emit(event: AdEvent, data: IAdEventData): void {
    const set = this._handlers.get(event);
    if (set) {
      set.forEach((handler: IEventHandler) => {
        try {
          handler(data);
        } catch (e) {
          console.error('[AdSdk] Event handler error on "' + event + '":', e);
        }
      });
    }
  }

  /** 移除所有监听 */
  removeAllListeners(): void {
    this._handlers.clear();
  }
}
