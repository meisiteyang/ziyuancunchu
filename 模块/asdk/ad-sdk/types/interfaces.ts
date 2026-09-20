/**
 * 聚合广告 SDK - 接口类型定义
 */

import {
  AdPlatform,
  AdType,
  AdEvent,
  AdErrorCode,
  DevicePlatform,
  KeyCode,
  KeyAction,
} from './enums';

// ────────────────────────────────────────
// 设备信息
// ────────────────────────────────────────

/** 设备信息 */
export interface IDeviceInfo {
  /** 运行平台：tv / mobile / tablet */
  platform: DevicePlatform | string;
  /** 操作系统版本 */
  osVersion: string;
  /** 设备型号 */
  model: string;
}

// ────────────────────────────────────────
// 玩家账户信息
// ────────────────────────────────────────

/** 玩家账户信息 */
export interface IAccountInfo {
  /** 用户唯一标识 */
  uid: string;
  /** 用户昵称 */
  nickname: string;
  /** 用户头像 URL */
  avatar: string;
}

// ────────────────────────────────────────
// 遥控器按键
// ────────────────────────────────────────

/** 遥控器按键事件 */
export interface IKeyEvent {
  /** 按键名称 */
  key: KeyCode | string;
  /** 按键动作：down=按下，up=松开 */
  action: KeyAction | string;
}

/** 按键事件处理函数 */
export type IKeyEventHandler = (event: IKeyEvent) => void;

// ────────────────────────────────────────
// 数据上报
// ────────────────────────────────────────

/** 上报初始化配置 */
export interface IReporterConfig {
  /** 上报接口地址（不传则使用默认地址） */
  reportUrl?: string;
  /** 自定义请求头 */
  headers?: Array<{ name: string; value: string }>;
  /** 默认行为类型（默认 '曝光'） */
  defaultActionType?: string;
  /** 项目编码 */
  appItem?: string;
  /** 内容类型（默认 '游戏'） */
  contentType?: string;
  /** 游戏 ID */
  contentId?: string;
  /** 游戏名 */
  contentTitle?: string;
}

/** 上报数据项 */
export interface IReportItem {
  /** 用户唯一标识 */
  userId?: string;
  /** 设备唯一标识 */
  deviceId?: string;
  /** 项目编码 */
  appItem?: string;
  /** 内容类型 */
  contentType?: string;
  /** 游戏 ID */
  contentId?: string;
  /** 游戏名 */
  contentTitle?: string;
  /** 元素位置 */
  elementPosition?: string;
  /** 行为类型：曝光 / 点击 */
  actionType?: string;
  /** 具体事件名 */
  eventName?: string;
  /** 广告请求 ID（仅广告相关事件） */
  adRequestId?: string;
  /** 事件发生时间（yyyy-MM-dd HH:mm:ss，不传则自动生成） */
  eventTime?: string;
}

// ────────────────────────────────────────
// 广告请求 & 响应
// ────────────────────────────────────────

/** 广告请求参数 */
export interface IAdRequest {
  /** 广告类型，默认激励视频 */
  adType?: AdType;
  /** CP 标识，由平台分配 */
  cpId: string;
  /** 奖励类型，CP 自定义（如 "extra_life"、"double_coin"） */
  rewardType: string;
  /** 触发场景，CP 自定义（如 "game_over"、"level_complete"） */
  triggerScene: string;
  /** 扩展参数，各平台可自定义 */
  extra?: Record<string, unknown>;
}

/** 广告结果 - 获得奖励 */
export interface IAdRewardResult {
  /** 是否完整观看 */
  isCompleted: boolean;
  /** 对应请求的 ID */
  requestId: string;
}

/** 广告结果 - 广告关闭 */
export interface IAdClosedResult {
  /** 是否完整观看 */
  isCompleted: boolean;
  /** 对应请求的 ID */
  requestId: string;
}

/** 广告错误 */
export interface IAdError {
  /** 错误码 */
  code: AdErrorCode | number;
  /** 错误描述 */
  message: string;
  /** 来源平台 */
  platform: AdPlatform;
  /** 对应请求的 ID */
  requestId: string;
}

