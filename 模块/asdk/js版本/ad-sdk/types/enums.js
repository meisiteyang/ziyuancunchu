/**
 * 聚合广告 SDK - 枚举定义
 */

/** 广告平台标识 */
const AdPlatform = {
  /** 小米电视 */
  Xiaomi: 'xiaomi',
  // 后续扩展
  // Huawei: 'huawei',
  // Tencent: 'tencent',
  // ByteDance: 'bytedance',
};

/** 广告类型 */
const AdType = {
  /** 激励视频广告 */
  RewardVideo: 'reward_video',
  /** 插屏广告（预留） */
  Interstitial: 'interstitial',
  /** Banner 广告（预留） */
  Banner: 'banner',
};

/** 广告事件 */
const AdEvent = {
  /** 广告加载完成，可以播放 */
  Loaded: 'loaded',
  /** 广告展示（开始播放） */
  Show: 'show',
  /** 广告点击 */
  Click: 'click',
  /** 广告关闭 */
  Closed: 'closed',
  /** 观看完成，应发放奖励 */
  Reward: 'reward',
  /** 广告失败 */
  Error: 'error',
};

/** 广告错误码（聚合层统一） */
const AdErrorCode = {
  /** 成功 */
  Success: 0,
  /** 通用错误 */
  Unknown: -1,
  /** 广告开关已关闭 */
  AdSwitchOff: 1001,
  /** 无广告填充 */
  NoFill: 1002,
  /** 广告请求超时（5秒） */
  Timeout: 1003,
  /** 视频播放失败 */
  PlayFailed: 1004,
  /** 无兜底广告 */
  NoFallbackAd: 1005,
  /** 用户放弃观看（播放中途按返回键） */
  UserAbandoned: 1006,
  /** 广告播放中，不可重复请求 */
  AdInProgress: 1007,
  /** SDK 未初始化 */
  NotInitialized: 2001,
  /** 平台不支持 */
  PlatformNotSupported: 2002,
};

/** 设备平台 */
const DevicePlatform = {
  /** 电视 */
  TV: 'tv',
  /** 手机（预留） */
  Mobile: 'mobile',
  /** 平板（预留） */
  Tablet: 'tablet',
};

/** 遥控器按键码 */
const KeyCode = {
  /** 上 */
  Up: 'up',
  /** 下 */
  Down: 'down',
  /** 左 */
  Left: 'left',
  /** 右 */
  Right: 'right',
  /** 确认 (OK) */
  Enter: 'enter',
  /** 返回 */
  Back: 'back',
  /** 菜单 */
  Menu: 'menu',
};

/** 按键动作 */
const KeyAction = {
  /** 按下 */
  Down: 'down',
  /** 松开 */
  Up: 'up',
};

module.exports = {
  AdPlatform,
  AdType,
  AdEvent,
  AdErrorCode,
  DevicePlatform,
  KeyCode,
  KeyAction,
};
