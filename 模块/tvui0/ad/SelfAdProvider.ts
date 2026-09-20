import IAdProvider, { AdRuntimeData, AdShowResult } from "./IAdProvider";

export default class SelfAdProvider implements IAdProvider {
    public type: string = "self";

    public isAvailable(): boolean {
        return true;
    }

    public load(data: AdRuntimeData): Promise<AdRuntimeData> {
        return Promise.resolve(data);
    }

    public show(data: AdRuntimeData): Promise<AdShowResult> {
        let channel = data.channel || <any>{};
        let options = data.options || {};
        let path = channel.imagePath || (data.slotConfig.fallback && data.slotConfig.fallback.imagePath);
        if (!path || !options.container) {
            if (options.onLoad) options.onLoad({ self: true, slotId: data.slotId });
            return Promise.resolve({ status: "loaded", data: { self: true, slotId: data.slotId } });
        }
        let node = options.container;
        let sprite = node.getComponent(cc.Sprite) || node.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        return new Promise<AdShowResult>((resolve) => {
            cc.loader.loadRes(path, cc.SpriteFrame, (error: Error, frame: cc.SpriteFrame) => {
                if (error || !frame) {
                    resolve({ status: "failed", error: error || { message: "self ad frame missing" } });
                    return;
                }
                sprite.spriteFrame = frame;
                node.active = true;
                if (options.onLoad) options.onLoad({ self: true, slotId: data.slotId });
                resolve({ status: "loaded", data: { self: true, slotId: data.slotId } });
            });
        });
    }

    public hide(_slotId: string): void {
    }
}
