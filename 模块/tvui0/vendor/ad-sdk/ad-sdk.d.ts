/**
 * 聚合广告 SDK - 主入口类型声明
 */

import { AdPlatform, AdEvent } from './types/enums';
import {
  IAdSdk,
  IAdSdkConfig,
  IAdRequest,
  IAdRewardResult,
  IDeviceInfo,
  IEventHandler,
} from './types/interfaces';

/** SDK 单例 */
export declare const AdSdk: IAdSdk;

// 枚举
export { AdPlatform, AdType, AdEvent, AdErrorCode, DevicePlatform } from './types/enums';

// 接口（type-only）
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
  IAdEventData,
  IEventHandler,
} from './types/interfaces';

// 类
export { XiaomiAdapter } from './adapters/xiaomi-adapter';
export { EventEmitter } from './event-emitter';
