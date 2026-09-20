# SdkModule 使用文档

电视大屏游戏 SDK 模块，封装广告、上报、排行榜、返回键、页面栈、全局事件等核心能力。

---

## 目录结构

```
SdkModule/
├── InitDatabase.ts          # 初始化入口（挂载到场景节点）
├── Data/
│   └── DataBase.ts          # 数据仓库（单例，存储用户/设备/上报信息）
├── Report/
│   └── ReportBase.ts        # 数据上报封装（含埋点枚举定义）
├── Rank/
│   └── RankBase.ts          # 排行榜封装（积分排行、添加积分）
├── Ads/
│   └── AdmgrBase.ts         # 广告管理封装（激励视频）
├── Back/
│   └── BackBase.ts          # 返回键处理封装（单例）
├── Page/
│   ├── PageSet.ts           # 页面栈管理（焦点注册、返回拦截）
│   └── OpneEvent.ts         # 页面打开/关闭事件组件（挂载到页面节点）
└── event/
    └── emitevent.ts         # 全局事件总线（on/once/emit/off）
```

## 快速开始

### 1. 初始化

在游戏入口挂载 `InitDatabase` 组件到场景中的任意节点（建议常驻节点）：

```ts
// InitDatabase 生命周期执行顺序：
// onLoad():  initfouce()      — 初始化 TV 焦点系统（TvUi.init）
//            emitEvent()      — 注册内部事件监听
//            keyEvent()       — 注册遥控器按键监听
//            SetPage()        — 设置退出页节点
// start():   initSdk()        — 初始化广告 SDK（AdSdk.init）
//            Promise.all([
//              initPlayerInfo(),  — 获取玩家账号信息
//              initDeviceInfo(),  — 获取设备信息
//            ])
//            Reporter.init()     — 初始化上报模块
//            RankBase.InitRank() — 初始化排行榜
```

**InitDatabase 组件属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `project` | `string` | 项目编码，用于排行榜初始化 |
| `exitpage` | `cc.Node` | 退出确认页节点（按返回键到最后一层时激活） |

### 2. 获取用户信息

```ts
import DataBase from "./SdkModule/Data/DataBase";

const db = DataBase.getInstance();

console.log(db.uid);       // 用户ID
console.log(db.nickName);  // 用户昵称
console.log(db.avatar);    // 用户头像 URL
console.log(db.sheBei);    // 设备信息
```

### 3. 数据上报

```ts
import ReportBase, { 
    element_positionbase, 
    action_typebase, 
    event_namebase, 
    app_itembase 
} from "./SdkModule/Report/ReportBase";

// 上报曝光事件
ReportBase.getInstance().report(
    element_positionbase.start_game_button,  // 元素位置
    app_itembase.itmeTV,                      // 渠道（25=小米TV）
    'game_001',                               // 游戏ID
    '我的游戏',                                // 游戏名
    action_typebase.start_game_expose,        // 行为类型（曝光）
    event_namebase.game_expose,               // 事件名
);

// 上报点击事件
ReportBase.getInstance().report(
    element_positionbase.start_game_button,
    app_itembase.itmeTV,
    'game_001',
    '我的游戏',
    action_typebase.start_game_click,         // 行为类型（点击）
    event_namebase.game_click,
);

// 上报广告事件（需传 adRequestId）
ReportBase.getInstance().report(
    element_positionbase.reward_video_ad,
    app_itembase.itmeTV,
    'game_001',
    '我的游戏',
    action_typebase.ad_expose,
    event_namebase.game_expose,
    'ad_request_id_123',  // 广告请求ID
);
```

### 4. 排行榜

```ts
import RankBase from "./SdkModule/Rank/RankBase";

// 获取排行榜数据
async function loadRank() {
    const list = await RankBase.getInstance().GetRankData();
    if (list) {
        for (const item of list) {
            console.log(item.rank, item.nickname, item.point);
        }
    }
}

// 添加积分
async function addScore(point: number) {
    await RankBase.getInstance().AddPoint(point);
}
```

### 5. 激励视频广告

```ts
import AdmgrBase from "./SdkModule/Ads/AdmgrBase";

// 展示激励视频
// callbacks1: 用户看完广告 → 发放奖励
// callbacks2: 用户中途关闭广告 → 不发奖励
// callbacks3: 所有渠道都失败（会自动进入 mock 兜底）
AdmgrBase.showReward(
    'game_over',          // 场景标识 trigger_scene
    'coin',               // 奖励类型 reward_type
    () => { giveReward(); },           // 看完回调
    () => { console.log('关闭'); },    // 中途关闭回调
    () => { console.log('失败'); },    // 失败回调
);
```

