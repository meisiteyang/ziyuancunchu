# TV UI Framework 接入指南

本文档面向 Cocos Creator 2.4.x 项目开发人员，说明如何在 TV 项目中接入 `tvui` 框架，并完成焦点、图标、遥控输入、返回键和聚合广告能力。

当前框架已经接入聚合广告 SDK：真实广告统一走 `AggregateAdProvider + vendor/ad-sdk`。业务代码只调用 slot 或项目封装，不直接关心具体广告渠道。

## 适用场景

- Cocos Creator 2.4.x + TypeScript。
- 小米 TV / Android TV / 1920x1080 横屏项目。
- 遥控器方向键、确认键、返回键交互。
- 需要复用全局焦点、图标跟随、弹窗 scope、返回键和广告 slot 的小游戏项目。

核心原则：

- 焦点状态只由 `FocusManager` 管理。
- 图标是全局焦点视觉的一部分，不挂在业务按钮上。
- 广告只暴露 slot，不让业务代码关心具体渠道。
- 真实广告优先扩展 `vendor/ad-sdk/adapters/`，业务调用保持不变。
- 后续项目只认 `scripts/tvui/core/TvUi`，不再兼容旧 TV 工具链。

## 目录结构

复制框架时至少带上两部分：

```text
assets/scripts/tvui/
  config/
  focus/
  icon/
  ad/
  input/
  core/
  vendor/ad-sdk/

assets/resources/tvui/
  config/default.json
  icons/pointer-yellow-60.png
  icons/pointer-blue-60.png
  icons/pointer-pink-60.png
```

模块职责：

- `core/TvUi.ts`：唯一公共入口，导出 `root/config/focus/icon/ads/input/api/back`。
- `core/TvUiRoot.ts`：创建全局常驻节点，初始化配置、焦点视觉、广告和遥控输入。
- `focus/`：焦点注册、移动、确认、scope、全局视觉层。
- `icon/`：根据配置加载本地或远程图标并缓存。
- `ad/`：slot 广告、多渠道 provider、mock fallback。
- `vendor/ad-sdk/`：聚合广告 SDK 和小米 adapter。
- `input/`：遥控器 keyCode 适配和输入分发。
- `config/`：默认配置、项目覆盖配置、本地配置合并。

## 接入顺序

### 1. 复制框架目录

把 `assets/scripts/tvui` 和 `assets/resources/tvui` 复制到目标项目，并确保 `.meta` 文件一起提交。Cocos 项目中 `.meta` 不可缺，否则资源 UUID 会变化。

### 2. 初始化 TvUi

在项目入口或平台初始化位置引入：

```ts
import TvUi from "../scripts/tvui/core/TvUi";
```

推荐封装一个项目级初始化方法，避免重复初始化：

```ts
static tvUiInited = false;

static initTvUi() {
    if (Platform.tvUiInited) return;
    Platform.tvUiInited = true;

    TvUi.init({
        cpId: "ppl",
        version: Consts.GAME_VERSION,
        designWidth: 1920,
        designHeight: 1080,
        enableCursor: true,
        configPath: "tvui/config/default",
        focus: {
            enabled: true,
            defaultIconKey: "default"
        },
        adSdk: {
            platform: "xiaomi"
        },
        ads: {
            reward: {
                enabled: true,
                mode: "reward",
                channels: [
                    { type: "aggregate", priority: 1, rewardType: "reward" },
                    { type: "mock", priority: 100 }
                ]
            },
            popup: {
                enabled: true,
                mode: "popup",
                channels: [
                    { type: "aggregate", priority: 1 },
                    { type: "mock", priority: 100 }
                ]
            },
            game: {
                enabled: true,
                mode: "popup",
                channels: [
                    { type: "aggregate", priority: 1 },
                    { type: "mock", priority: 100 }
                ]
            }
        }
    });
}
```

`ppl` 项目参考：`ppl/assets/framework/Platform.ts` 的 `Platform.initTvUi()`。

`TvUi.init()` 会自动：

- 创建并常驻 `TvUiRoot`。
- 加载 `resources/tvui/config/default.json`。
- 初始化焦点层、图标、广告、遥控输入。
- 暴露 `window.TvUi` 和 `window.tvui`。
- 注册生命周期回调到原生 bridge。

