import TvUiConfigManager from "../config/TvUiConfigManager";
import { TvUiConfig } from "../config/TvUiConfig";
import FocusManager from "../focus/FocusManager";
import FocusVisualLayer from "../focus/FocusVisualLayer";
import IconManager from "../icon/IconManager";
import AdManager from "../ad/AdManager";
import RemoteInputManager from "../input/RemoteInputManager";
import { TvRemoteKey } from "../input/KeyCodeAdapter";
import BackManager from "./BackManager";
import NativeBridge from "./NativeBridge";

declare const global: any;

const { ccclass } = cc._decorator;

@ccclass
export default class TvUiRoot extends cc.Component {
    private static instance: TvUiRoot | null = null;
    private static backHandler: (() => boolean | void) | null = null;
    private visualLayer: FocusVisualLayer | null = null;
    private configured: boolean = false;

    public static ensure(config?: TvUiConfig): TvUiRoot {
        if (this.instance && this.instance.node && this.instance.node.isValid) {
            if (config) this.instance.configure(config);
            return this.instance;
        }
        let scene = cc.director.getScene();
        let node = new cc.Node("TvUiRoot");
        node.zIndex = 800;
        scene.addChild(node, 800);
        if (cc.game && cc.game.addPersistRootNode) {
            cc.game.addPersistRootNode(node);
        }
        this.instance = node.addComponent(TvUiRoot);
        this.instance.configure(config || {});
        return this.instance;
    }

    public static getInstance(): TvUiRoot | null {
        return this.instance;
    }

    public static setBackHandler(handler: (() => boolean | void) | null) {
        this.backHandler = handler;
        if (this.instance) this.instance.bindInputHandlers();
    }

    onLoad() {
        TvUiRoot.instance = this;
        this.resize();
        this.exposeGlobal();
    }

    onDestroy() {
        if (TvUiRoot.instance == this) TvUiRoot.instance = null;
    }

    public configure(config?: TvUiConfig) {
        this.configured = true;
        TvUiConfigManager.init(config || {}, () => {
            this.applyConfig();
        });
        this.applyConfig();
    }

    private applyConfig() {
        if (!this.configured) return;
        let config = TvUiConfigManager.getConfig();
        if (cc.view && config.designWidth && config.designHeight) {
            cc.view.setDesignResolutionSize(
                config.designWidth,
                config.designHeight,
                config.resolutionPolicy || cc.ResolutionPolicy.SHOW_ALL
            );
        }
        this.resize();
        IconManager.init();
        AdManager.init();
        this.ensureVisualLayer();
        this.bindInputHandlers();
        this.exposeGlobal();
    }

    private ensureVisualLayer() {
        let config = TvUiConfigManager.getConfig();
        if (config.focus && config.focus.enabled === false) return;
        this.visualLayer = FocusVisualLayer.create(this.node);
    }

    private bindInputHandlers() {
        let config = TvUiConfigManager.getConfig();
        RemoteInputManager.clear();
        if (config.enableRemoteInput === false) {
            RemoteInputManager.disable();
            return;
        }
        RemoteInputManager.enable();
        RemoteInputManager.on(TvRemoteKey.Ok, () => FocusManager.confirm());
        RemoteInputManager.on(TvRemoteKey.Left, () => FocusManager.move("left"));
        RemoteInputManager.on(TvRemoteKey.Right, () => FocusManager.move("right"));
        RemoteInputManager.on(TvRemoteKey.Up, () => FocusManager.move("up"));
        RemoteInputManager.on(TvRemoteKey.Down, () => FocusManager.move("down"));
        RemoteInputManager.on(TvRemoteKey.Back, () => {
            if (TvUiRoot.backHandler) return TvUiRoot.backHandler() !== false;
            return FocusManager.back();
        });
    }

    private resize() {
        let width = (cc.winSize && cc.winSize.width) || 1920;
        let height = (cc.winSize && cc.winSize.height) || 1080;
        this.node.setContentSize(width, height);
        this.node.setPosition(0, 0);
    }

    private exposeGlobal() {
        let root: any = typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : null);
        if (!root) return;
        root.TvUiRoot = TvUiRoot;
        if (root.TvUi) {
            root.tvui = root.TvUi;
            return;
        }
        if (root.tvui) return;
        root.tvui = {
            root: TvUiRoot,
            config: TvUiConfigManager,
            focus: FocusManager,
            icon: IconManager,
            ads: AdManager,
            input: RemoteInputManager,
            api: NativeBridge,
            back: BackManager
        };
    }
}
