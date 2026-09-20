import { TvUiDirection } from "../config/TvUiConfig";
import KeyCodeAdapter, { TvRemoteKey } from "../input/KeyCodeAdapter";
import FocusScope from "./FocusScope";

export interface FocusOptions {
    root?: cc.Node;
    scopeId?: string;
    focusId?: string;
    iconKey?: string;
    up?: string;
    down?: string;
    left?: string;
    right?: string;
    onClick?: Function;
    onFocus?: Function;
    onBlur?: Function;
    focusScale?: number;
    showCursor?: boolean;
}

export interface FocusCursorOptions {
    basePath?: string;
    normalPath?: string;
    focusPath?: string;
    corner?: string;
    width?: number;
    height?: number;
    offsetX?: number;
    offsetY?: number;
}

export interface FocusRuntimeItem {
    node: cc.Node;
    root?: cc.Node;
    scopeId: string;
    focusId: string;
    iconKey?: string;
    up?: string;
    down?: string;
    left?: string;
    right?: string;
    onClick?: Function;
    onFocus?: Function;
    onBlur?: Function;
    component?: any;
    baseScaleX: number;
    baseScaleY: number;
    focusScale: number;
    showCursor: boolean;
}

type FocusListener = (item: FocusRuntimeItem | null, previous?: FocusRuntimeItem | null) => void;

export default class FocusManager {
    private static items: FocusRuntimeItem[] = [];
    private static itemMap: { [focusId: string]: FocusRuntimeItem } = {};
    private static currentFocusId: string = "";
    private static scopes: FocusScope[] = [new FocusScope("page")];
    private static activeScopeId: string = "page";
    private static listeners: FocusListener[] = [];
    private static cursorOptions: FocusCursorOptions | null = null;

    public static setCursor(options: FocusCursorOptions | null) {
        this.cursorOptions = options;
    }

    public static getCursor(): FocusCursorOptions | null {
        return this.cursorOptions;
    }

    public static register(target: cc.Node | any, options: FocusOptions = {}) {
        let node = this.resolveNode(target);
        if (!node) return;
        let component = this.resolveComponent(target, node);
        this.unregister(node);

        let focusId = options.focusId || (component && component.focusId) || node.uuid || this.createFocusId(node);
        this.unregisterById(focusId);

        let item: FocusRuntimeItem = {
            node: node,
            root: options.root,
            scopeId: options.scopeId || (component && component.scopeId) || this.activeScopeId || "page",
            focusId: focusId,
            iconKey: options.iconKey || (component && component.iconKey) || "",
            up: options.up || (component && component.up) || "",
            down: options.down || (component && component.down) || "",
            left: options.left || (component && component.left) || "",
            right: options.right || (component && component.right) || "",
            onClick: options.onClick,
            onFocus: options.onFocus || (component && component.onFocus),
            onBlur: options.onBlur || (component && component.onBlur),
            component: component,
            baseScaleX: node.scaleX || node.scale || 1,
            baseScaleY: node.scaleY || node.scale || 1,
            focusScale: options.focusScale || (component && component.focusScale) || 1.08,
            showCursor: options.showCursor !== false
        };

        this.items.push(item);
        this.itemMap[item.focusId] = item;
        this.ensureFocus();
    }

