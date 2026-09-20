export enum TvRemoteKey {
    Back = "back",
    Ok = "ok",
    Left = "left",
    Right = "right",
    Up = "up",
    Down = "down",
    Pause = "pause",
    Unknown = "unknown"
}

export default class KeyCodeAdapter {
    public static toRemoteKey(keyCode: number): TvRemoteKey {
        if ([0, 4, 8, 27, 10009].indexOf(keyCode) >= 0) return TvRemoteKey.Back;
        if ([13, 23, 66].indexOf(keyCode) >= 0) return TvRemoteKey.Ok;
        if ([80].indexOf(keyCode) >= 0) return TvRemoteKey.Pause;
        if ([21, 37].indexOf(keyCode) >= 0) return TvRemoteKey.Left;
        if ([19, 38].indexOf(keyCode) >= 0) return TvRemoteKey.Up;
        if ([22, 39].indexOf(keyCode) >= 0) return TvRemoteKey.Right;
        if ([20, 40].indexOf(keyCode) >= 0) return TvRemoteKey.Down;
        return TvRemoteKey.Unknown;
    }
}
