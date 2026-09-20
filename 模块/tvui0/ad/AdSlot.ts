import AdManager from "./AdManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AdSlot extends cc.Component {
    @property
    slotId: string = "popup";

    @property
    showOnLoad: boolean = false;

    onEnable() {
        if (this.showOnLoad) this.show();
    }

    onDisable() {
        this.hide();
    }

    public show() {
        AdManager.showSlot(this.slotId, { container: this.node });
    }

    public hide() {
        AdManager.hideSlot(this.slotId);
    }

    public refresh() {
        AdManager.refreshSlot(this.slotId, { container: this.node });
    }

    public static show(slotId: string) {
        return AdManager.showSlot(slotId);
    }

    public static hide(slotId: string) {
        AdManager.hideSlot(slotId);
    }

    public static refresh(slotId: string) {
        return AdManager.refreshSlot(slotId);
    }
}
