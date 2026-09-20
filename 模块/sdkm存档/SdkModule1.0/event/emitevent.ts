// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

/**
 * 事件回调函数类型：支持任意数量参数
 */
type EventCallback = (...args: any[]) => void;

/**
 * 内部存储结构：一个事件名对应一组 { callback, target, once 
 */
interface EventHandler {
    callback: EventCallback;
    target?: any;
    once: boolean;
}

const { ccclass } = cc._decorator;

/**
 * emit / on / off 全局事件总线
 *
 * 用法：
 *   1. 作为单例使用：
 *       import emitevent from "./emitevent";
 *       emitevent.instance.on('player_dead', this.onDead, this);
 *       emitevent.instance.emit('player_dead', playerInfo);
 *       emitevent.instance.off('player_dead', this.onDead, this);
 *
 *   2. 或者直接导出为 cc.EventDispatch（和现有代码兼容，可在 JS/TS 中混用）：
 *       cc.EventDispatch.on('active_layer', callback);
 *       cc.EventDispatch.emit('active_layer', 'mainLayer');
 */
@ccclass
export default class emitevent {

    private static _instance: emitevent = null;

    public static get instance(): emitevent {
        if (emitevent._instance == null) {
            emitevent._instance = new emitevent();
        }
        return emitevent._instance;
    }

    /** 事件名 -> 回调列表 */
    private _events: { [eventName: string]: EventHandler[] } = {};

    constructor() {
        // 保持空构造函数
    }

    // ============== 核心 API ==============

    /**
     * 注册事件监听
     * @param eventName 事件名
     * @param callback  回调函数
     * @param target   this 绑定对象（可选）
     */
    public on(eventName: string, callback: EventCallback, target?: any): void {
        if (!eventName || !callback) return;
        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }
        // 避免重复注册（同一 callback + target）
        const list = this._events[eventName];
        for (let i = 0; i < list.length; i++) {
            const h = list[i];
            if (h.callback === callback && h.target === target && !h.once) {
                return;
            }
        }
        list.push({ callback, target, once: false });
    }

    /**
     * 注册一次性监听（触发后自动移除）
     */
    public once(eventName: string, callback: EventCallback, target?: any): void {
        if (!eventName || !callback) return;
        if (!this._events[eventName]) {
            this._events[eventName] = [];
        }
        this._events[eventName].push({ callback, target, once: true });
    }

    /**
     * 派发事件
     * @param eventName 事件名
     * @param args      可变参数列表
     */
    public emit(eventName: string, ...args: any[]): void {
        const list = this._events[eventName];
        if (!list || list.length === 0) return;

        // 复制一份，避免在回调里 off/on 导致迭代异常
        const snapshot = list.slice();
        for (let i = 0; i < snapshot.length; i++) {
            const h = snapshot[i];
            try {
                if (h.target) {
                    h.callback.apply(h.target, args);
                } else {
                    h.callback(...args);
                }
            } catch (e) {
                cc.error && cc.error('[emitevent] 事件回调异常:', eventName, e);
            }
            if (h.once) {
                this._remove(eventName, h.callback, h.target);
            }
        }
    }

    /**
     * 移除事件监听
     * 若不传 callback：移除该事件所有监听；
     * 若不传 target：仅按 callback 匹配移除；
     * 若都传：按 callback + target 匹配移除。
     */
    public off(eventName: string, callback?: EventCallback, target?: any): void {
        if (!this._events[eventName]) return;
        if (callback == null) {
            // 移除整个事件
            delete this._events[eventName];
            return;
        }
        this._remove(eventName, callback, target);
    }

    /**
     * 按 target 批量移除所有相关事件
     */
    public targetOff(target: any): void {
        if (target == null) return;
        for (const eventName in this._events) {
            const list = this._events[eventName];
            for (let i = list.length - 1; i >= 0; i--) {
                if (list[i].target === target) {
                    list.splice(i, 1);
                }
            }
            if (list.length === 0) {
                delete this._events[eventName];
            }
        }
    }

    /**
     * 清空所有事件
     */
    public clear(): void {
        this._events = {};
    }

    /**
     * 是否有某事件的监听
     */
    public hasListener(eventName: string): boolean {
        const list = this._events[eventName];
        return !!(list && list.length > 0);
    }

    // ============== 内部工具 ==============

    private _remove(eventName: string, callback: EventCallback, target?: any): void {
        const list = this._events[eventName];
        if (!list) return;
        for (let i = list.length - 1; i >= 0; i--) {
            const h = list[i];
            const cbMatch = h.callback === callback;
            const tgMatch = target === undefined ? true : h.target === target;
            if (cbMatch && tgMatch) {
                list.splice(i, 1);
            }
        }
        if (list.length === 0) {
            delete this._events[eventName];
        }
    }

    // ============== 与 cc.EventDispatch 兼容 API（全局对象） ==============
    // 兼容现有 JS 文件中使用的 cc.EventDispatch.emit / cc.EventDispatch.on 调用方式
    // 只需在项目启动时调用一次 emitevent.installToCC() 即可。

    /**
     * 将本事件总线挂到 cc.EventDispatch 上，使旧代码无需改动即可继续运行。
     */
    public static installToCC(): void {
        const self = emitevent.instance;
        const dispatch: any = {
            on: (name: string, cb: EventCallback, target?: any) => self.on(name, cb, target),
            once: (name: string, cb: EventCallback, target?: any) => self.once(name, cb, target),
            off: (name: string, cb?: EventCallback, target?: any) => self.off(name, cb, target),
            emit: (name: string, ...args: any[]) => self.emit(name, ...args),
            targetOff: (target: any) => self.targetOff(target),
            clear: () => self.clear(),
            hasListener: (name: string) => self.hasListener(name),
        };
        (cc as any).EventDispatch = dispatch;
        if (typeof (cc as any).EventDispatch === 'undefined') {
            (cc as any).EventDispatch = dispatch;
        }
    }

    // ============== 生命周期（保留，可在 cc._decorator 环境中挂到节点上时使用） ==============

    start() {
        // 挂载到节点上时自动安装到 cc.EventDispatch
        emitevent.installToCC();
    }

    // update (dt) {}
}

/**
 * 便捷导出：与 JS 项目常见事件名常量（可自行扩展）
 */
export const EventName = {
   Close_Windows:"Close_Windows",
   Open_MainScence:"Open_MainScence",
   Open_GameScence:"open_GameScence",
   change_fouce:"change_fouce",
   back_tomain:"back_tomain",
   close_exitpage:"close_exitpage"
} as const;