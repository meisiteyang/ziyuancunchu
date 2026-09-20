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
    ├── adapters/
    │   └── xiaomi-adapter.js / .d.ts
    ├── reporters/
    │   ├── reporter.js / .d.ts        # 上报模块封装
    │   └── superset-lewo.js           # 上报底层脚本
    └── leaderboard/
        └── leaderboard.js / .d.ts     # 排行榜模块
```

注意：不要复制 build.js,node_modules,package-lock.json,dist文件 cocos中会报错

## 2. 初始化

```js
import { AdSdk, AdPlatform, AdEvent } from "../ad-sdk/ad-sdk";

// 游戏启动时调用一次
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
});

// 请求广告
await AdSdk.requestAd({
  reward_type: 'extra_life',  // CP 自定义类型
  trigger_scene: 'game_over', // CP 自定义场景
});
```
trigger_scene: 要求如下定义
使用道具 use_prop
开始游戏 start_game
复活弹窗 revive_pop
购买皮肤 buy_skin
购买道具 buy_prop
游戏结束 game_over
关卡通过 level_complete
商店/道具 shop
每日奖励 daily_reward
加速 boost
---

## 生命周期

```js
AdSdk.onGameReady("1.0.0");  // 游戏加载完成 （必须）
AdSdk.onGamePause();          // 游戏暂停（可选）
AdSdk.onGameResume();         // 游戏恢复（可选）
await AdSdk.exitGame();       // 退出游戏（可选）
```

## 获取设备信息

```js
const info = await AdSdk.getDeviceInfo();
console.log(info.platform);   // 'tv'
console.log(info.osVersion);  // 系统版本
console.log(info.model);      // 设备型号
```

## 获取玩家账户信息

```js
const account = await AdSdk.getAccount();
console.log(account.uid);       // 用户唯一标识
console.log(account.nickname);  // 用户昵称
console.log(account.avatar);    // 用户头像 URL
```

## 数据上报

SDK 内置数据上报模块，CP 方通过 `Reporter` 统一调用。

### 1. 初始化

```js
import { Reporter, ActionType } from "../ad-sdk/ad-sdk";

// 游戏启动时调用一次
Reporter.init({
  report_url: 'https://sup.daoran.tv/bi-api/api/game/lewo/batch',  // 上报地址（不传用默认）
  app_item: '29',                    // 渠道编码
  content_id: 'game_001',            // 游戏ID
  content_title: '我的游戏',          // 游戏名
});
```

### 2. 单次上报

```js
Reporter.report({
  user_id: 'user_123',               // 用户ID（登录后设置）
  event_name: 'game_start',          // 事件名
  action_type: ActionType.Exposure,  // 曝光
});
```

### 3. 批量上报

```js
Reporter.reportBatch([
  { user_id: 'user_123', event_name: 'game_start', action_type: ActionType.Exposure },
  { user_id: 'user_123', event_name: 'level_complete', action_type: ActionType.Click },
]);
```

### 4. 用户登录后更新 user_id

```js
Reporter.setCommonInfo({ user_id: account.uid });
```

### 5. 设备ID

```js
var deviceId = Reporter.createDeviceId();  // 获取/自动生成设备ID
Reporter.resetDeviceId();                     // 重置设备ID
```

### API

| 方法 | 说明 |
|------|------|
| `Reporter.init(config)` | 初始化上报模块 |
| `Reporter.report(data)` | 单次上报 |
| `Reporter.reportBatch(list, common?)` | 批量上报 |
| `Reporter.createDeviceId()` | 获取/生成设备ID |
| `Reporter.resetDeviceId()` | 重置设备ID |
| `Reporter.setCommonInfo(info)` | 更新公共字段 |
| `Reporter.getCommonInfo()` | 获取当前公共字段 |

### 上报字段

| 字段 | 说明 | 必填 |
|------|------|------|
| `user_id` | 用户唯一标识（需要用户登录，产生UID） | 登录后必填 |
| `device_id` | 设备唯一标识（设备号，如果无，则需要生成） | 自动生成 |
| `app_item` | 渠道编码 | init 时设置 |
| `content_type` | 内容类型（默认"游戏"） | init 时设置 |
| `content_id` | 游戏 ID | init 时设置 |
| `content_title` | 游戏名 | init 时设置 |
| `element_position` | 元素位置（埋点范围表对应的元素位置列） | 可选 |
| `action_type` | 行为类型：曝光/点击 | 默认"曝光" |
| `event_name` | 具体事件名（通过元素位置和行为生成事件名字） | 必填 |
| `ad_request_id` | 广告请求 ID | 广告事件必填 |
| `event_time` | 客户端事件时间（yyyy-MM-dd HH:mm:ss） | 自动生成 |

## 排行榜

SDK 内置排行榜模块，支持获取积分排行榜和添加积分。

### 1. 初始化

```js
import { Leaderboard } from "../ad-sdk/ad-sdk";