### 3. 准备默认配置

默认配置位于：

```text
assets/resources/tvui/config/default.json
```

项目可以在 `TvUi.init()` 里覆盖配置，也可以修改默认配置。推荐把公共默认值放在 `default.json`，项目差异放在初始化参数里。

## 焦点接入

焦点接入分三种场景：普通页面、复杂页面、弹窗。

### 普通页面：自动注册按钮

如果页面上的可操作元素都是 Cocos `cc.Button`，直接注册整个页面根节点：

```ts
onShown() {
    Platform.initTvUi();
    TvUi.focus.reset();
    TvUi.focus.pushScope("main", this.node);
    TvUi.focus.registerButtons(this.node);
    TvUi.focus.focusNode(this.findButtonByHandler("click_play"));
}

onHidden() {
    TvUi.focus.unregisterByRoot(this.node);
    TvUi.focus.popScope("main");
}
```

注册后：

- 方向键会按节点位置自动寻找下一个焦点。
- 确认键会触发按钮 `clickEvents`。
- 焦点节点会按默认 `focusScale` 放大。
- 全局图标会跟随当前焦点。

`ppl` 主界面参考：

```ts
setupTvControls() {
    Platform.initTvUi();
    TvUi.focus.reset();
    TvUi.focus.pushScope("main", this.node);
    TvUi.focus.registerButtons(this.node);
    this.focusPlayButton();
    TvUi.back.setFallback(() => {
        TvGlobalExit.showConfirm();
        return true;
    });
}
```

### 复杂页面：手动注册焦点

如果页面布局复杂，或者要指定方向关系、图标、点击逻辑，用 `register` 手动注册：

```ts
TvUi.focus.register(startButton, {
    root: this.node,
    focusId: "main_start",
    iconKey: "yellow",
    up: "main_rank",
    down: "main_sign",
    left: "main_lottery",
    right: "main_shop",
    focusScale: 1.08,
    onClick: () => {
        this.click_play();
    },
    onFocus: () => {
        // 可选：业务高亮
    },
    onBlur: () => {
        // 可选：取消业务高亮
    }
});
```

指定焦点：

```ts
TvUi.focus.focusNode(startButton);
TvUi.focus.focus("main_start");
```

清理页面焦点：

```ts
TvUi.focus.unregisterByRoot(this.node);
```

复杂 TV 页面推荐显式配置 `up/down/left/right`，减少自动坐标推断跳错。

### FocusItem 组件

需要在编辑器里声明方向关系时，可以给节点挂 `FocusItem`：

```ts
@property
focusId: string = "";

@property
iconKey: string = "";

@property
up: string = "";
@property
down: string = "";
@property
left: string = "";
@property
right: string = "";
```

`FocusItem` 只声明焦点关系和图标 key，不负责画焦点框，也不负责画图标。

### 弹窗：独立 scope

弹窗打开时要把焦点限制在弹窗内，关闭后恢复上一层焦点：

```ts
onShown() {
    TvUi.focus.pushScope("dialog:shop", this.node);
    TvUi.focus.registerButtons(this.node);
    TvUi.focus.focusNode(this.closeButton.node);
    TvUi.back.push(this.onBack);
}

onHidden() {
    TvUi.focus.unregisterByRoot(this.node);
    TvUi.focus.popScope("dialog:shop");
    TvUi.back.remove(this.onBack);
}

private onBack = () => {
    this.click_close();
    return true;
};
```

`ppl` 已封装弹窗焦点和返回键：

```ts
this._tvCleanup = bindTvDialogControls(this, this.click_close, {
    firstFocusNode: this.closeButton.node
});
```

关闭弹窗时调用：

```ts
if (this._tvCleanup) {
    this._tvCleanup();
    this._tvCleanup = null;
}
```

`ppl` 参考：

- `ppl/assets/Game/Scripts/Info.ts` 的 `bindTvDialogControls()`。
- `LoseDialog`、`ShopDialog`、`SignDialog`、`WinDialog` 的 `onShown()`。

### 返回键

主界面 fallback：

```ts
TvUi.back.setFallback(() => {
    TvGlobalExit.showConfirm();
    return true;
});
```

弹窗返回：