// ────────────────────────────────────────
// 适配器接口
// ────────────────────────────────────────

/** 适配器配置 */
export interface IAdapterConfig {
  /** CP 标识 */
  cpId?: string;
  /** 扩展配置 */
  extra?: Record<string, unknown>;
}

/** 事件处理函数 */
export type IEventHandler = (data: IAdEventData) => void;

/** 广告事件数据（联合类型） */
export type IAdEventData =
  | IAdRewardResult
  | IAdClosedResult
  | IAdError
  | { request: IAdRequest };

/** 广告适配器 - 每个广告平台实现此接口 */
export interface IAdAdapter {
  /** 平台标识 */
  readonly platform: AdPlatform;

  /** 初始化适配器 */
  init(config: IAdapterConfig): Promise<void>;

  /** 请求播放广告，返回 Promise */
  requestAd(request: IAdRequest): Promise<IAdRewardResult>;

  /** 销毁适配器，释放资源 */
  destroy(): void;

  /** 监听广告事件 */
  on(event: AdEvent, handler: IEventHandler): void;

  /** 取消监听广告事件 */
  off(event: AdEvent, handler?: IEventHandler): void;

  /** 获取设备信息（可选） */
  getDeviceInfo?(): Promise<IDeviceInfo>;

  /** 获取玩家账户信息（可选） */
  getAccount?(): Promise<IAccountInfo>;

  /** 通知游戏加载完成（可选） */
  onGameReady?(version: string): void;

  /** 通知游戏暂停（可选） */
  onGamePause?(): void;

  /** 通知游戏恢复（可选） */
  onGameResume?(): void;

  /** 退出游戏（可选） */
  exitGame?(): Promise<void>;

  /** 监听遥控器按键事件（可选，由适配器内部处理 Native 回调） */
  onKeyEvent?(handler: IKeyEventHandler): void;

  /** 取消监听遥控器按键事件（可选） */
  offKeyEvent?(handler?: IKeyEventHandler): void;
}

// ────────────────────────────────────────
// SDK 配置 & 主接口
// ────────────────────────────────────────

/** SDK 初始化配置 */
export interface IAdSdkConfig {
  /** 默认广告平台 */
  platform: AdPlatform;
  /** 各平台适配器配置 */
  adapters?: Partial<Record<AdPlatform, IAdapterConfig>>;
  /** 自定义适配器实例（优先级高于内置适配器） */
  customAdapters?: IAdAdapter[];
  /** 全局事件监听 */
  onEvent?: (event: AdEvent, data: IAdEventData) => void;
}

/** 聚合广告 SDK 主接口 */
export interface IAdSdk {
  /** 当前使用的平台 */
  readonly currentPlatform: AdPlatform;

  /** 初始化 SDK */
  init(config: IAdSdkConfig): Promise<void>;

  /** 获取设备信息 */
  getDeviceInfo(): Promise<IDeviceInfo>;

  /** 获取玩家账户信息 */
  getAccount(): Promise<IAccountInfo>;

  /** 请求播放广告（返回 Promise） */
  requestAd(request: IAdRequest): Promise<IAdRewardResult>;

  /** 通知游戏加载完成 */
  onGameReady(version: string): void;

  /** 通知游戏暂停 */
  onGamePause(): void;

  /** 通知游戏恢复 */
  onGameResume(): void;

  /** 退出游戏 */
  exitGame(): Promise<void>;

  /** 监听遥控器按键事件 */
  onKeyEvent(handler: IKeyEventHandler): void;

  /** 取消监听遥控器按键事件 */
  offKeyEvent(handler?: IKeyEventHandler): void;

  /** 监听广告事件 */
  on(event: AdEvent, handler: IEventHandler): void;

  /** 取消监听 */
  off(event: AdEvent, handler?: IEventHandler): void;

  /** 切换广告平台 */
  switchPlatform(platform: AdPlatform): void;

  /** 销毁 SDK */
  destroy(): void;
}
