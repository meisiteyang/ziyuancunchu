// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
import TvUi from "./tvui/core/TvUi";
const { ccclass, property } = cc._decorator;

@ccclass
export default class adMgr extends cc.Component {

    @property(cc.Node)
    node: cc.Node = null;



    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {

    }
    //看广告
    showReward() {
        TvUi.ads.showReward({
            scene: "free_coin",            // 场景标识
            rewardType: "coin",            // 奖励类型
            onSuccess: (data) => {
                // 用户看完广告 → 发奖励
                this.relive()
            },
            onClose: (data) => {
                // 用户中途关闭广告 → 不发奖励
                console.log("ad closed, no reward");
            },
            onFail: (error) => {
                // 所有渠道都失败（会自动进入 mock 兜底）
                console.log("ad failed", error);
            }
        });
    }
    relive() {
        console.log("复活")
        this.node.getParent().getChildByName("mainNode").getComponent("Main").relive()
    }
    // update (dt) {}
}
