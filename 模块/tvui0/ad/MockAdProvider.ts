import IAdProvider, { AdRuntimeData, AdShowResult } from "./IAdProvider";

export default class MockAdProvider implements IAdProvider {
    public type: string = "mock";

    public isAvailable(): boolean {
        return true;
    }

    public load(data: AdRuntimeData): Promise<AdRuntimeData> {
        return Promise.resolve(data);
    }

    public show(data: AdRuntimeData): Promise<AdShowResult> {
        let options = data.options || {};
        let mode = options.mode || data.slotConfig.mode || "popup";
        console.log("[MockAdProvider] show", data.slotId, mode);
        return new Promise<AdShowResult>((resolve) => {
            setTimeout(() => {
                let result = { mock: true, slotId: data.slotId };
                if (mode == "reward") {
                    let rewardResult = { isCompleted: true, mock: true, slotId: data.slotId };
                    if (options.onSuccess) options.onSuccess(rewardResult);
                    resolve({ status: "success", data: rewardResult });
                } else {
                    if (options.onLoad) options.onLoad(result);
                    resolve({ status: "loaded", data: result });
                }
            }, 0);
        });
    }

    public hide(slotId: string): void {
        console.log("[MockAdProvider] hide", slotId);
    }
}
