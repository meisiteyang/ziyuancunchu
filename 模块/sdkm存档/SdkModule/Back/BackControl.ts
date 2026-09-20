// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import PageSet from "../Page/PageSet";
import BackBase from "./BackBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BackControl extends cc.Component {
    //单例化
    private static _instance: BackControl = null;
    public static getInstance(): BackControl {
        if (this._instance == null) {
            this._instance = new BackControl();
        }
        return this._instance;
    }
    SetSingleback() {
        console.log('SetSingleback', PageSet.nowNode)
        console.log('SetSingleback', PageSet.nowNode.name)
        switch (PageSet.nowNode.name) {
            case "Canvas":
                console.log("Canvas");
              BackBase.getInstance().setBackCall(this.close);
                break;

                break;
            default:
               BackBase.getInstance().setBackCall(null);
                break;
        }
    }

    nullcall() {
        console.log("确定返回吗？")
        BackBase.getInstance().setBackCall(null);
    }
    close() {
        console.log("关闭页面")
        PageSet.nowNode.active = false;
    }
}
