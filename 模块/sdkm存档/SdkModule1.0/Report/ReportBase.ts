// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html
enum element_positionbase {
    /**
     * 游戏加载
     */
    game_loading = 'game_loading', // 游戏加载
    /**
     * 开始游戏按钮
     */
    start_game_button = 'start_game_button', // 开始游戏按钮
    /**
     * 视频继续按钮
     */
    watch_video_continue_button = 'watch_video_continue_button', // 视频继续按钮
    /**
     * 重新开始按钮
     */
    replay_button = 'replay_button', // 重新开始按钮
    /**
     * 奖励视频广告
     */
    reward_video_ad = 'reward_video_ad', // 奖励视频广告
}

enum action_typebase {
    /**
     * 游戏加载曝光
     */
    game_loading_expose = 'game_loading_expose', // 游戏加载曝光
    /**
     * 开始游戏曝光
     */
    start_game_expose = 'start_game_expose', // 开始游戏曝光
    /**
     * 开始游戏点击
     */
    start_game_click = 'start_game_click', // 开始游戏点击
    /**
     * 视频继续曝光
     */
    watch_video_continue_expose = 'watch_video_continue_expose', // 视频继续曝光
    /**
     * 视频继续点击
     */
    watch_video_continue_click = 'watch_video_continue_click', // 视频继续点击
    /**
     * 重新开始曝光
     */
    replay_expose = 'replay_expose', // 重新开始曝光
    /**
     * 重新开始点击
     */
    replay_click = 'replay_click', // 重新开始点击
    /**
     * 广告曝光
     */
    ad_expose = 'ad_expose', // 广告曝光
}

enum event_namebase {
    /**
     * 游戏加载曝光
     */
    game_expose = '曝光', // 游戏加载曝光
    /**
     * 游戏加载点击
     */
    game_click = '点击', // 游戏加载点击

}

enum app_itembase {
    /**
     * 小米TV25
     */
    itmeTV = "25", //小米TV25
    /**
     * 道然 29，小米TV25
     */
    daoran = "29", // 道然 29，小米TV25

}
export { app_itembase, element_positionbase, action_typebase, event_namebase };
import { Reporter } from "../../tvui/vendor/ad-sdk/ad-sdk";
import DataBase from "../Data/DataBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ReportBase {
    private static _instance: ReportBase = null;
    public static getInstance(): ReportBase {
        if (this._instance == null) {
            this._instance = new ReportBase();
        }
        return this._instance;
    }


    report(element_position: element_positionbase,appItem: app_itembase, content_id: string,content_title: string, action: action_typebase, eventName: event_namebase, adRequestIdId?: string, eventTime?: string) {
        Reporter.report({
            user_id: DataBase.getInstance().uid,          // 用户唯一标识（需要用户登录，产生UID）
            device_id: DataBase.getInstance().reportInfo.createDeviceId(),       // 设备唯一标识（设备号，如果无，则需要生成）
            content_type: '游戏',
              element_position: element_position, // 元素位置（埋点范围表对应的 元素位置列）
            app_item: appItem, // 应用唯一标识（需要应用登录，产生应用ID）
            content_id: content_id,       // 游戏ID（具体乐窝的游戏ID）
            content_title: content_title,    // 游戏名（具体的乐窝游戏名）
            action_type: action,      // 曝光/点击
            event_name: eventName,       // 具体事件名（新增，友盟需要按照上面表格传值，通过元素位置和行为生成事件名字）
            ad_request_id: adRequestIdId || '',   // 广告请求ID，仅广告相关事件需要
            event_time: eventTime || '',       // 客户端事件时间（格式建议：yyyy-MM-dd HH:mm:ss）


        });
    }

    // update (dt) {}
}