### 6. 返回键处理

```ts
import BackBase from "./SdkModule/Back/BackBase";

// 设置返回键回调（默认回调为 PageSet.back_keybord，走页面栈返回逻辑）
BackBase.getInstance().setBackCall(() => {
    // 自定义返回逻辑
    this.click_close();
});
```

> 说明：`InitDatabase` 已在 `keyEvent()` 中监听 `KeyCode.Back`，默认调用 `PageSet.back_keybord()`。
> 如需某页面自定义返回行为，用 `setBackCall` 覆盖即可。

### 7. 全局事件总线

```ts
import emitevent, { EventName } from "./SdkModule/event/emitevent";

// 注册监听
emitevent.instance.on(EventName.change_fouce, this.onFouceChange, this);

// 派发事件
emitevent.instance.emit(EventName.change_fouce);

// 一次性监听（触发后自动移除）
emitevent.instance.once(EventName.Close_Windows, this.onClose, this);

// 移除监听
emitevent.instance.off(EventName.change_fouce, this.onFouceChange, this);
```

### 8. 页面栈与焦点

将 `OpneEvent` 组件挂载到每个页面根节点。页面 `onEnable` 时自动登记到 `PageSet` 并重置焦点；`onDisable` 时触发回退。

```ts
import PageSet from "./SdkModule/Page/PageSet";

// 退出页节点由 InitDatabase.exitpage 属性注入到 PageSet.exitpage
// 按返回键到最后一层时，自动激活退出确认页
```

---

## 枚举定义

### element_positionbase（元素位置）

| 枚举值 | 说明 |
|--------|------|
| `game_loading` | 游戏加载 |
| `start_game_button` | 开始游戏按钮 |
| `watch_video_continue_button` | 视频继续按钮 |
| `replay_button` | 重新开始按钮 |
| `reward_video_ad` | 奖励视频广告 |

### action_typebase（行为类型）

| 枚举值 | 说明 |
|--------|------|
| `game_loading_expose` | 游戏加载曝光 |
| `start_game_expose` | 开始游戏曝光 |
| `start_game_click` | 开始游戏点击 |
| `watch_video_continue_expose` | 视频继续曝光 |
| `watch_video_continue_click` | 视频继续点击 |
| `replay_expose` | 重新开始曝光 |
| `replay_click` | 重新开始点击 |
| `ad_expose` | 广告曝光 |

### event_namebase（事件名）

| 枚举值 | 实际值 | 说明 |
|--------|--------|------|
| `game_expose` | `"曝光"` | 曝光 |
| `game_click` | `"点击"` | 点击 |

### app_itembase（渠道标识）

| 枚举值 | 值 | 说明 |
|--------|----|------|
| `itmeTV` | `"25"` | 小米TV 25 |
| `daoran` | `"29"` | 道然 29，小米TV 25 |

### EventName（全局事件名）

| 常量 | 说明 |
|------|------|
| `Close_Windows` | 关闭窗口 |
| `Open_MainScence` | 打开主场景 |
| `Open_GameScence` | 打开游戏场景 |
| `change_fouce` | 切换焦点（页面打开时触发） |
| `back_tomain` | 返回主页（页面关闭时触发） |
| `close_exitpage` | 关闭退出页 |

---

## 模块 API

### DataBase

| 属性 | 类型 | 说明 |
|------|------|------|
| `uid` | `string` | 用户ID |
| `nickName` | `string` | 用户昵称 |
| `avatar` | `string` | 用户头像 URL |
| `sheBei` | `any` | 设备信息对象 |
| `reportInfo` | `any` | 上报相关信息（提供 `createDeviceId()`） |

### ReportBase

| 方法 | 说明 |
|------|------|
| `report(element_position, appItem, content_id, content_title, action, eventName, adRequestIdId?, eventTime?)` | 上报一次事件 |

### RankBase

| 方法 | 说明 |
|------|------|
| `InitRank(project)` | 初始化排行榜 |
| `GetRankData()` | 获取排行榜列表，返回 `IRankItem[]` 或 `null` |
| `AddPoint(point)` | 添加积分，自动附带用户昵称等扩展信息 |

### AdmgrBase

| 方法 | 说明 |
|------|------|
| `showReward(trigger_scene, reward_type, callbacks1, callbacks2?, callbacks3?)` | 展示激励视频。`callbacks1` 看完发奖，`callbacks2` 中途关闭，`callbacks3` 全渠道失败 |

### BackBase

