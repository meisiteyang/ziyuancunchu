// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import TvUi from "../tvui/core/TvUi";
import FocusManager from "../tvui/focus/FocusManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class inint extends cc.Component {

    @property(cc.Node)
    startNode: cc.Node = null;
   @property(cc.Node)
    setNode: cc.Node = null;
    @property(cc.Node)
    skinNode: cc.Node = null;
    @property(cc.Node)
    addNode: cc.Node = null;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    static tvUiInited = false;
    start() {
        this.initfouce();
        FocusManager.focusNode(this.startNode);
    }



    initfouce() {
        if (inint.tvUiInited) return;
        inint.tvUiInited = true;

        TvUi.init({
            cpId: "ppl",                  // 你们的内容ID
            version: "1.0.0",             // 游戏版本
            designWidth: 1920,
            designHeight: 1080,
            enableCursor: true,
            focus: {
                enabled: true,
                defaultIconKey: "default", // 焦点图标主题
                iconPlacement: "bottomRight"
            },
            adSdk: {
                platform: "xiaomi"         // 真实广告平台
            },
            ads: {
                reward: {
                    enabled: true,
                    mode: "reward",
                    channels: [
                        { type: "aggregate", priority: 1, rewardType: "reward" },  // 真实广告优先
                        { type: "mock", priority: 100 }                             // 兜底模拟广告
                    ]
                },
                popup: {
                    enabled: true,
                    mode: "popup",
                    channels: [
                        { type: "aggregate", priority: 1 },
                        { type: "mock", priority: 100 }
                    ]
                }
            }
        });

        // 设置主界面返回键的兜底（按返回弹出退出确认）
        TvUi.back.setFallback(() => {
            // 这里写你的退出确认逻辑
            console.log("show exit confirm");
            return true;  // 返回 true 表示已处理
        });
    }
    // 初始化焦点图标

}


// update (dt) {}

