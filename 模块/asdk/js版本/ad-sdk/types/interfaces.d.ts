/**
 * 聚合广告 SDK - 接口类型声明
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

/** 上报初始化配置（下划线字段格式） */
export interface IReporterConfig {
  /** 上报接口地址（不传则使用默认地址） */
  report_url?: string;
  /** 自定义请求头 */
  headers?: Array<{ name: string; value: string }>;
  /** 默认行为类型（默认 '曝光'） */
  default_action_type?: string;
  /** 渠道编码 */
  app_item?: string;
  /** 内容类型（默认 '游戏'） */
  content_type?: string;
  /** 游戏 ID */
  content_id?: string;
  /** 游戏名 */
  content_title?: string;
}

/** 上报数据项（下划线字段格式） */
export interface IReportItem {
  /** 用户唯一标识（需要用户登录，产生UID） */
  user_id?: string;
  /** 设备唯一标识（设备号，如果无，则需要生成） */
  device_id?: string;
  /** 渠道编码 */
  app_item?: string;
  /** 内容类型（游戏固定上报"游戏"） */
  content_type?: string;
  /** 游戏 ID */
  content_id?: string;
  /** 游戏名 */
  content_title?: string;
  /** 元素位置（埋点范围表对应的元素位置列） */
  element_position?: string;
  /** 行为类型：曝光 / 点击 */
  action_type?: string;
  /** 具体事件名（通过元素位置和行为生成事件名字） */
  event_name?: string;
  /** 广告请求 ID（仅广告相关事件需要） */
  ad_request_id?: string;
  /** 客户端事件时间（yyyy-MM-dd HH:mm:ss，不传则自动生成） */
  event_time?: string;
}

// ────────────────────────────────────────
// 排行榜
// ────────────────────────────────────────

/** 排行榜初始化配置 */
export interface ILeaderboardConfig {
  /** 排行榜服务地址 */
  rank_url?: string;
  /** 添加积分服务地址 */
  add_url?: string;
  /** 项目编码（如 "xmjump"） */
  project: string;
  /** 用户ID（可选，登录后通过 setUserId 更新） */
  user_id?: string;
}

/** 添加积分参数 */
export interface IAddPointParams {
  /** 用户ID（不传则使用 init 时设置的） */
  user_id?: string;
  /** 积分值 */
  point: number;
  /** 扩展数据（JSON 字符串，如 {url, nickname}） */
  jsonData?: string;
}

/** 排行榜条目 */
export interface IRankItem {
  /** 用户ID */
  user_id: string;
  /** 积分 */
  point: number;
  /** 排名 */
  rank: number;
  /** 扩展数据（如头像、昵称） */
  jsonData?: string;
  /** 昵称（从 jsonData 解析） */
  nickname?: string;
  /** 头像 URL（从 jsonData 解析） */
  avatar?: string;
}

/** 排行榜查询结果 */
export interface IRankResult {
  /** 返回码 */
  code: number;
  /** 返回消息 */
  message?: string;
  /** 排行榜列表 */
  data?: IRankItem[];
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
