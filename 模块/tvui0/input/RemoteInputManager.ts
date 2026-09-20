import KeyCodeAdapter, { TvRemoteKey } from "./KeyCodeAdapter";

type KeyHandler = (keyCode: number) => boolean | void;

export default class RemoteInputManager {
    private static handlers: { [key: string]: KeyHandler[] } = {};
    private static enabled: boolean = false;
    private static domInputEnabled: boolean = false;
    private static lastKeyCode: number = -1;
    private static lastDispatchTime: number = 0;
    private static readonly DISPATCH_DEBOUNCE_MS: number = 160;

    public static enable() {
        if (this.enabled) return;
        this.enabled = true;
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        this.enableDomInput();
        this.focusCanvas();
    }

    public static disable() {
        if (!this.enabled) return;
        this.enabled = false;
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        this.disableDomInput();
        this.lastKeyCode = -1;
        this.lastDispatchTime = 0;
    }

    public static clear() {
        this.handlers = {};
    }

    public static on(key: TvRemoteKey, handler: KeyHandler) {
        if (!this.handlers[key]) this.handlers[key] = [];
        this.handlers[key].push(handler);
    }

    public static off(key: TvRemoteKey, handler: KeyHandler) {
        let list = this.handlers[key];
        if (!list) return;
        let index = list.indexOf(handler);
        if (index >= 0) list.splice(index, 1);
    }

    public static toRemoteKey(keyCode: number): TvRemoteKey {
        return KeyCodeAdapter.toRemoteKey(keyCode);
    }

    public static dispatchKeyCode(keyCode: number): boolean {
        let now = Date.now();
        if (keyCode == this.lastKeyCode && now - this.lastDispatchTime < this.DISPATCH_DEBOUNCE_MS) {
            return false;
        }
        this.lastKeyCode = keyCode;
        this.lastDispatchTime = now;

        let key = KeyCodeAdapter.toRemoteKey(keyCode);
        let list = this.handlers[key] || [];
        for (let i = list.length - 1; i >= 0; i--) {
            let result = list[i](keyCode);
            if (result !== false) return true;
        }
        return false;
    }

    private static onKeyDown(event: cc.Event.EventKeyboard) {
        this.dispatchKeyCode(event.keyCode);
    }

    private static enableDomInput() {
        if (this.domInputEnabled || typeof window == "undefined") return;
        this.domInputEnabled = true;
        window.addEventListener("keydown", this.onDomKeyDown, true);
    }

    private static disableDomInput() {
        if (!this.domInputEnabled || typeof window == "undefined") return;
        this.domInputEnabled = false;
        window.removeEventListener("keydown", this.onDomKeyDown, true);
    }

    private static onDomKeyDown(event: KeyboardEvent) {
        let handled = RemoteInputManager.dispatchKeyCode(event.keyCode || event.which);
        if (handled && event.preventDefault) event.preventDefault();
    }

    private static focusCanvas() {
        if (typeof document == "undefined") return;
        try {
            let canvas = (cc && cc.game && cc.game.canvas) ? cc.game.canvas : document.querySelector("canvas");
            if (canvas) {
                (canvas as any).tabIndex = (canvas as any).tabIndex || 0;
                if (typeof (canvas as any).focus == "function") {
                    (canvas as any).focus();
                    return;
                }
            }
            if (typeof window != "undefined" && typeof window.focus == "function") window.focus();
        } catch (e) {
        }
    }
}
