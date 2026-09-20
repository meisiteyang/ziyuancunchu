/**
 * 排行榜模块 - 类型声明
 */

import { ILeaderboardConfig, IAddPointParams, IRankResult } from '../types/interfaces';

/** 排行榜模块（单例） */
export declare const Leaderboard: {
  /** 初始化排行榜模块 */
  init(config: ILeaderboardConfig): void;

  /** 获取积分排行榜 */
  getRank(): Promise<IRankResult>;

  /** 添加积分 */
  addPoint(params: IAddPointParams): Promise<any>;

  /** 更新用户ID（登录后调用） */
  setUserId(user_id: string): void;

  /** 获取当前项目编码 */
  getProject(): string;
};
