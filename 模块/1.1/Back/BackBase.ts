// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { AdSdk, KeyAction, KeyCode } from "../../tvui/vendor/ad-sdk/ad-sdk";
import PageSet from "../Page/PageSet";
import BackControl from "./BackControl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BackBase {

    /**
     * 单例化
     */
    private static _instance: BackBase = null;
    public static getInstance(): BackBase {
        if (this._instance == null) {
            this._instance = new BackBase();
        }
        return this._instance;
    }

    start() {

    }
    // 返回回调
    back_call = null
    backcall() {
        BackControl.getInstance().SetSingleback();
        if (this.back_call != null) {
            this.back_call();
        }

    }
    setBackCall(callbacks: () => void) {
        this.back_call = callbacks;
    }
    // update (dt) {}
}
