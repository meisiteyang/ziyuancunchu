// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import FocusManager from "../../tvui/focus/FocusManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PageSet {
    public static pusharr: cc.Node[] = []
    public static nowNode: cc.Node = null;
    public static exitpage: cc.Node = null;
    public static openPage() {
        for (let i = PageSet.pusharr.length - 1; i >= 0; i--) {
            if (PageSet.pusharr[i].active == false) {
                console.log('删除了', PageSet.pusharr[i].name)
                PageSet.pusharr.splice(i, 1)

            }
        }
        if (PageSet.pusharr.indexOf(PageSet.nowNode) == -1) {
            PageSet.pusharr.push(PageSet.nowNode)
        }
        FocusManager.reset()
        FocusManager.registerButtons(PageSet.nowNode)
        console.log('openPage', PageSet.pusharr)

    }

    public static closePage() {

        // 倒序删除当前页面
        for (let i = PageSet.pusharr.length - 1; i >= 0; i--) {
            // if (PageSet.pusharr[i] == PageSet.nowNode) {
            //     console.log('删除了', PageSet.pusharr[i].name)
            //     PageSet.pusharr.splice(i, 1)
            //     break
            // }
            if (PageSet.pusharr[i].active == false) {
                console.log('删除了', PageSet.pusharr[i].name)
                PageSet.pusharr.splice(i, 1)
                break
            }
        }

        // PageSet.pusharr.pop()

        PageSet.nowNode = PageSet.pusharr[PageSet.pusharr.length - 1]
        PageSet.openPage()
        console.log('closePage', PageSet.pusharr)
    }

    // public static back_keybord() {
    //     if (PageSet.pusharr.length == 1) {
    //         console.log('最后一个了', PageSet.pusharr)
    //         console.log(' PageSet.exitpage', PageSet.exitpage)
    //         PageSet.exitpage.active = true
    //         return
    //     }
    //     console.log('执行', PageSet.pusharr)
    //     PageSet.nowNode.active = false
    //     PageSet.closePage()
    // }
}
