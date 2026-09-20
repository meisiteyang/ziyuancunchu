import TvUiRoot from "./TvUiRoot";
import BackManager from "./BackManager";
import NativeBridge from "./NativeBridge";
import TvUiConfigManager from "../config/TvUiConfigManager";
import { TvUiConfig } from "../config/TvUiConfig";
import FocusManager from "../focus/FocusManager";
import IconManager from "../icon/IconManager";
import AdManager from "../ad/AdManager";
import RemoteInputManager from "../input/RemoteInputManager";

declare const global: any;

export default class TvUi {
    public static root = TvUiRoot;
    public static config = TvUiConfigManager;
    public static focus = FocusManager;
    public static icon = IconManager;
    public static ads = AdManager;
    public static api = NativeBridge;
    public static input = RemoteInputManager;
    public static back = BackManager;
    private static initialized: boolean = false;

    public static init(config?: TvUiConfig) {
        TvUiRoot.ensure(config || {});
        TvUiRoot.setBackHandler(() => BackManager.handle());
        NativeBridge.setNativeCallback((action: string, data?: any) => {
            let runtime = TvUiConfigManager.getConfig();
            if (runtime.nativeCallback) runtime.nativeCallback(action, data);
        });

        let runtime = TvUiConfigManager.getConfig();
        if (!this.initialized && runtime.enableLifecycle !== false) {
            NativeBridge.onGameReady();
            cc.game.on(cc.game.EVENT_HIDE, this.onGameHide, this);
            cc.game.on(cc.game.EVENT_SHOW, this.onGameShow, this);
        }

        this.exposeGlobal();
        this.initialized = true;
    }

    public static destroy() {
        cc.game.off(cc.game.EVENT_HIDE, this.onGameHide, this);
        cc.game.off(cc.game.EVENT_SHOW, this.onGameShow, this);
        RemoteInputManager.disable();
        RemoteInputManager.clear();
        TvUiRoot.setBackHandler(null);
        FocusManager.reset();
        BackManager.reset();
        NativeBridge.setNativeCallback(null);
        this.initialized = false;
    }

    private static exposeGlobal() {
        let runtimeRoot: any = typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : null);
        if (!runtimeRoot) return;
        runtimeRoot.TvUi = TvUi;
        runtimeRoot.tvui = TvUi;
    }

    private static onGameHide() {
        NativeBridge.onGamePause();
    }

    private static onGameShow() {
        NativeBridge.onGameResume();
    }
}
