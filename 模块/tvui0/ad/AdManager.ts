import TvUiConfigManager from "../config/TvUiConfigManager";
import { TvUiAdChannelConfig, TvUiAdSlotConfig } from "../config/TvUiConfig";
import IAdProvider, { AdRuntimeData, AdShowOptions, AdShowResult } from "./IAdProvider";
import AggregateAdProvider from "./AggregateAdProvider";
import SelfAdProvider from "./SelfAdProvider";
import MockAdProvider from "./MockAdProvider";

export default class AdManager {
    private static providers: { [type: string]: IAdProvider } = {};

    public static init() {
        this.providers = {};
        this.registerProvider(new AggregateAdProvider());
        this.registerProvider(new SelfAdProvider());
        this.registerProvider(new MockAdProvider());
    }

    public static registerProvider(provider: IAdProvider) {
        if (!provider || !provider.type) return;
        this.providers[provider.type] = provider;
    }

    public static showSlot(slotId: string, options: AdShowOptions = {}): Promise<boolean> {
        let slotConfig = this.getSlotConfig(slotId);
        if (!slotConfig || slotConfig.enabled === false) {
            if (options.onFail) options.onFail({ message: "ad slot disabled", slotId: slotId });
            return Promise.resolve(false);
        }

        let channels = this.getSortedChannels(slotConfig);
        return this.showByChannels(slotId, slotConfig, options, channels, 0, null).then((result: AdShowResult) => {
            if (result && (result.status == "success" || result.status == "loaded")) return true;
            if (result && result.status == "closed") return false;
            if (options.onFail) {
                options.onFail((result && result.error) || { message: "all ad channels failed", slotId: slotId });
            }
            return false;
        });
    }

    public static hideSlot(slotId: string) {
        let slotConfig = this.getSlotConfig(slotId);
        let channels = slotConfig ? this.getSortedChannels(slotConfig) : [];
        if (channels.length > 0) {
            for (let i = 0; i < channels.length; i++) {
                let channel = channels[i];
                let provider = channel && this.providers[channel.type];
                if (provider) provider.hide(slotId, channel);
            }
            return;
        }
        for (let type in this.providers) {
            if (this.providers.hasOwnProperty(type)) this.providers[type].hide(slotId);
        }
    }

    public static refreshSlot(slotId: string, options: AdShowOptions = {}) {
        this.hideSlot(slotId);
        return this.showSlot(slotId, options);
    }

    public static showReward(options: AdShowOptions): Promise<boolean> {
        options = this.mergeOptions(options, { mode: "reward" });
        return this.showSlot((options && options.slotId) || "reward", options);
    }

    public static showPopup(options: AdShowOptions): Promise<boolean> {
        options = this.mergeOptions(options, { mode: "popup" });
        return this.showSlot((options && options.slotId) || (options && options.scene) || "popup", options);
    }

    public static hidePopup(scene?: string) {
        this.hideSlot(scene || "popup");
    }

    private static getSlotConfig(slotId: string): TvUiAdSlotConfig {
        let config = TvUiConfigManager.getConfig();
        let ads = config.ads || {};
        return ads[slotId] || ads["popup"] || null;
    }

    private static showByChannels(
        slotId: string,
        slotConfig: TvUiAdSlotConfig,
        options: AdShowOptions,
        channels: TvUiAdChannelConfig[],
        index: number,
        lastError: any
    ): Promise<AdShowResult> {
        if (index >= channels.length) {
            return Promise.resolve({ status: "failed", error: lastError || { message: "ad channels empty", slotId: slotId } });
        }

        let channel = channels[index];
        if (!channel || channel.enabled === false) {
            return this.showByChannels(slotId, slotConfig, options, channels, index + 1, lastError);
        }

        let provider = this.providers[channel.type];
        if (!provider) {
            return this.showByChannels(slotId, slotConfig, options, channels, index + 1, { message: "ad provider missing", channel: channel.type });
        }
        if (!provider.isAvailable()) {
            return this.showByChannels(slotId, slotConfig, options, channels, index + 1, { message: "ad provider unavailable", channel: channel.type });
        }

        let data: AdRuntimeData = {
            slotId: slotId,
            slotConfig: slotConfig,
            channel: channel,
            options: options
        };
        return provider.load(data).then((runtimeData: AdRuntimeData) => {
            return provider.show(runtimeData);
        }).then((result: AdShowResult) => {
            if (!result || result.status == "failed") {
                if (options && options.mode == "reward") return result || <AdShowResult>{ status: "failed", error: lastError };
                return this.showByChannels(slotId, slotConfig, options, channels, index + 1, result && (result.error || result.data));
            }
            return result;
        }).catch((error: any) => {
            if (options && options.mode == "reward") return <AdShowResult>{ status: "failed", error: error };
            return this.showByChannels(slotId, slotConfig, options, channels, index + 1, error);
        });
    }

    private static getSortedChannels(slotConfig: TvUiAdSlotConfig): TvUiAdChannelConfig[] {
        let channels: TvUiAdChannelConfig[] = [];
        let configured = (slotConfig && slotConfig.channels) || [];
        for (let i = 0; i < configured.length; i++) {
            if (configured[i]) channels.push(configured[i]);
        }
        if (slotConfig && slotConfig.fallback) {
            channels.push(this.normalizeFallback(slotConfig.fallback));
        }
        if (!this.hasChannelType(channels, "mock")) {
            channels.push({ type: "mock", priority: 100 });
        }
        channels.sort((a: TvUiAdChannelConfig, b: TvUiAdChannelConfig) => {
            return this.getPriority(a) - this.getPriority(b);
        });
        return channels;
    }

    private static normalizeFallback(fallback: TvUiAdChannelConfig): TvUiAdChannelConfig {
        if (fallback.type) return fallback;
        let result: any = this.mergeOptions(<any>fallback, {});
        result.type = (fallback.imagePath || fallback.imageUrl) ? "self" : "mock";
        if (result.priority === undefined) result.priority = 90;
        return result;
    }

    private static hasChannelType(channels: TvUiAdChannelConfig[], type: string): boolean {
        for (let i = 0; i < channels.length; i++) {
            if (channels[i] && channels[i].type == type) return true;
        }
        return false;
    }

    private static getPriority(channel: TvUiAdChannelConfig): number {
        if (!channel || channel.priority === undefined) return 999;
        return channel.priority;
    }

    private static mergeOptions(base: AdShowOptions, extra: AdShowOptions): AdShowOptions {
        let result: any = {};
        let key: string;
        base = base || {};
        extra = extra || {};
        for (key in base) result[key] = (<any>base)[key];
        for (key in extra) result[key] = (<any>extra)[key];
        return result;
    }
}
