// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import FocusManager from "../input/FocusManager";



const { ccclass, property } = cc._decorator;

@ccclass
export default class foucepic extends cc.Component {
  

    @property(cc.Node)
    nodepicnode: cc.Node = null

    @property(cc.Node)
    foucepicnode: cc.Node = null

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        
    }

    update(dt) {
        let focusNode =  FocusManager.getCurrentFocusNode().name
     
        if (FocusManager.getCurrentFocusNode() == this.node) {
            if (this.nodepicnode != null && this.foucepicnode != null) {
                this.nodepicnode.active = false
                this.foucepicnode.active = true
            }
   
        } else {
            if (this.nodepicnode != null && this.foucepicnode != null) {
                this.nodepicnode.active = true
                this.foucepicnode.active = false
            }
            
        }
        
    }
}
