export type TvUiDirection = "up" | "down" | "left" | "right";

export interface TvUiIconItem {
    path?: string;
    url?: string;
    width?: number;
    height?: number;
    offsetX?: number;
    offsetY?: number;
}

export interface TvUiFocusVisualConfig {
    enabled?: boolean;
    frameEnabled?: boolean;
    framePadding?: number;
    frameColor?: string;
    frameOpacity?: number;
    lineWidth?: number;
    animationTime?: number;
    defaultIconKey?: string;
    iconPlacement?: "topRight" | "bottomRight";
    iconOffsetX?: number;
    iconOffsetY?: number;
    zIndex?: number;
}

export interface TvUiAdChannelConfig {
    type: string;
    enabled?: boolean;
    priority?: number;
    placementId?: string;
    rewardType?: string;
    action?: string;
    rewardAction?: string;
    popupAction?: string;
    hideAction?: string;
    imagePath?: string;
    imageUrl?: string;
}

export interface TvUiAdSlotConfig {
    enabled?: boolean;
    mode?: "reward" | "popup" | "banner" | "self" | string;
    channels?: TvUiAdChannelConfig[];
    fallback?: TvUiAdChannelConfig;
}

export interface TvUiAdSdkConfig {
    platform?: "xiaomi" | string;
    adapterConfig?: any;
}

export interface TvUiConfig {
    designWidth?: number;
    designHeight?: number;
    resolutionPolicy?: number;
    cpId?: string;
    version?: string;
    configPath?: string;
    defaultScopeId?: string;
    enableRemoteInput?: boolean;
    enableCursor?: boolean;
    enableLifecycle?: boolean;
    focus?: TvUiFocusVisualConfig;
    icons?: { [key: string]: TvUiIconItem };
    ads?: { [slotId: string]: TvUiAdSlotConfig };
    adSdk?: TvUiAdSdkConfig;
    nativeCallback?: (action: string, data?: any) => void;
}

export function createDefaultTvUiConfig(): TvUiConfig {
    return {
        designWidth: 1920,
        designHeight: 1080,
        cpId: "ppl",
        version: "1.0.0",
        configPath: "tvui/config/default",
        defaultScopeId: "page",
        enableRemoteInput: true,
        enableLifecycle: true,
        focus: {
            enabled: true,
            frameEnabled: false,
            framePadding: 10,
            frameColor: "#ffd451",
            frameOpacity: 230,
            lineWidth: 5,
            animationTime: 0.1,
            defaultIconKey: "default",
            iconPlacement: "bottomRight",
            iconOffsetX: -20,
            iconOffsetY: 20,
            zIndex: 800
        },
        icons: {
            "default": {
                path: "tvui/icons/pointer-yellow-60",
                width: 60,
                height: 60,
                offsetX: -20,
                offsetY: 20
            },
            "yellow": {
                path: "tvui/icons/pointer-yellow-60",
                width: 60,
                height: 60,
                offsetX: -20,
                offsetY: 20
            },
            "blue": {
                path: "tvui/icons/pointer-blue-60",
                width: 60,
                height: 60,
                offsetX: -20,
                offsetY: 20
            },
            "pink": {
                path: "tvui/icons/pointer-pink-60",
                width: 60,
                height: 60,
                offsetX: -20,
                offsetY: 20
            }
        },
        adSdk: {
            platform: "xiaomi"
        },
        ads: {
            "reward": {
                enabled: true,
                mode: "reward",
                channels: [
                    { type: "aggregate", priority: 1, rewardType: "reward" },
                    { type: "mock", priority: 100 }
                ]
            },
            "popup": {
                enabled: true,
                mode: "popup",
                channels: [
                    { type: "aggregate", priority: 1 },
                    { type: "mock", priority: 100 }
                ]
            },
            "game": {
                enabled: true,
                mode: "popup",
                channels: [
                    { type: "aggregate", priority: 1 },
                    { type: "mock", priority: 100 }
                ]
            }
        }
    };
}
