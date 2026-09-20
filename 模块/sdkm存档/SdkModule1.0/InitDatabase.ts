// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import TvUi from "../tvui/core/TvUi";
import { AdPlatform, AdSdk, KeyAction, KeyCode, Reporter } from "../tvui/vendor/ad-sdk/ad-sdk";
import BackBase from "./Back/BackBase";
import DataBase from "./Data/DataBase";
import emitevent, { EventName } from "./event/emitevent";
import PageSet from "./Page/PageSet";
import RankBase from "./Rank/RankBase";


const { ccclass, property } = cc._decorator;

@ccclass
export default class InitDatabase extends cc.Component {
    @property
    project: string = "";

   
    @property(cc.Node)
    exitpage: cc.Node = null;
    onLoad() {
        this.initfouce();
        this.emitEvent();
        this.keyEvent();
        this.SetPage();
    }
    async start() {

        await this.initSdk();
        await Promise.all([
            this.initPlayerInfo(),
            this.initDeviceInfo()
        ]);
        Reporter.init(
            {
                // content_id: this.project,
                // /** 游戏名 */
                // content_title: this.project,
            }
        );
        RankBase.getInstance().InitRank(this.project);


    }
    /**
     * 页面设置
     */
    SetPage() {
        PageSet.exitpage = this.exitpage
        // PageSet.pusharr.push(this.basepage)
    }
    /*
     * 初始键盘监听
     */
    keyEvent() {

        AdSdk.onKeyEvent(function (e) {
            var isDown = e.action === KeyAction.Down;

            if (isDown) {
                switch (e.key) {
                    // case KeyCode.Enter:
                    //     break;
                    case KeyCode.Back:

                        PageSet.back_keybord();

                        break;
                    case KeyCode.Up:
                        break;
                    case KeyCode.Down:
                        break;
                    case KeyCode.Left:
                        break;
                    case KeyCode.Right:

                        break;
                    case KeyCode.Menu:

                        break;
                }
            } else {
                // 松开（up）— 用于停止移动、结束长按等

            }
        });
    }
      /*
     * 初始事件监听
     */
    emitEvent() {
        emitevent.instance.on(EventName.change_fouce, this.change_fouce, this);
        emitevent.instance.on(EventName.back_tomain, this.back_tomain, this);
    }
    change_fouce() {
        PageSet.openPage()
    }
    back_tomain() {
        PageSet.closePage()
    }
    /**
     * 初始化sdk
     */
    async initSdk() {
        await AdSdk.init({ platform: AdPlatform.Xiaomi });
    }
    /**
     * 初始化玩家信息
     */
    async initPlayerInfo() {
        try {
            const userInfo = await AdSdk.getAccount();
            DataBase.getInstance().uid = userInfo.uid;
            DataBase.getInstance().nickName = userInfo.nickname;
            DataBase.getInstance().avatar = userInfo.avatar;

        } catch (error) {
            console.error('获取玩家账户信息失败:', error);
        }

    }
    /**
     * 初始化设备信息
     */
    async initDeviceInfo() {
        try {
            const deviceInfo = await AdSdk.getDeviceInfo();
            DataBase.getInstance().sheBei = deviceInfo;
        } catch (error) {
            console.error('获取设备信息失败:', error);
        }
    }
    tvUiInited: boolean = false;
    /**
     * 初始化焦点
     */
    initfouce() {
        if (this.tvUiInited) return;
        this.tvUiInited = true;

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
        // TvUi.back.setFallback(() => {
        //     // 这里写你的退出确认逻辑
        //     console.log("show exit confirm");
        //     return true;  // 返回 true 表示已处理
        // });
    }
  
}
