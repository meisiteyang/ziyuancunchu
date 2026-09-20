// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import TvUi from "../../drscript/core/TvUi";


const { ccclass, property } = cc._decorator;

@ccclass
export default class AdmgrBase {
    //单例化
    static _instance: AdmgrBase = null;
    constructor() {
        if (AdmgrBase._instance) {
            return AdmgrBase._instance;
        }
        AdmgrBase._instance = this;
    }
    public static getInstance(): AdmgrBase {
        return AdmgrBase._instance;
    }
    /**
     * 加载广告
     
     * trigger_scene 场景标识
     * reward_type 奖励类型
     * callbacks1 callback.bind(this) 用户看完广告 → 发奖励                     
     * callbacks2 callback.bind(this)用户中途关闭广告 → 不发奖励                
     * callbacks3 callback.bind(this)所有渠道都失败（会自动进入 mock 兜底）            
     */
    //看广告
    public static showReward(trigger_scene: string, reward_type: string, callbacks1, callbacks2?, callbacks3?) {

        TvUi.ads.showReward({
            // trigger_scene: trigger_scene,        // 场景标识
            // reward_type: reward_type,            // 奖励类型
            onSuccess: (data) => {
                // 用户看完广告 → 发奖励
                if (callbacks1) {
                    callbacks1()
                }
            },
            onClose: (data) => {
                // 用户中途关闭广告 → 不发奖励
                if (callbacks2) {
                    callbacks2()
                }
            },
            onFail: (error) => {
                // 所有渠道都失败（会自动进入 mock 兜底）

                if (callbacks3) {
                    callbacks3()
                }
            }
        });
    }
}