    public static unregister(target: cc.Node | any) {
        let node = this.resolveNode(target);
        if (!node) return;
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (this.items[i].node == node) {
                this.removeItemAt(i);
            }
        }
        this.ensureFocus();
    }

    public static unregisterByRoot(root: cc.Node) {
        if (!root) return;
        for (let i = this.items.length - 1; i >= 0; i--) {
            let item = this.items[i];
            if (item.root == root || this.isChildOf(item.node, root)) {
                this.removeItemAt(i);
            }
        }
        this.ensureFocus();
    }

    public static unregisterById(focusId: string) {
        if (!focusId) return;
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (this.items[i].focusId == focusId) this.removeItemAt(i);
        }
    }

    public static registerButtons(root: cc.Node, options: FocusOptions = {}) {
        if (!root) return;
        this.unregisterByRoot(root);
        this.walk(root, (node: cc.Node) => {
            let button = node.getComponent(cc.Button);
            if (!button) return;
            this.register(node, {
                root: root,
                scopeId: options.scopeId || this.activeScopeId,
                iconKey: options.iconKey,
                focusScale: options.focusScale || 1.08,
                onClick: () => this.invokeButton(button)
            });
        });
        this.ensureFocus();
    }

    public static pushScope(scopeId: string, root?: cc.Node, firstFocus?: string | cc.Node) {
        scopeId = scopeId || "modal";
        let currentScope = this.getActiveScope();
        if (currentScope) currentScope.lastFocusId = this.currentFocusId;
        for (let i = 0; i < this.scopes.length; i++) {
            if (this.scopes[i].scopeId == scopeId) {
                this.scopes.splice(i, 1);
                break;
            }
        }
        this.scopes.push(new FocusScope(scopeId, root));
        this.activeScopeId = scopeId;
        this.setFocusById("", true);
        if (firstFocus) this.focus(firstFocus);
        this.ensureFocus();
    }

    public static popScope(scopeId?: string) {
        if (this.scopes.length <= 1) return;
        let target = scopeId || this.activeScopeId;
        for (let i = this.scopes.length - 1; i >= 1; i--) {
            if (this.scopes[i].scopeId == target) {
                this.scopes.splice(i, 1);
                break;
            }
        }
        let active = this.scopes[this.scopes.length - 1];
        this.activeScopeId = active ? active.scopeId : "page";
        let restored = active && active.lastFocusId ? this.focus(active.lastFocusId) : false;
        if (!restored) {
            this.setFocusById("", true);
            this.ensureFocus();
        }
    }

    public static reset() {
        let old = this.getCurrentFocusItem();
        if (old) this.setFocusVisual(old, false);
        this.items = [];
        this.itemMap = {};
        this.currentFocusId = "";
        this.scopes = [new FocusScope("page")];
        this.activeScopeId = "page";
        this.emitFocusChanged(null, old);
    }

    public static focus(target: string | cc.Node): boolean {
        this.cleanup();
        if (!target) return false;
        let item: FocusRuntimeItem | null = null;
        if (typeof target == "string") {
            item = this.itemMap[target];
        } else {
            for (let i = 0; i < this.items.length; i++) {
                if (this.items[i].node == target) {
                    item = this.items[i];
                    break;
                }
            }
        }
        if (!item || !this.isItemActive(item) || !this.isInActiveScope(item)) return false;
        this.setFocusById(item.focusId);
        return true;
    }

    public static focusNode(node: cc.Node): boolean {
        return this.focus(node);
    }

    public static move(direction: TvUiDirection): boolean {
        this.cleanup();
        let current = this.getCurrentFocusItem();
        if (!current) {
            this.ensureFocus();
            return !!this.getCurrentFocusItem();
        }

        let explicitId = current[direction];
        if (explicitId && this.focus(explicitId)) return true;

        let vector = this.getDirectionVector(direction);
        let currentCenter = this.getWorldCenter(current.node);
        let best: FocusRuntimeItem | null = null;
        let bestScore = Number.MAX_VALUE;

        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (item == current || !this.isItemActive(item) || !this.isInActiveScope(item)) continue;
            let center = this.getWorldCenter(item.node);
            let dx = center.x - currentCenter.x;
            let dy = center.y - currentCenter.y;
            if (vector.x != 0 && dx * vector.x <= 8) continue;
            if (vector.y != 0 && dy * vector.y <= 8) continue;
            let primary = vector.x != 0 ? Math.abs(dx) : Math.abs(dy);
            let secondary = vector.x != 0 ? Math.abs(dy) : Math.abs(dx);
            let score = primary + secondary * 2;
            if (score < bestScore) {
                bestScore = score;
                best = item;
            }
        }

        if (best) {
            this.setFocusById(best.focusId);
            return true;
        }
        return this.moveByOrder(direction == "left" || direction == "down" ? -1 : 1);
    }

    public static confirm(): boolean {
        this.ensureFocus();
        let item = this.getCurrentFocusItem();
        if (!item) return false;
        if (item.onClick) {
            item.onClick();
            return true;
        }
        if (item.component && item.component.onConfirm) {
            item.component.onConfirm();
            return true;
        }
        this.invokeButton(item.node.getComponent(cc.Button));
        return true;
    }

    public static back(): boolean {
        return false;
    }

    public static handleKey(keyCode: number): boolean {
        let key = KeyCodeAdapter.toRemoteKey(keyCode);
        if (key == TvRemoteKey.Ok) return this.confirm();
        if (key == TvRemoteKey.Left) return this.move("left");
        if (key == TvRemoteKey.Right) return this.move("right");
        if (key == TvRemoteKey.Up) return this.move("up");
        if (key == TvRemoteKey.Down) return this.move("down");
        if (key == TvRemoteKey.Back) return this.back();
        return false;
    }

    public static clickCurrent(): boolean {
        return this.confirm();
    }

    public static getCurrentFocusItem(): FocusRuntimeItem | null {
        let item = this.itemMap[this.currentFocusId];
        return this.isItemActive(item) ? item : null;
    }

    public static getActiveScopeId(): string {
        return this.activeScopeId;
    }

    public static onFocusChanged(listener: FocusListener) {
        if (!listener) return;
        if (this.listeners.indexOf(listener) < 0) this.listeners.push(listener);
    }

    public static offFocusChanged(listener: FocusListener) {
        let index = this.listeners.indexOf(listener);
        if (index >= 0) this.listeners.splice(index, 1);
    }

    private static setFocusById(focusId: string, silent: boolean = false) {
        if (focusId == this.currentFocusId && focusId) {
            let current = this.getCurrentFocusItem();
            if (current && !silent) {
                this.setFocusVisual(current, true);
                this.emitFocusChanged(current, current);
            }
            return;
        }
        let previous: FocusRuntimeItem | null = this.getCurrentFocusItem();
        if (previous) this.setFocusVisual(previous, false);
        this.currentFocusId = focusId || "";
        let current: FocusRuntimeItem | null = this.getCurrentFocusItem();
        if (current) {
            let scope = this.getActiveScope();
            if (scope) scope.lastFocusId = current.focusId;
            this.setFocusVisual(current, true);
        }
        if (!silent) this.emitFocusChanged(current, previous);
        if (silent && previous) this.emitFocusChanged(null, previous);
    }

    private static setFocusVisual(item: FocusRuntimeItem, focused: boolean) {
        if (!item || !item.node || !item.node.isValid) return;
        this.setButtonSpriteVisual(item, focused);
        item.node.stopActionByTag(9911);
        let action = cc.scaleTo(
            0.08,
            focused ? item.baseScaleX * item.focusScale : item.baseScaleX,
            focused ? item.baseScaleY * item.focusScale : item.baseScaleY
        );
        action.setTag(9911);
        item.node.runAction(action);
        if (focused && item.onFocus) item.onFocus.call(item.component || item.node);
        if (!focused && item.onBlur) item.onBlur.call(item.component || item.node);
    }

    private static setButtonSpriteVisual(item: FocusRuntimeItem, focused: boolean) {
        let button = item.node.getComponent(cc.Button);
        if (!button || button.transition != cc.Button.Transition.SPRITE) return;
        let target = button.target || button.node;
        if (!target || !target.isValid) return;
        let sprite = target.getComponent(cc.Sprite);
        if (!sprite) return;
        let spriteFrame = focused ? (button.hoverSprite || button.pressedSprite) : button.normalSprite;
        if (spriteFrame) sprite.spriteFrame = spriteFrame;
    }

    private static ensureFocus() {
        this.cleanup();
        if (this.getCurrentFocusItem()) return;
        let activeScope = this.getActiveScope();
        if (activeScope && activeScope.lastFocusId && this.focus(activeScope.lastFocusId)) return;
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i];
            if (this.isItemActive(item) && this.isInActiveScope(item)) {
                this.setFocusById(item.focusId);
                return;
            }
        }
    }

    private static moveByOrder(step: number): boolean {
        let activeItems = [];
        for (let i = 0; i < this.items.length; i++) {
            if (this.isItemActive(this.items[i]) && this.isInActiveScope(this.items[i])) activeItems.push(this.items[i]);
        }
        if (activeItems.length <= 0) return false;
        let index = 0;
        for (let i = 0; i < activeItems.length; i++) {
            if (activeItems[i].focusId == this.currentFocusId) {
                index = i;
                break;
            }
        }
        let next = (index + step + activeItems.length) % activeItems.length;
        this.setFocusById(activeItems[next].focusId);
        return true;
    }

    private static removeItemAt(index: number) {
        let item = this.items[index];
        if (!item) return;
        this.setFocusVisual(item, false);
        delete this.itemMap[item.focusId];
        this.items.splice(index, 1);
        if (this.currentFocusId == item.focusId) {
            this.currentFocusId = "";
            this.emitFocusChanged(null, item);
        }
    }

    private static cleanup() {
        for (let i = this.items.length - 1; i >= 0; i--) {
            let item = this.items[i];
            if (!item.node || !item.node.isValid) this.removeItemAt(i);
        }
    }

    private static isItemActive(item?: FocusRuntimeItem | null): boolean {
        if (!item || !item.node || !item.node.isValid || !item.node.activeInHierarchy) return false;
        let button = item.node.getComponent(cc.Button);
        return !button || button.interactable;
    }

    private static isInActiveScope(item?: FocusRuntimeItem | null): boolean {
        return !!item && item.scopeId == this.activeScopeId;
    }

    private static getActiveScope(): FocusScope | null {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].scopeId == this.activeScopeId) return this.scopes[i];
        }
        return null;
    }

    private static getWorldCenter(node: cc.Node): cc.Vec2 {
        let box = node.getBoundingBoxToWorld();
        return cc.v2(box.x + box.width / 2, box.y + box.height / 2);
    }

    private static getDirectionVector(direction: TvUiDirection): cc.Vec2 {
        if (direction == "left") return cc.v2(-1, 0);
        if (direction == "right") return cc.v2(1, 0);
        if (direction == "up") return cc.v2(0, 1);
        return cc.v2(0, -1);
    }

    private static invokeButton(button: cc.Button) {
        if (!button || !button.node || !button.node.activeInHierarchy || !button.interactable) return;
        if (button.clickEvents && button.clickEvents.length > 0) {
            cc.Component.EventHandler.emitEvents(button.clickEvents, null);
        } else {
            button.node.emit(cc.Node.EventType.TOUCH_END);
        }
    }

    private static emitFocusChanged(item: FocusRuntimeItem | null, previous?: FocusRuntimeItem | null) {
        for (let i = 0; i < this.listeners.length; i++) {
            this.listeners[i](item, previous);
        }
    }

    private static resolveNode(target: any): cc.Node | null {
        if (!target) return null;
        if (target instanceof cc.Node) return target;
        return target.node || null;
    }

    private static resolveComponent(target: any, node: cc.Node): any {
        if (!target || target instanceof cc.Node) return node.getComponent("FocusItem");
        return target;
    }

    private static createFocusId(node: cc.Node): string {
        return "focus_" + (node.name || "node") + "_" + this.items.length;
    }

    private static walk(node: cc.Node, visitor: (node: cc.Node) => void) {
        visitor(node);
        for (let i = 0; i < node.childrenCount; i++) {
            this.walk(node.children[i], visitor);
        }
    }

    private static isChildOf(node: cc.Node, root: cc.Node): boolean {
        let cur = node;
        while (cur) {
            if (cur == root) return true;
            cur = cur.parent;
        }
        return false;
    }
}
