/**
 * 聚合广告 SDK - 枚举类型声明
 */

/** 广告平台标识 */
export declare enum AdPlatform {
  Xiaomi = 'xiaomi',
}

/** 广告类型 */
export declare enum AdType {
  RewardVideo = 'reward_video',
  Interstitial = 'interstitial',
  Banner = 'banner',
}

/** 广告事件 */
export declare enum AdEvent {
  Loaded = 'loaded',
  Show = 'show',
  Click = 'click',
  Closed = 'closed',
  Reward = 'reward',
  Error = 'error',
}

/** 广告错误码（聚合层统一） */
export declare enum AdErrorCode {
  Success = 0,
  Unknown = -1,
  AdSwitchOff = 1001,
  NoFill = 1002,
  Timeout = 1003,
  PlayFailed = 1004,
  NoFallbackAd = 1005,
  UserAbandoned = 1006,
  AdInProgress = 1007,
  NotInitialized = 2001,
  PlatformNotSupported = 2002,
}

/** 设备平台 */
export declare enum DevicePlatform {
  TV = 'tv',
  Mobile = 'mobile',
  Tablet = 'tablet',
}

/** 遥控器按键码 */
export declare enum KeyCode {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
  Enter = 'enter',
  Back = 'back',
  Menu = 'menu',
}

/** 按键动作 */
export declare enum KeyAction {
  Down = 'down',
  Up = 'up',
}
