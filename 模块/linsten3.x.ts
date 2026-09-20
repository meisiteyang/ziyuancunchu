// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        // 页面打开时聚焦到游戏画布（canvas），以便接收键盘输入
        this.focusGameCanvas();
        // 添加键盘按下监听
        this.addKeyboardListener();
    }

    onDestroy() {
        this.removeKeyboardListener();
    }

    /**
     * 将焦点聚焦到游戏画布（Cocos 生成的 GameCanvas 元素）
     */
    private focusGameCanvas(): void {
        if (typeof document === 'undefined') return;
        const canvas: HTMLCanvasElement = document.getElementById('GameCanvas') as HTMLCanvasElement;
        if (canvas) {
            // 确保 canvas 可获得 focus
            if (!canvas.hasAttribute('tabindex')) {
                canvas.setAttribute('tabindex', '0');
            }
            // 避免被其他元素夺走焦点
            canvas.focus();
        }
        // 同时对当前 window 做一次聚焦
        if (typeof window !== 'undefined' && window.focus) {
            try { window.focus(); } catch (e) { /* noop */ }
        }
    }

    /**
     * 添加键盘按下事件监听
     */
    private addKeyboardListener(): void {
        // 使用 Cocos 的系统事件
        if (cc.systemEvent) {
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        }
        // 同时监听原生 DOM 事件，确保浏览器环境下一定能收到输入
        if (typeof document !== 'undefined' && document.addEventListener) {
            document.addEventListener('keydown', this.onDomKeyDown, true);
            document.addEventListener('keyup', this.onDomKeyUp, true);
        }
    }

    private removeKeyboardListener(): void {
        if (cc.systemEvent) {
            cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
            cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        }
        if (typeof document !== 'undefined' && document.removeEventListener) {
            document.removeEventListener('keydown', this.onDomKeyDown, true);
            document.removeEventListener('keyup', this.onDomKeyUp, true);
        }
    }

    /**
     * Cocos 键盘按下回调
     */
    private onKeyDown(event: cc.Event.EventKeyboard): void {
        // TODO: 在这里处理按下逻辑
        cc.log('[linsten] KEY_DOWN:', event.keyCode);
    }

    /**
     * Cocos 键盘抬起回调
     */
    private onKeyUp(event: cc.Event.EventKeyboard): void {
        // TODO: 在这里处理抬起逻辑
        // cc.log('[linsten] KEY_UP:', event.keyCode);
    }

    /**
     * DOM 键盘按下回调（备用方案，覆盖 Cocos 可能未触发的场景）
     */
    private onDomKeyDown = (event: KeyboardEvent): void => {
        // TODO: 在这里处理按下逻辑
        // cc.log('[linsten] DOM_KEY_DOWN:', event.keyCode, event.code);
    };

    /**
     * DOM 键盘抬起回调
     */
    private onDomKeyUp = (event: KeyboardEvent): void => {
        // TODO: 在这里处理抬起逻辑
        // cc.log('[linsten] DOM_KEY_UP:', event.keyCode, event.code);
    };

    // update (dt) {}
}