| 方法 | 说明 |
|------|------|
| `setBackCall(callback)` | 设置返回键回调函数（默认 `PageSet.back_keybord`） |

### emitevent

| 方法 | 说明 |
|------|------|
| `on(name, callback, target?)` | 注册监听 |
| `once(name, callback, target?)` | 注册一次性监听 |
| `emit(name, ...args)` | 派发事件 |
| `off(name, callback?, target?)` | 移除监听 |
| `targetOff(target)` | 按 target 批量移除 |
| `clear()` | 清空所有事件 |
| `hasListener(name)` | 是否存在监听 |
| `installToCC()` | 挂载到 `cc.EventDispatch`，兼容旧 JS 代码 |

### PageSet

| 方法/属性 | 说明 |
|------|------|
| `pusharr` | 页面栈（`cc.Node[]`） |
| `nowNode` | 当前页面节点 |
| `exitpage` | 退出确认页节点（由 `InitDatabase` 注入） |
| `openPage()` | 登记当前节点并重置焦点 |
| `closePage()` | 弹出当前页面，回退到上一页 |
| `back_keybord()` | 返回键处理：栈底时激活退出页，否则关闭当前页 |

---

## 上报字段说明

| 字段 | 说明 | 是否必填 |
|------|------|----------|
| `user_id` | 用户ID（自动从 DataBase 获取） | 登录后必填 |
| `device_id` | 设备唯一标识（`reportInfo.createDeviceId()`） | 自动填充 |
| `app_item` | 渠道编码 | 必填 |
| `content_type` | 内容类型（固定"游戏"） | 固定值 |
| `content_id` | 游戏ID | 必填 |
| `content_title` | 游戏名 | 必填 |
| `element_position` | 元素位置 | 必填 |
| `action_type` | 行为类型（曝光/点击/广告曝光） | 必填 |
| `event_name` | 事件名（曝光/点击） | 必填 |
| `ad_request_id` | 广告请求ID | 广告事件必填 |
| `event_time` | 事件时间（yyyy-MM-dd HH:mm:ss） | 自动生成 |

---

## 完整示例

### 游戏主流程

```ts
import DataBase from "./SdkModule/Data/DataBase";
import RankBase from "./SdkModule/Rank/RankBase";
import ReportBase, { 
    element_positionbase, 
    action_typebase, 
    event_namebase, 
    app_itembase 
} from "./SdkModule/Report/ReportBase";
import AdmgrBase from "./SdkModule/Ads/AdmgrBase";

// 1. 游戏加载完成，上报曝光
ReportBase.getInstance().report(
    element_positionbase.game_loading,
    app_itembase.itmeTV,
    'game_001',
    '我的游戏',
    action_typebase.game_loading_expose,
    event_namebase.game_expose,
);

// 2. 获取排行榜
RankBase.getInstance().GetRankData().then((res) => {
    console.log(res);
});

// 3. 开始游戏（按钮点击）
ReportBase.getInstance().report(
    element_positionbase.start_game_button,
    app_itembase.itmeTV,
    'game_001',
    '我的游戏',
    action_typebase.start_game_click,
    event_namebase.game_click,
);

// 4. 游戏结束，添加积分
await RankBase.getInstance().AddPoint(100);

// 5. 观看激励视频并上报广告曝光
AdmgrBase.showReward(
    'game_over',
    'coin',
    () => {
        // 看完广告 → 发放奖励
        giveReward();
    },
    () => { /* 中途关闭 */ },
    () => { /* 失败兜底 */ },
);
```

---

## 注意事项

1. **InitDatabase 必须挂载**：游戏入口必须挂载 `InitDatabase` 组件以完成 SDK 初始化，并配置 `project` 与 `exitpage`。
2. **DataBase 是单例**：所有模块通过 `DataBase.getInstance()` 访问用户/设备数据。
3. **上报需先初始化**：`Reporter.init()` 在 `InitDatabase.start()` 中自动完成。
4. **排行榜需先初始化**：`RankBase.InitRank()` 在 `InitDatabase.start()` 中自动完成。
5. **返回键默认行为**：`InitDatabase` 已监听 `KeyCode.Back`，默认走 `PageSet.back_keybord()` 页面栈逻辑；如需自定义可用 `BackBase.getInstance().setBackCall()` 覆盖。
6. **页面栈配合**：每个页面节点挂载 `OpneEvent` 组件，`onEnable/onDisable` 自动维护 `PageSet` 页面栈与焦点。
7. **事件总线兼容**：调用 `emitevent.installToCC()` 后，旧 JS 代码可继续使用 `cc.EventDispatch.on/emit`。
