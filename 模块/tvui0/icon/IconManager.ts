import TvUiConfigManager from "../config/TvUiConfigManager";
import { TvUiIconItem } from "../config/TvUiConfig";

type SpriteFrameCallback = (spriteFrame: cc.SpriteFrame | null, config?: TvUiIconItem | null) => void;

export default class IconManager {
    private static cache: { [key: string]: cc.SpriteFrame } = {};
    private static inited: boolean = false;

    public static init() {
        if (this.inited) return;
        this.inited = true;
        TvUiConfigManager.onChanged(() => {
            this.cache = {};
        });
    }

    public static getIconConfig(iconKey?: string): TvUiIconItem | null {
        let config = TvUiConfigManager.getConfig();
        let key = iconKey || (config.focus && config.focus.defaultIconKey) || "default";
        let icons = config.icons || {};
        return icons[key] || icons["default"];
    }

    public static getSpriteFrame(iconKey: string, callback: SpriteFrameCallback) {
        let iconConfig = this.getIconConfig(iconKey);
        if (!iconConfig) {
            callback(null, null);
            return;
        }
        let cacheKey = iconConfig.url || iconConfig.path || iconKey || "default";
        if (this.cache[cacheKey]) {
            callback(this.cache[cacheKey], iconConfig);
            return;
        }
        if (iconConfig.url) {
            this.loadRemote(iconConfig, cacheKey, callback);
            return;
        }
        this.loadLocal(iconConfig, cacheKey, callback);
    }

    public static setIconTheme(iconKey: string) {
        let config = TvUiConfigManager.getConfig();
        if (!config.icons || !config.icons[iconKey]) return;
        TvUiConfigManager.updateConfig({
            focus: {
                defaultIconKey: iconKey
            }
        }, true);
    }

    public static clearCache() {
        this.cache = {};
    }

    private static loadLocal(iconConfig: TvUiIconItem, cacheKey: string, callback: SpriteFrameCallback) {
        if (!iconConfig.path) {
            callback(null, iconConfig);
            return;
        }
        cc.loader.loadRes(iconConfig.path, cc.SpriteFrame, (error: Error, frame: cc.SpriteFrame) => {
            if (error || !frame) {
                this.loadFallback(cacheKey, callback);
                return;
            }
            this.cache[cacheKey] = frame;
            callback(frame, iconConfig);
        });
    }

    private static loadRemote(iconConfig: TvUiIconItem, cacheKey: string, callback: SpriteFrameCallback) {
        let assetManager = (cc as any).assetManager;
        if (!assetManager || !assetManager.loadRemote) {
            this.loadFallback(cacheKey, callback);
            return;
        }
        assetManager.loadRemote(iconConfig.url, { ext: ".png" }, (error: Error, texture: cc.Texture2D) => {
            if (error || !texture) {
                this.loadFallback(cacheKey, callback);
                return;
            }
            let frame = new cc.SpriteFrame(texture);
            this.cache[cacheKey] = frame;
            callback(frame, iconConfig);
        });
    }

    private static loadFallback(cacheKey: string, callback: SpriteFrameCallback) {
        let fallback = this.getIconConfig("default");
        if (!fallback || fallback.path == cacheKey) {
            callback(null, fallback);
            return;
        }
        this.loadLocal(fallback, fallback.path || "default", callback);
    }
}