```ts
const backHandler = () => {
    this.click_close();
    return true;
};

TvUi.back.push(backHandler);
TvUi.back.remove(backHandler);
```

`return true` 表示已处理返回键；`return false` 表示继续交给下一层 handler 或 fallback。

## 图标配置

默认图标位于：

```text
assets/resources/tvui/icons/
  pointer-yellow-60.png
  pointer-blue-60.png
  pointer-pink-60.png
```

默认配置在 `assets/resources/tvui/config/default.json`：

```json
{
  "focus": {
    "enabled": true,
    "frameEnabled": false,
    "defaultIconKey": "default",
    "iconPlacement": "bottomRight",
    "iconOffsetX": -20,
    "iconOffsetY": 20
  },
  "icons": {
    "default": {
      "path": "tvui/icons/pointer-yellow-60",
      "width": 60,
      "height": 60,
      "offsetX": -20,
      "offsetY": 20
    }
  }
}
```

配置说明：

- `path`：`resources` 下的本地图标路径，不带扩展名。
- `url`：远程图标 URL。
- `width/height`：图标显示尺寸。
- `offsetX/offsetY`：当前图标自己的偏移，优先级高于 `focus.iconOffsetX/Y`。
- `iconPlacement`：支持 `topRight`、`bottomRight`。
- `frameEnabled`：是否绘制全局焦点框。当前默认 `false`，只显示图标和按钮自身缩放。

切换默认图标：

```ts
TvUi.icon.setIconTheme("blue");
```

运行时更新配置并保存到本地：

```ts
TvUi.config.updateConfig({
    focus: {
        defaultIconKey: "pink"
    }
}, true);
```

## 广告接入

### 调用原则

业务代码不要直接调原生广告，也不要直接调具体平台 adapter。推荐优先级：

1. 项目已有封装：`showRewardVideo()`、`showTvDialogAd()`、`hideTvDialogAd()`。
2. 框架 API：`TvUi.ads.showReward()`、`TvUi.ads.showPopup()`、`TvUi.ads.showSlot()`。
3. 新平台能力：扩展 `vendor/ad-sdk/adapters/`。

当前真实广告由 `AggregateAdProvider` 接入 `vendor/ad-sdk`，默认渠道链路：

```text
aggregate(1) -> mock(100)
```

规则：

- `enabled === false` 的渠道会跳过。
- provider 不存在或不可用会尝试下一渠道。
- provider 返回 `failed` 或 Promise reject 会尝试下一渠道。
- 奖励广告用户关闭返回 `closed`，触发 `onClose`，不发奖励，不切到下一渠道。
- 全部真实渠道失败后进入 `mock`。

### Reward 广告

直接调用框架：

```ts
TvUi.ads.showReward({
    scene: "free_coin",
    rewardType: "coin",
    onSuccess: data => {
        giveCoin();
    },
    onClose: data => {
        Toast.make("必须看完广告才能获得奖励");
    },
    onFail: error => {
        Toast.make("广告暂不可用，请稍后再试");
    }
});
```

项目内推荐封装：

```ts
showRewardVideo("shop_free_gold", "shop_free_gold", this.share_succ, this);
```

`ppl` 封装参考：`ppl/assets/Game/Scripts/Info.ts` 的 `showRewardVideo()`。

### 看视频复活示例

按钮回调：

```ts
click_revive() {
    this.refreshReviveRound();
    if (this.revive_count >= this.max_revive_count) {
        return;
    }
    showRewardVideo("lose_revive", "revive", this.revive, this);
}
```

奖励成功后执行业务复活：

```ts
revive() {
    this.refreshReviveRound();
    if (this.revive_count >= this.max_revive_count) {
        return;
    }
    LoseDialog.reviveUsedCount++;
    this.revive_count = LoseDialog.reviveUsedCount;
    this.getComponent(View).hide();
    Game.instance.revive();
}
```

完整链路：

```text
按钮 click_revive
-> showRewardVideo("lose_revive", "revive", this.revive, this)
-> TvUi.ads.showReward
-> AggregateAdProvider
-> vendor/ad-sdk
-> 小米 adapter
-> 原生 requestAd
-> onReward 后调用 revive
```

`ppl` 参考：`ppl/assets/Game/Scripts/ui/LoseDialog.ts`。

### Popup 广告

直接调用框架：

