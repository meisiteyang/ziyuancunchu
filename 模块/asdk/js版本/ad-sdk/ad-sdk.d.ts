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
  IAccountInfo,
  IEventHandler,
  IKeyEventHandler,
} from './types/interfaces';

/** SDK 单例 */
export declare const AdSdk: IAdSdk;

// 枚举
export { AdPlatform, AdType, AdEvent, AdErrorCode, DevicePlatform, KeyCode, KeyAction } from './types/enums';

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
  IAccountInfo,
  IAdEventData,
  IEventHandler,
  IKeyEvent,
  IKeyEventHandler,
} from './types/interfaces';

// 类
export { XiaomiAdapter } from './adapters/xiaomi-adapter';
export { EventEmitter } from './event-emitter';

// 数据上报
export { Reporter, ActionType } from './reporters/reporter';

// 排行榜
export { Leaderboard } from './leaderboard/leaderboard';

// 上报接口类型
export type {
  IReporterConfig,
  IReportItem,
  ILeaderboardConfig,
  IAddPointParams,
  IRankItem,
  IRankResult,
} from './types/interfaces';
