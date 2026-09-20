// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import FocusManager from "../../drscript/focus/FocusManager";




const { ccclass, property } = cc._decorator;

@ccclass
export default class fouceseting extends cc.Component {

    @property(cc.Node)
    fistNode: cc.Node = null;


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    protected onEnable(): void {
        // FocusManager.reset();
        this.scheduleOnce(() => {
            FocusManager.focusNode(this.fistNode)
        }, 0.2)
    }
    start() {
        // FocusManager.reset();
        this.scheduleOnce(() => {
            FocusManager.focusNode(this.fistNode)
        }, 0.2)
    }

    // update (dt) {}
}