```ts
TvUi.ads.showPopup({
    scene: "home_popup",
    onLoad: data => {
        console.log("popup loaded", data);
    },
    onFail: error => {
        console.log("popup failed", error);
    }
});
```

隐藏 popup：

```ts
TvUi.ads.hidePopup("home_popup");
```

项目内推荐封装：

```ts
showTvDialogAd("lose");
hideTvDialogAd("lose");
```

`ppl` 参考：

- `LoseDialog.onShown()` 调 `showTvDialogAd("lose")`。
- `ShopDialog.onShown()` 调 `showTvDialogAd("shop")`。
- `WinDialog.onShown()` 调 `showTvDialogAd("win")`。

### 自定义 slot

配置：

```json
{
  "ads": {
    "home_popup": {
      "enabled": true,
      "mode": "popup",
      "channels": [
        { "type": "aggregate", "priority": 1, "placementId": "home_popup" },
        { "type": "mock", "priority": 100 }
      ]
    }
  }
}
```

调用：

```ts
TvUi.ads.showSlot("home_popup", {
    scene: "home_popup",
    onLoad: data => {},
    onFail: error => {}
});
```

### 聚合 SDK 配置

`AggregateAdProvider` 通过 `vendor/ad-sdk` 统一接入真实广告。当前 SDK 内置小米 adapter。

SDK 默认原生 action：

```text
requestAd
requestPopupAd
hidePopupAd
```

SDK 配置：

```json
{
  "adSdk": {
    "platform": "xiaomi",
    "adapterConfig": {
      "cpId": "ppl"
    }
  }
}
```

channel 配置：

```json
{
  "type": "aggregate",
  "priority": 1,
  "placementId": "home_popup"
}
```

支持回调：

```text
onReward
onAdClosed
onAdFailed
onPopupAdLoaded
onPopupAdClosed
onPopupAdFailed
```

后续新增平台时优先扩展：

```text
assets/scripts/tvui/vendor/ad-sdk/adapters/
```

业务和 TV UI slot 调用保持不变。

### 自营 Provider

`SelfAdProvider` 适合本地兜底图片：

```json
{
  "type": "self",
  "priority": 50,
  "imagePath": "tvui/ads/home-popup"
}
```

调用时传入 `container`：

```ts
TvUi.ads.showSlot("home_popup", {
    container: adNode,
    scene: "home_popup"
});
```

说明：当前自营广告主要支持本地 `imagePath`。远程 `imageUrl` 是后续增强项。

### 自定义 Provider

新增 provider：

```ts
import IAdProvider, { AdRuntimeData, AdShowResult } from "./IAdProvider";

export default class CustomAdProvider implements IAdProvider {
    public type: string = "custom";

    public isAvailable(): boolean {
        return true;
    }

    public load(data: AdRuntimeData): Promise<AdRuntimeData> {
        return Promise.resolve(data);
    }

    public show(data: AdRuntimeData): Promise<AdShowResult> {
        return Promise.resolve({
            status: "loaded",
            data: {}
        });
    }

    public hide(slotId: string): void {
    }
}
```

在 `AdManager.init()` 注册：

```ts
this.registerProvider(new CustomAdProvider());
```

配置：

```json
{ "type": "custom", "priority": 3, "placementId": "custom_slot" }
```

## ppl 接入实例

`ppl` 项目的接入方式可以直接作为新项目模板：

1. `Platform.login()` 或项目入口调用 `Platform.initTvUi()`。
2. 主界面 `Main.setupTvControls()`：
   - 隐藏分享入口。
   - `TvUi.focus.reset()`。
   - `TvUi.focus.pushScope("main", this.node)`。
   - `TvUi.focus.registerButtons(this.node)`。
   - 默认聚焦开始按钮。
   - `TvUi.back.setFallback()` 打开退出确认。
3. 打开子弹窗前调用 `suspendTvControlsForChildDialog()`，避免主界面焦点抢回。
4. 弹窗内调用 `bindTvDialogControls()` 注册按钮焦点和返回键。
5. 弹窗关闭后调用 cleanup，并恢复主界面焦点。
6. 奖励广告统一调用 `showRewardVideo(scene, rewardType, callback, target)`。
7. 插屏/浮层广告统一调用 `showTvDialogAd(scene)` 和 `hideTvDialogAd(scene)`。

