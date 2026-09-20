// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class DataBase {
    // 单例化
    private static _instance: DataBase = null;
    public static getInstance(): DataBase {
        if (this._instance == null) {
            this._instance = new DataBase();
        }
        return this._instance;
    }
    // 用户id
    uid: string = "";
    // 昵称
    nickName: string = "";
    // 头像
    avatar: string = "";
    // 设备信息
    sheBei: any = null;
    // 上报信息
    reportInfo: any = null;

}
