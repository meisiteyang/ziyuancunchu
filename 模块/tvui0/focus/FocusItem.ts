import FocusManager from "./FocusManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class FocusItem extends cc.Component {
    @property
    focusId: string = "";

    @property
    scopeId: string = "";

    @property
    iconKey: string = "";

    @property
    up: string = "";

    @property
    down: string = "";

    @property
    left: string = "";

    @property
    right: string = "";

    @property
    focusScale: number = 1.08;

    @property
    autoRegister: boolean = true;

    onEnable() {
        if (this.autoRegister) FocusManager.register(this);
    }

    onDisable() {
        if (this.autoRegister) FocusManager.unregister(this.node);
    }

    onFocus() {
    }

    onBlur() {
    }

    onConfirm() {
        let button = this.node.getComponent(cc.Button);
        if (button && button.interactable) {
            cc.Component.EventHandler.emitEvents(button.clickEvents, null);
        } else {
            this.node.emit(cc.Node.EventType.TOUCH_END);
        }
    }
}