主界面最小示例：

```ts
setupTvControls() {
    Platform.initTvUi();
    TvUi.focus.reset();
    TvUi.focus.pushScope("main", this.node);
    TvUi.focus.registerButtons(this.node);
    this.focusPlayButton();
    TvUi.back.setFallback(() => {
        TvGlobalExit.showConfirm();
        return true;
    });
}
```

弹窗最小示例：

```ts
onShown() {
    showTvDialogAd("shop");
    this._tvCleanup = bindTvDialogControls(this, this.click_close, {
        firstFocusNode: this.closeButton.node
    });
}

onHidden() {
    hideTvDialogAd("shop");
    if (this._tvCleanup) {
        this._tvCleanup();
        this._tvCleanup = null;
    }
}
```

奖励按钮最小示例：

```ts
click_free() {
    showRewardVideo("shop_free_gold", "shop_free_gold", this.share_succ, this);
}
```

## 项目迁移规则

新项目和后续项目只允许使用：

```ts
import TvUi from "../scripts/tvui/core/TvUi";
```

禁止新代码使用：

```text
TvKit
tvKit
code/tvkit
MiAPI
```

迁移检查：

```bash
rg "code/tvkit|TvKit|tvKit|MiAPI" ppl/assets
rg "scripts/tvui/core/TvUi" ppl/assets -g "*.ts"
```

`ppl/assets/code` 应不存在。所有 TV UI 能力都从 `TvUi` facade 进入。

## 验收清单

基础焦点：

- 方向键可以在主界面按钮之间移动。
- 确认键触发当前焦点按钮点击。
- 当前焦点图标跟随按钮移动。
- 图标靠近屏幕边缘时不会超出屏幕。
- 不显示黄色全局焦点框时，按钮自身缩放/高亮仍正常。

弹窗和返回：

- 打开弹窗后焦点限制在弹窗 scope 内。
- 关闭弹窗后恢复主界面焦点。
- 返回键在弹窗内关闭弹窗。
- 主界面返回键打开退出确认或执行项目 fallback。

广告：

- 无 `AppBridge` 时真实渠道不可用，最终进入 `mock`。
- 聚合 SDK 成功时不进入 mock。
- 聚合 SDK 失败时进入 mock/fallback。
- 奖励广告用户关闭时触发 `onClose`，不发奖励，不切下一渠道。

静态检查：

```bash
rg "code/tvkit|TvKit|tvKit|MiAPI" ppl/assets
rg "XiaomiAdProvide[r]|type: \"xiaom[i]\"|requestAggregateA[d]|requestAggregatePopupA[d]" ppl/assets/scripts/tvui ppl/assets/resources/tvui/config/default.json ppl/assets/framework/Platform.ts
git diff --check
```

## 常见问题

### 遥控器确认键没有触发按钮

确认按钮是否是 `cc.Button`，并且已经调用 `TvUi.focus.registerButtons(root)` 或 `TvUi.focus.register(node, { onClick })`。

### 焦点跳转不符合预期

复杂布局不要只依赖坐标推断，给关键节点配置 `up/down/left/right`。

### 弹窗打开后主界面按钮还能响应

打开子弹窗前先暂停主界面焦点，弹窗内使用独立 scope，关闭后再恢复主界面焦点。`ppl` 中使用 `suspendTvControlsForChildDialog()` 和 `bindTvDialogControls()`。

### 看视频没有发奖励

确认业务奖励只写在 `onSuccess` 或 `showRewardVideo` 的成功回调里。用户关闭广告只会触发 `onClose`，不会发奖励。

### 真实广告不可用

检查：

- `TvUi.api.hasBridge()` 是否为 `true`。
- 原生是否支持 `requestAd`、`requestPopupAd`、`hidePopupAd`。
- `adSdk.platform` 是否配置为当前 adapter 支持的平台。
- 渠道失败后是否已经进入 `mock` fallback。

## 后续增强

当前框架已覆盖 v1 接入主流程，以下能力可按项目需要继续补：

- 远程配置拉取和合并。
- 正式设置页，用于切换图标、调整偏移、开关广告渠道。
- 远程自营广告图片。
- 广告曝光、点击、关闭统一埋点上报。
