// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import FocusManager from "../../tvui/focus/FocusManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Node)
    fistNode: cc.Node = null;


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    protected onEnable(): void {
        // FocusManager.reset();
        FocusManager.focusNode(this.fistNode)
    }
    start() {
                // FocusManager.reset();
        FocusManager.focusNode(this.fistNode)
    }

    // update (dt) {}
}
