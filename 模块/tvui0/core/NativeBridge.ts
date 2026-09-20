import TvUiConfigManager from "../config/TvUiConfigManager";

export type NativeCallback = (action: string, data?: any) => void;
export type NativeBridgeCallback = (code: number, data?: any, action?: string) => void;

declare const global: any;

let callbackId = 100;
let nativeCallback: NativeCallback | null = null;
const root: any = typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : {});

function hasBridge(): boolean {
    return root.AppBridge && typeof root.AppBridge.call == "function";
}

function log(message: string, data?: any) {
    if (data !== undefined) {
        console.log("[NativeBridge] " + message, data);
    } else {
        console.log("[NativeBridge] " + message);
    }
}

function normalizeCallbackData(data: any): any {
    if (typeof data == "string") {
        try {
            return JSON.parse(data);
        } catch (e) {
            return { message: data };
        }
    }
    return data || {};
}

function handleCallback(id: string, code: number, data: any, action: string) {
    const callbacks = root._tvuiCallbacks || {};
    id = id || root._tvuiLastCallbackId;
    const callback: NativeBridgeCallback = callbacks[id];
    if (callback) {
        callback(code, data, action);
        delete callbacks[id];
    }
}

function bridgeCall(action: string, data?: any, callback?: NativeBridgeCallback) {
    const id = "cb_" + (++callbackId);
    root._tvuiLastCallbackId = id;
    if (callback) {
        root._tvuiCallbacks = root._tvuiCallbacks || {};
        root._tvuiCallbacks[id] = callback;
    }

    if (!hasBridge()) {
        log("AppBridge not found, skip in preview: " + action);
        if (callback) {
            callback(-1, { message: "AppBridge not found" }, action);
            delete root._tvuiCallbacks[id];
        }
        return;
    }

    root.AppBridge.call(JSON.stringify({
        action: action,
        data: data || {},
        callbackId: id
    }));
}

root.onNativeBridgeCallback = function (action: string, data?: any) {
    data = normalizeCallbackData(data);
    log("native callback: " + action, data);

    switch (action) {
        case "onBridgeCallback":
        case "onDeviceInfo":
        case "onReward":
        case "onAdClosed":
        case "onAdFailed":
        case "onPopupAdLoaded":
        case "onPopupAdClosed":
        case "onPopupAdFailed":
        case "onAggregateReward":
        case "onAggregateAdClosed":
        case "onAggregateAdFailed":
        case "onAggregatePopupAdLoaded":
        case "onAggregatePopupAdClosed":
        case "onAggregatePopupAdFailed":
        case "onRankUploaded":
        case "onRankList":
            handleCallback(data.callbackId || data.callback_id, data.code, data.data || data, action);
            break;
    }

    if (nativeCallback) nativeCallback(action, data);
};

export default class NativeBridge {
    public static hasBridge(): boolean {
        return hasBridge();
    }

    public static call(action: string, data?: any, callback?: NativeBridgeCallback) {
        bridgeCall(action, data || {}, callback);
    }

    public static getDeviceInfo(callback?: NativeBridgeCallback) {
        bridgeCall("getDeviceInfo", {}, callback);
    }

    public static onGameReady() {
        bridgeCall("onGameReady", { version: TvUiConfigManager.getConfig().version || "1.0.0" });
    }

    public static onGamePause() {
        bridgeCall("onGamePause", {});
    }

    public static onGameResume() {
        bridgeCall("onGameResume", {});
    }

    public static onExitGame() {
        bridgeCall("exitGame", {});
    }

    public static uploadRank(data: any, callback?: NativeBridgeCallback) {
        bridgeCall("uploadRank", data, callback);
    }

    public static getRankList(data: any, callback?: NativeBridgeCallback) {
        bridgeCall("getRankList", data, callback);
    }

    public static setNativeCallback(callback: NativeCallback | null) {
        nativeCallback = callback;
    }
}
