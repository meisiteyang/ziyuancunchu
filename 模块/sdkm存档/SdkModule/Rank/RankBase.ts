// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import { Leaderboard } from "../../tvui/vendor/ad-sdk/ad-sdk";
import DataBase from "../Data/DataBase";

const { ccclass, property } = cc._decorator;

@ccclass
export default class RankBase {


    private static _instance: RankBase = null;
    public static getInstance(): RankBase {
        if (this._instance == null) {
            this._instance = new RankBase();
        }
        return this._instance;
    }
    init() {

    }
    /*
     * 初始化排行榜
     */
    InitRank(project: string) {
        console.log("初始化排行榜")
        Leaderboard.init({
            project: project,                    // 项目编码（必填）
            // rank_url: 'https://hyp.huyingpai.com/API_ACHIEVEMENT/api/user/point/rank',    // 排行榜接口（不传用默认）
            // add_url: 'https://hyp.huyingpai.com/API_ACHIEVEMENT/api/user/point/add',      // 添加积分接口（不传用默认）
        });
    }
    /**
     * 获取排行榜数据
     */
    async GetRankData() {
        try {
            console.log("获取排行榜数据")
            var result = await Leaderboard.getRank();
            // console.log(result, result.data);
            if (result.code === 200) {
                console.log('获取排行榜:', result.message);
                var list = result.data;
                // 排行榜列表
                // cc.loader.load({ url: account.avatar, type: 'png' }, (err, texture) => {
                //                     if (err) {
                //                         cc.error('加载图片失败:', err);
                //                         return;
                //                     }
                //                     // 创建 SpriteFrame
                //                     const spriteFrame = new cc.SpriteFrame(texture);
                //                     // 赋值给 Sprite 组件
                //                     const sprite = cc.find("Canvas/icon").getComponent(cc.Sprite);
                //                     sprite.spriteFrame = spriteFrame;
                //                 });
                return list;
            } else {
                return null;
            }


        } catch (error) {

            console.error('获取排行榜失败:', error);
            return null;
        }
    }
    /**
   * 添加积分
   */
    async AddPoint(point: number) {
        try {
            await Leaderboard.addPoint({
                user_id: DataBase.getInstance().uid,                  // 用户ID（不传用 init 时设置的）
                point: point,                            // 积分值
                jsonData: JSON.stringify({           // 扩展数据（可选）
                    url: 'xxx.png',
                    nickname: DataBase.getInstance().nickName,
                }),
            });


        } catch (error) {

            console.error('添加积分失败:', error);
            return false;
        }
    }
}
