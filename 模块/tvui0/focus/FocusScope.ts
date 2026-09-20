export default class FocusScope {
    public scopeId: string;
    public root: cc.Node | null;
    public lastFocusId: string = "";

    constructor(scopeId: string, root?: cc.Node) {
        this.scopeId = scopeId || "page";
        this.root = root || null;
    }
}
