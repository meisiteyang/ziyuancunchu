export type BackHandler = () => boolean | void;

export default class BackManager {
    private static handlers: BackHandler[] = [];
    private static fallback: BackHandler | null = null;

    public static reset() {
        this.handlers = [];
        this.fallback = null;
    }

    public static setFallback(handler: BackHandler | null) {
        this.fallback = handler;
    }

    public static push(handler: BackHandler) {
        if (!handler) return;
        this.remove(handler);
        this.handlers.push(handler);
    }

    public static remove(handler: BackHandler) {
        for (let i = this.handlers.length - 1; i >= 0; i--) {
            if (this.handlers[i] == handler) this.handlers.splice(i, 1);
        }
    }

    public static handle(): boolean {
        for (let i = this.handlers.length - 1; i >= 0; i--) {
            let handler = this.handlers[i];
            if (!handler) continue;
            let result = handler();
            if (result !== false) return true;
        }
        if (this.fallback) return this.fallback() !== false;
        return false;
    }
}
