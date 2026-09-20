import { createDefaultTvUiConfig, TvUiConfig } from "./TvUiConfig";

type ConfigListener = (config: TvUiConfig) => void;

export default class TvUiConfigManager {
    private static readonly LOCAL_KEY = "tvui_local_config";
    private static config: TvUiConfig = createDefaultTvUiConfig();
    private static projectConfig: TvUiConfig | null = null;
    private static resourceConfig: TvUiConfig | null = null;
    private static listeners: ConfigListener[] = [];

    public static init(config?: TvUiConfig, callback?: (config: TvUiConfig) => void) {
        this.projectConfig = config || {};
        this.rebuildConfig();
        this.loadResourceConfig((loaded: boolean) => {
            if (loaded) {
                this.rebuildConfig();
                this.emitChanged();
            }
            if (callback) callback(this.config);
        });
    }

    public static getConfig(): TvUiConfig {
        return this.config;
    }

    public static updateConfig(config: TvUiConfig, saveLocal: boolean = false) {
        if (saveLocal) {
            this.saveLocalConfig(config);
        } else {
            this.projectConfig = this.merge(this.projectConfig || {}, config || {});
        }
        this.rebuildConfig();
        this.emitChanged();
    }

    public static onChanged(listener: ConfigListener) {
        if (!listener) return;
        if (this.listeners.indexOf(listener) < 0) this.listeners.push(listener);
    }

    public static offChanged(listener: ConfigListener) {
        let index = this.listeners.indexOf(listener);
        if (index >= 0) this.listeners.splice(index, 1);
    }

    private static rebuildConfig() {
        let next = this.merge(createDefaultTvUiConfig(), this.resourceConfig || {});
        next = this.merge(next, this.projectConfig || {});
        next = this.merge(next, this.loadLocalConfig());
        this.config = next;
    }

    private static loadResourceConfig(callback: (loaded: boolean) => void) {
        let path = (this.projectConfig && this.projectConfig.configPath) || this.config.configPath;
        if (!path || !cc || !cc.loader || !cc.loader.loadRes) {
            callback(false);
            return;
        }

        cc.loader.loadRes(path, (error: Error, asset: any) => {
            if (error || !asset) {
                callback(false);
                return;
            }
            let json = asset.json || asset;
            this.resourceConfig = json || null;
            callback(!!this.resourceConfig);
        });
    }

    private static loadLocalConfig(): TvUiConfig {
        try {
            let raw = cc.sys.localStorage.getItem(this.LOCAL_KEY);
            if (!raw) return {};
            return JSON.parse(raw) || {};
        } catch (e) {
            return {};
        }
    }

    private static saveLocalConfig(config: TvUiConfig) {
        let local = this.merge(this.loadLocalConfig(), config || {});
        try {
            cc.sys.localStorage.setItem(this.LOCAL_KEY, JSON.stringify(local));
        } catch (e) {
            console.warn("[TvUiConfigManager] save local config failed", e);
        }
    }

    private static emitChanged() {
        for (let i = 0; i < this.listeners.length; i++) {
            this.listeners[i](this.config);
        }
    }

    private static merge(base: any, extra: any): any {
        let result: any = {};
        let key: string;
        base = base || {};
        extra = extra || {};
        for (key in base) {
            if (!base.hasOwnProperty(key)) continue;
            result[key] = this.clone(base[key]);
        }
        for (key in extra) {
            if (!extra.hasOwnProperty(key)) continue;
            if (this.isPlainObject(result[key]) && this.isPlainObject(extra[key])) {
                result[key] = this.merge(result[key], extra[key]);
            } else {
                result[key] = this.clone(extra[key]);
            }
        }
        return result;
    }

    private static clone(value: any): any {
        if (value instanceof Array) {
            let list = [];
            for (let i = 0; i < value.length; i++) list.push(this.clone(value[i]));
            return list;
        }
        if (this.isPlainObject(value)) {
            return this.merge({}, value);
        }
        return value;
    }

    private static isPlainObject(value: any): boolean {
        return value && typeof value == "object" && !(value instanceof Array);
    }
}
