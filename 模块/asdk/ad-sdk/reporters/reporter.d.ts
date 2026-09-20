/**
 * 数据上报模块 - 类型声明
 */

import { IReporterConfig, IReportItem } from '../types/interfaces';

/** 上报动作类型 */
export declare const ActionType: {
  /** 曝光 */
  Exposure: '曝光';
  /** 点击 */
  Click: '点击';
};

/** 数据上报模块（单例） */
export declare const Reporter: {
  /** 初始化上报模块 */
  init(config: IReporterConfig): void;

  /** 单次上报 */
  report(data: IReportItem): void;

  /** 批量上报 */
  reportBatch(dataList: IReportItem[], commonInfo?: IReportItem): void;

  /** 获取或创建设备唯一ID */
  createDeviceId(): string;

  /** 重置设备ID */
  resetDeviceId(): void;

  /** 更新公共字段 */
  setCommonInfo(info: Partial<IReportItem>): void;

  /** 获取当前公共字段 */
  getCommonInfo(): Partial<IReportItem>;

  /** 获取底层上报实例（高级用法） */
  readonly instance: any;
};
