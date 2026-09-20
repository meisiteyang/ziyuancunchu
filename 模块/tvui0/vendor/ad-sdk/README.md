# 聚合广告 SDK

电视大屏游戏广告接入，3 步搞定。

---

## 1. 复制文件

将 `ad-sdk` 文件夹复制到项目中：

```
your-project/
└── ad-sdk/
    ├── ad-sdk.js              # 主入口
    ├── ad-sdk.d.ts            # 类型声明（TS 项目自动提示）
    ├── event-emitter.js / .d.ts
    ├── types/
    │   ├── enums.js / .d.ts
    │   ├── interfaces.d.ts
    │   └── index.js / .d.ts
    └── adapters/
        └── xiaomi-adapter.js / .d.ts
```


## 2. 初始化

```js
import { AdSdk, AdPlatform, AdEvent } from "../ad-sdk/ad-sdk";

// 游戏启动时调用一次 后续会不同平台上线切换平台，其他逻辑不用修改
await AdSdk.init({ platform: AdPlatform.Xiaomi });
```

## 3. 请求广告 + 监听事件

```js
// 监听奖励（用户完整看完广告触发）
AdSdk.on(AdEvent.Reward, function (data) {
  console.log("发放奖励", data.requestId);
  giveReward();
});

// 监听失败
AdSdk.on(AdEvent.Error, function (data) {
  console.log("广告失败", data.code, data.message);
  //if(data.code == 1006) //用户主动取消看广告
});

// 请求广告
await AdSdk.requestAd({
  cpId: "your_cp_id",         // CP 标识，平台分配 默认cp_001 测试
  rewardType: "extra_life",   // 奖励类型，自定义
  triggerScene: "game_over",  // 触发场景，自定义
});
```

---

## 生命周期（可选）

```js
AdSdk.onGameReady("1.0.0");  // 游戏加载完成
AdSdk.onGamePause();          // 游戏暂停（切后台）
AdSdk.onGameResume();         // 游戏恢复
await AdSdk.exitGame();       // 退出游戏
```

## 广告事件

| 事件 | 说明 | data |
|------|------|------|
| `AdEvent.Reward` | 观看完成，发放奖励 | `{ requestId, isCompleted }` |
| `AdEvent.Error` | 广告失败 | `{ code, message, requestId }` |
| `AdEvent.Closed` | 广告关闭 | `{ requestId }` |
| `AdEvent.Loaded` | 广告加载完成 | — |
| `AdEvent.Show` | 广告开始展示 | — |
| `AdEvent.Click` | 广告被点击 | — |

## 错误码

### 广告侧（1xxx）

| 码 | 常量 | 说明 |
|----|------|------|
| 1001 | `AdErrorCode.AdSwitchOff` | 广告开关关闭 |
| 1002 | `AdErrorCode.NoFill` | 无广告填充，素材池无可用广告 |
| 1003 | `AdErrorCode.Timeout` | 广告请求超时（5秒） |
| 1004 | `AdErrorCode.PlayFailed` | 视频播放失败 |
| 1005 | `AdErrorCode.NoFallbackAd` | 无兜底广告，兜底视频也未配置 |
| 1006 | `AdErrorCode.UserAbandoned` | 用户放弃观看，播放中途按返回键 |
| 1007 | `AdErrorCode.AdInProgress` | 广告播放中，不可重复请求 |

### SDK 侧（2xxx）

| 码 | 常量 | 说明 |
|----|------|------|
| 0 | `AdErrorCode.Success` | 成功 |
| -1 | `AdErrorCode.Unknown` | 通用错误 |
| 2001 | `AdErrorCode.NotInitialized` | SDK 未初始化 |
| 2002 | `AdErrorCode.PlatformNotSupported` | 平台不支持 |