// 游戏启动时调用一次
Leaderboard.init({
  project: 'xmjump',                    // 项目编码（必填）
  rank_url: 'https://xxx/api/user/point/rank',    // 排行榜接口（不传用默认）
  add_url: 'https://xxx/api/user/point/add',      // 添加积分接口（不传用默认）
});
```

### 2. 获取积分排行榜

```js
var result = await Leaderboard.getRank();
if (result.code === 0) {
  var list = result.data;  // 排行榜列表
  for (var i = 0; i < list.length; i++) {
    console.log(list[i].rank, list[i].nickname, list[i].point);
  }
} else {
  console.error('获取排行榜失败:', result.message);
}
```

### 3. 添加积分

```js
var result = await Leaderboard.addPoint({
  user_id: 'user_123',                  // 用户ID（不传用 init 时设置的）
  point: 10,                            // 积分值
  json_data: JSON.stringify({           // 扩展数据（可选）
    url: 'xxx.png',
    nickname: '张三',
  }),
});
```

### 4. 用户登录后更新 user_id

```js
Leaderboard.setUserId(account.uid);
```

### API

| 方法 | 说明 |
|------|------|
| `Leaderboard.init(config)` | 初始化排行榜模块 |
| `Leaderboard.getRank()` | 获取积分排行榜 |
| `Leaderboard.addPoint(params)` | 添加积分 |
| `Leaderboard.setUserId(user_id)` | 更新用户ID |
| `Leaderboard.getProject()` | 获取当前项目编码 |

### 排行榜字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `rank` | number | 排名 |
| `user_id` | string | 用户ID |
| `point` | number | 积分 |
| `nickname` | string | 昵称（从 json_data 解析） |
| `avatar` | string | 头像 URL（从 json_data 解析） |
| `json_data` | string | 扩展数据（JSON 字符串） |

## 遥控器按键 （可选）

Native 通过 JSBridge 实时推送遥控器按键事件给 H5，SDK 已封装为 `onKeyEvent`，支持按下和松开两种事件，方便实现长按、连发、释放等操作。

### 使用

```js
import { AdSdk, KeyCode, KeyAction } from "../ad-sdk/ad-sdk";

AdSdk.onKeyEvent(function (e) {
  var isDown = e.action === KeyAction.Down;

  if (isDown) {
    switch (e.key) {
      case KeyCode.Enter: handleConfirm(); break;
      case KeyCode.Back:  showGameMenu();  break;
      case KeyCode.Up:    movePlayer(0, -1); break;
      case KeyCode.Down:  movePlayer(0, 1);  break;
      case KeyCode.Left:  movePlayer(-1, 0); break;
      case KeyCode.Right: movePlayer(1, 0);  break;
      case KeyCode.Menu:  togglePause();     break;
    }
  } else {
    // 松开（up）— 用于停止移动、结束长按等
    stopPlayer();
  }
});
```

### API

| 方法 | 说明 |
|------|------|
| `AdSdk.onKeyEvent(handler)` | 监听按键事件，handler 接收 `{ key, action }` |
| `AdSdk.offKeyEvent(handler?)` | 取消监听，不传 handler 则清除所有 |

### 回调数据

| 字段 | 类型 | 说明 |
|------|------|------|
| `e.key` | string | 按键名称，见下方映射表 |
| `e.action` | string | `"down"` = 按下，`"up"` = 松开 |

### 按键映射

| 遥控器按键 | KeyCode | 实际值 | 说明 |
|-----------|---------|--------|------|
| ↑ 上 | `KeyCode.Up` | `'up'` | 方向键上 |
| ↓ 下 | `KeyCode.Down` | `'down'` | 方向键下 |
| ← 左 | `KeyCode.Left` | `'left'` | 方向键左 |
| → 右 | `KeyCode.Right` | `'right'` | 方向键右 |
| 确认 (OK) | `KeyCode.Enter` | `'enter'` | 中心确认键 |
| 返回 | `KeyCode.Back` | `'back'` | 返回键 |
| 菜单 | `KeyCode.Menu` | `'menu'` | 菜单键 |

### 注意事项

- **同时推送 down 和 up**：按下触发 `action: 'down'`，松开触发 `action: 'up'`，可据此实现长按/连发
- **广告播放期间不推送**：广告播放中不会收到任何按键事件，无需自行屏蔽
- **返回键双击退出**：`back` 键的双击退出逻辑仍在 Native 侧处理，H5 仅收到按键事件通知，常用在页面返回/关闭逻辑
- **不要同时监听 keydown/keyup**：如果 H5 同时自行监听 `keydown/keyup`，可能收到重复事件，建议仅使用 `onKeyEvent`

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
