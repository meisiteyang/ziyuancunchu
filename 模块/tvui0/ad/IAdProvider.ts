import { TvUiAdChannelConfig, TvUiAdSlotConfig } from "../config/TvUiConfig";

export interface AdShowOptions {
    slotId?: string;
    mode?: string;
    cpId?: string;
    trigger_scene?: string;
    reward_type?: string;
    extra?: any;
    container?: cc.Node;
    onLoad?: (data?: any) => void;
    onSuccess?: (data?: any) => void;
    onClose?: (data?: any) => void;
    onFail?: (data?: any) => void;
}

export interface AdRuntimeData {
    slotId: string;
    slotConfig: TvUiAdSlotConfig;
    channel: TvUiAdChannelConfig;
    options: AdShowOptions;
}

export type AdShowResultStatus = "success" | "loaded" | "closed" | "failed";

export interface AdShowResult {
    status: AdShowResultStatus;
    data?: any;
    error?: any;
    action?: string;
}

export default interface IAdProvider {
    type: string;
    isAvailable(): boolean;
    load(data: AdRuntimeData): Promise<AdRuntimeData>;
    show(data: AdRuntimeData): Promise<AdShowResult>;
    hide(slotId: string, channel?: TvUiAdChannelConfig): void;
}
