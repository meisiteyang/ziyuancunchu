/**
 * 聚合广告 SDK - 事件发射器类型声明
 */

import { AdEvent, IAdEventData, IEventHandler } from './types';

export declare class EventEmitter {
  on(event: AdEvent, handler: IEventHandler): void;
  off(event: AdEvent, handler?: IEventHandler): void;
  emit(event: AdEvent, data: IAdEventData): void;
  removeAllListeners(): void;
}
