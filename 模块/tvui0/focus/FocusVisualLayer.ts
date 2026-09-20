import TvUiConfigManager from "../config/TvUiConfigManager";
import { TvUiIconItem } from "../config/TvUiConfig";
import IconManager from "../icon/IconManager";
import FocusManager, { FocusRuntimeItem } from "./FocusManager";

const { ccclass } = cc._decorator;

@ccclass
export default class FocusVisualLayer extends cc.Component {
    private graphics: cc.Graphics | null = null;
    private iconNode: cc.Node | null = null;
    private iconSprite: cc.Sprite | null = null;
    private currentItem: FocusRuntimeItem | null = null;
    private currentIconConfig: TvUiIconItem | null = null;
    private inited: boolean = false;

    public static create(parent: cc.Node): FocusVisualLayer {
        let node = parent.getChildByName("FocusVisualLayer");
        if (!node) {
            node = new cc.Node("FocusVisualLayer");
            parent.addChild(node, 800);
        }
        let layer = node.getComponent(FocusVisualLayer);
        if (!layer) layer = node.addComponent(FocusVisualLayer);
        layer.init();
        return layer;
    }

    onDestroy() {
        FocusManager.offFocusChanged(this.onFocusChanged);
        TvUiConfigManager.offChanged(this.onConfigChanged);
    }

    public init() {
        if (this.inited) return;
        this.inited = true;
        this.node.zIndex = (TvUiConfigManager.getConfig().focus || {}).zIndex || 800;
        this.resizeToParent();
        this.buildView();
        FocusManager.onFocusChanged(this.onFocusChanged);
        TvUiConfigManager.onChanged(this.onConfigChanged);
        this.refresh(FocusManager.getCurrentFocusItem());
    }

    update() {
        if (!this.currentItem) return;
        this.drawFocus(this.currentItem);
        if (this.iconNode && this.iconNode.active && this.currentIconConfig) {
            this.positionIcon(this.currentItem, this.currentIconConfig);
        }
    }

    private buildView() {
        if (!this.graphics) {
            this.graphics = this.node.addComponent(cc.Graphics);
        }
        if (!this.iconNode) {
            this.iconNode = new cc.Node("FocusIcon");
            this.iconNode.zIndex = 2;
            this.iconSprite = this.iconNode.addComponent(cc.Sprite);
            this.iconSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            this.node.addChild(this.iconNode, 2);
        }
        this.node.active = false;
    }

    private onFocusChanged = (item: FocusRuntimeItem | null) => {
        this.refresh(item);
    }

    private onConfigChanged = () => {
        this.node.zIndex = (TvUiConfigManager.getConfig().focus || {}).zIndex || 800;
        this.refresh(this.currentItem);
    }

    private refresh(item: FocusRuntimeItem | null) {
        this.currentItem = item;
        if (!item || item.showCursor === false) {
            this.hide();
            return;
        }
        this.node.active = true;
        this.drawFocus(item);
        this.refreshIcon(item);
    }

    private hide() {
        this.node.active = false;
        this.currentItem = null;
        if (this.graphics) this.graphics.clear();
        if (this.iconNode) this.iconNode.active = false;
        this.currentIconConfig = null;
    }

    private drawFocus(item: FocusRuntimeItem) {
        if (!item || !item.node || !item.node.isValid || !item.node.activeInHierarchy) {
            this.hide();
            return;
        }
        this.resizeToParent();
        let focusConfig = TvUiConfigManager.getConfig().focus || {};
        if (focusConfig.enabled === false) {
            this.hide();
            return;
        }
        if (!this.graphics) return;
        this.graphics.clear();
        if (focusConfig.frameEnabled !== true) {
            return;
        }
        let box = item.node.getBoundingBoxToWorld();
        let center = cc.v2(box.x + box.width / 2, box.y + box.height / 2);
        let local = this.node.convertToNodeSpaceAR(center);
        let padding = focusConfig.framePadding || 0;
        this.graphics.lineWidth = focusConfig.lineWidth || 4;
        this.graphics.strokeColor = this.parseColor(focusConfig.frameColor || "#ffd451", focusConfig.frameOpacity);
        this.graphics.rect(local.x - box.width / 2 - padding, local.y - box.height / 2 - padding, box.width + padding * 2, box.height + padding * 2);
        this.graphics.stroke();
    }

    private refreshIcon(item: FocusRuntimeItem) {
        let iconKey = item.iconKey || (TvUiConfigManager.getConfig().focus || {}).defaultIconKey || "default";
        IconManager.getSpriteFrame(iconKey, (frame: cc.SpriteFrame | null, iconConfig?: TvUiIconItem | null) => {
            if (this.currentItem != item || !this.iconNode || !this.iconSprite) return;
            if (!frame) {
                this.iconNode.active = false;
                return;
            }
            this.iconNode.active = true;
            this.iconSprite.spriteFrame = frame;
            this.currentIconConfig = iconConfig || {};
            this.positionIcon(item, this.currentIconConfig);
        });
    }

    private positionIcon(item: FocusRuntimeItem, iconConfig: TvUiIconItem) {
        if (!item || !item.node || !item.node.isValid) return;
        let focusConfig = TvUiConfigManager.getConfig().focus || {};
        let box = item.node.getBoundingBoxToWorld();
        let center = cc.v2(box.x + box.width / 2, box.y + box.height / 2);
        let local = this.node.convertToNodeSpaceAR(center);
        let width = iconConfig.width || 60;
        let height = iconConfig.height || 60;
        let offsetX = iconConfig.offsetX;
        let offsetY = iconConfig.offsetY;
        if (offsetX === undefined) offsetX = focusConfig.iconOffsetX || 0;
        if (offsetY === undefined) offsetY = focusConfig.iconOffsetY || 0;
        if (!this.iconNode) return;
        let x = local.x + box.width / 2 + offsetX;
        let y = local.y + box.height / 2 + offsetY;
        if ((focusConfig.iconPlacement || "bottomRight") == "bottomRight") {
            y = local.y - box.height / 2 - offsetY;
        }
        this.iconNode.setContentSize(width, height);
        this.iconNode.setPosition(x, y);
    }

    private resizeToParent() {
        let parent = this.node.parent;
        let width = parent && parent.width ? parent.width : (cc.winSize && cc.winSize.width) || 1920;
        let height = parent && parent.height ? parent.height : (cc.winSize && cc.winSize.height) || 1080;
        this.node.setContentSize(width, height);
        this.node.setPosition(0, 0);
    }

    private parseColor(hex: string, opacity?: number): cc.Color {
        hex = (hex || "#ffd451").replace("#", "");
        let r = parseInt(hex.substr(0, 2), 16);
        let g = parseInt(hex.substr(2, 2), 16);
        let b = parseInt(hex.substr(4, 2), 16);
        return cc.color(r || 255, g || 212, b || 81, opacity === undefined ? 230 : opacity);
    }
}
