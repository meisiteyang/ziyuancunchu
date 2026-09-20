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
export default class OpneEvent extends cc.Component {



    // LIFE-CYCLE CALLBACKS:

    onLoad() {

    }

    start() {


    }
    onEnable(): void {
        setTimeout(() => {
        PageSet.nowNode = this.node
        console.log("打开0", PageSet.nowNode.name)

        emitevent.instance.emit(EventName.change_fouce)

        }, 100)

    }
    onDisable(): void {
        console.log("关闭", PageSet.nowNode.name)
        emitevent.instance.emit(EventName.back_tomain)

    }
    onDestroy(): void {

    }
    // update (dt) {}

}
