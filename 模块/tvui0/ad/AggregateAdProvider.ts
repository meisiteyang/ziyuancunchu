import TvUiConfigManager from "../config/TvUiConfigManager";
import NativeBridge from "../core/NativeBridge";
import { TvUiAdChannelConfig } from "../config/TvUiConfig";
import IAdProvider, { AdRuntimeData, AdShowResult } from "./IAdProvider";
import { AdSdk, AdPlatform, AdType, AdErrorCode } from "../vendor/ad-sdk/ad-sdk";

export default class AggregateAdProvider implements IAdProvider {
    public type: string = "aggregate";

    private static initialized: boolean = false;
    private static initTask: Promise<void> | null = null;
    private static gameReadyNotified: boolean = false;

    public isAvailable(): boolean {
        return NativeBridge.hasBridge();
    }

    public load(data: AdRuntimeData): Promise<AdRuntimeData> {
        return this.ensureSdk().then(() => data);
    }

    public show(data: AdRuntimeData): Promise<AdShowResult> {
        let options = data.options || {};
        let mode = options.mode || data.slotConfig.mode || "popup";
        if (mode == "reward") {
            return this.showReward(data);
        }
        return this.showPopup(data);
    }

    public hide(slotId: string, channel?: TvUiAdChannelConfig): void {
        if (!AggregateAdProvider.initialized || !this.isAvailable()) return;
        let runtime = TvUiConfigManager.getConfig();
        try {
            AdSdk.hidePopupAd({
                cpId: runtime.cpId || "ppl",
                triggerScene: slotId || "",
                placementId: (channel && channel.placementId) || ""
            });
        } catch (error) {
            console.warn("[AggregateAdProvider] hide popup failed", error);
        }
    }

    private showReward(data: AdRuntimeData): Promise<AdShowResult> {
        let options = data.options || {};
        let channel = data.channel || <any>{};
        let runtime = TvUiConfigManager.getConfig();
        return AdSdk.requestAd({
            adType: AdType.RewardVideo,
            cpId: options.cpId || runtime.cpId || "ppl",
            rewardType: options.reward_type || channel.rewardType || "reward",
            triggerScene: options.trigger_scene || data.slotId,
            extra: options.extra || {}
        }).then((result: any) => {
            if (!result || result.isCompleted !== true) {
                if (options.onClose) options.onClose(result);
                return <AdShowResult>{ status: "closed", data: result };
            }
            if (options.onSuccess) options.onSuccess(result);
            return <AdShowResult>{ status: "success", data: result };
        }).catch((error: any) => {
            if (this.isUserAbandoned(error)) {
                if (options.onClose) options.onClose(error);
                return <AdShowResult>{ status: "closed", data: error };
            }
            return <AdShowResult>{ status: "failed", error: error };
        });
    }

    private showPopup(data: AdRuntimeData): Promise<AdShowResult> {
        let options = data.options || {};
        let channel = data.channel || <any>{};
        let runtime = TvUiConfigManager.getConfig();
        return AdSdk.requestPopupAd({
            adType: AdType.Interstitial,
            cpId: options.cpId || runtime.cpId || "ppl",
            rewardType: options.reward_type || channel.rewardType || "popup",
            triggerScene: options.trigger_scene || data.slotId,
            placementId: channel.placementId || "",
            extra: options.extra || {}
        }).then((result: any) => {
            if (result && result.isClosed) {
                if (options.onClose) options.onClose(result);
                return <AdShowResult>{ status: "closed", data: result };
            }
            if (options.onLoad) options.onLoad(result);
            return <AdShowResult>{ status: "loaded", data: result };
        }).catch((error: any) => {
            return <AdShowResult>{ status: "failed", error: error };
        });
    }

    private ensureSdk(): Promise<void> {
        if (AggregateAdProvider.initialized) return Promise.resolve();
        if (AggregateAdProvider.initTask) return AggregateAdProvider.initTask;

        let runtime = TvUiConfigManager.getConfig();
        let adSdkConfig = runtime.adSdk || {};
        let platform = this.getPlatform(adSdkConfig.platform || "xiaomi");
        let adapterConfig: any = {};
        let customConfig = adSdkConfig.adapterConfig || {};
        let key: string;
        adapterConfig.cpId = runtime.cpId || "ppl";
        for (key in customConfig) adapterConfig[key] = customConfig[key];

        let adapters: any = {};
        adapters[platform] = adapterConfig;

        AggregateAdProvider.initTask = AdSdk.init({
            platform: platform,
            adapters: adapters
        }).then(() => {
            AggregateAdProvider.initialized = true;
            this.notifyGameReady(runtime.version || Consts.GAME_VERSION);
        }).catch((error: any) => {
            AggregateAdProvider.initTask = null;
            throw error;
        });
        return AggregateAdProvider.initTask;
    }

    private notifyGameReady(version:string) {
        if (AggregateAdProvider.gameReadyNotified) return;
        AggregateAdProvider.gameReadyNotified = true;
        try {
            AdSdk.onGameReady(version || Consts.GAME_VERSION);
        } catch (error) {
            console.warn("[AggregateAdProvider] onGameReady failed", error);
        }
    }

    private getPlatform(platform: string): any {
        if (platform == "xiaomi" || !platform) return AdPlatform.Xiaomi;
        return platform;
    }

    private isUserAbandoned(error: any): boolean {
        if (!error) return false;
        return error.code == AdErrorCode.UserAbandoned
            || error.code == 1006
            || error.isCompleted === false
            || error.is_completed === false
            || error.message == "Ad closed by user before completion";
    }
}
