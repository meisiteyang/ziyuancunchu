// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import emitevent, { EventName } from "../event/emitevent";
import PageSet from "./PageSet";


const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {



    // LIFE-CYCLE CALLBACKS:

    onLoad() {

    }

    start() {


    }
    onEnable(): void {

        PageSet.nowNode = this.node
        console.log("打开0", PageSet.nowNode.name)

        emitevent.instance.emit(EventName.change_fouce)



    }
    onDisable(): void {
          // 只有当前页面被关闭时才触发返回上一页
        // 避免其他窗口（如 MenuWin 被 closeOther 销毁）误触发 closePage 移除当前页面
        if (PageSet.nowNode === this.node) {
            emitevent.instance.emit(EventName.back_tomain)
        }

    }
    // update (dt) {}

}
