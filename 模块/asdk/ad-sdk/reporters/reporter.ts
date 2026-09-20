/**
 * 数据上报模块 - 统一封装层
 *
 * 内部使用 supersetLewo 上报脚本，对外提供简洁的调用接口：
 *   Reporter.init(config)       — 初始化（设置项目编码、游戏ID等公共字段）
 *   Reporter.report(data)       — 单次上报
 *   Reporter.reportBatch(list)  — 批量上报
 *   Reporter.createDeviceId()   — 获取/生成设备ID
 *   Reporter.resetDeviceId()    — 重置设备ID
 */

import supersetLewo from './superset-lewo';
import { IReporterConfig, IReportItem } from '../types/interfaces';

// ────────────────────────────────────────
// 上报动作类型
// ────────────────────────────────────────

export const ActionType = {
  /** 曝光 */
  Exposure: '曝光' as const,
  /** 点击 */
  Click: '点击' as const,
};

interface ReporterInstance {
  _initialized: boolean;
  _commonInfo: Partial<IReportItem>;
  init(config: IReporterConfig): void;
  report(data: IReportItem): void;
  reportBatch(dataList: IReportItem[], commonInfo?: IReportItem): void;
  createDeviceId(): string;
  resetDeviceId(): void;
  setCommonInfo(info: Partial<IReportItem>): void;
  getCommonInfo(): Partial<IReportItem>;
  readonly instance: typeof supersetLewo;
}

// ────────────────────────────────────────
// Reporter 实现
// ────────────────────────────────────────

export const Reporter: ReporterInstance = {
  /** 是否已初始化 */
  _initialized: false,

  /** 公共字段缓存（初始化时设置，每次上报自动合并） */
  _commonInfo: {},

  /**
   * 初始化上报模块
   * @param config
   */
  init(config: IReporterConfig): void {
    config = config || {};

    if (config.reportUrl) {
      supersetLewo.config.reportUrl = config.reportUrl;
    }

    if (config.headers && config.headers.length > 0) {
      supersetLewo.config.defaultHeaders = config.headers;
    }

    if (config.defaultActionType) {
      supersetLewo.config.defaultActionType = config.defaultActionType;
    }

    this._commonInfo = {
      appItem: config.appItem || '',
      contentType: config.contentType || '游戏',
      contentId: config.contentId || '',
      contentTitle: config.contentTitle || '',
    };

    if (!this._commonInfo.deviceId) {
      this._commonInfo.deviceId = supersetLewo.createDeviceId();
    }

    this._initialized = true;
    console.log('[Reporter] Initialized, reportUrl:', supersetLewo.config.reportUrl);
  },

  /**
   * 单次上报
   * @param data - 上报数据
   */
  report(data: IReportItem): void {
    if (!this._initialized) {
      console.warn('[Reporter] Not initialized. Call Reporter.init() first.');
      return;
    }

    const merged: any = {};
    for (const key in this._commonInfo) {
      if (this._commonInfo.hasOwnProperty(key)) {
        merged[key] = (this._commonInfo as any)[key];
      }
    }
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        merged[key] = (data as any)[key];
      }
    }

    if (!merged.deviceId) {
      merged.deviceId = supersetLewo.createDeviceId();
    }

    supersetLewo.superBatchReport(merged);
  },

  /**
   * 批量上报
   * @param dataList - 上报数据列表
   * @param commonInfo - 可选公共字段（覆盖初始化的公共字段）
   */
  reportBatch(dataList: IReportItem[], commonInfo?: IReportItem): void {
    if (!this._initialized) {
      console.warn('[Reporter] Not initialized. Call Reporter.init() first.');
      return;
    }

    const mergedCommon: any = {};

    for (const key in this._commonInfo) {
      if (this._commonInfo.hasOwnProperty(key)) {
        mergedCommon[key] = (this._commonInfo as any)[key];
      }
    }

    if (commonInfo) {
      for (const key in commonInfo) {
        if (commonInfo.hasOwnProperty(key)) {
          mergedCommon[key] = (commonInfo as any)[key];
        }
      }
    }

    if (!mergedCommon.deviceId) {
      mergedCommon.deviceId = supersetLewo.createDeviceId();
    }

    supersetLewo.batchReporting(dataList, mergedCommon);
  },

  /**
   * 获取或创建设备唯一ID
   * @returns
   */
  createDeviceId(): string {
    return supersetLewo.createDeviceId();
  },

  /**
   * 重置设备ID（清除缓存、localStorage、cookie）
   */
  resetDeviceId(): void {
    supersetLewo.resetDeviceId();
    if (this._commonInfo) {
      this._commonInfo.deviceId = supersetLewo.createDeviceId();
    }
  },

  /**
   * 更新公共字段（如用户登录后更新 userId）
   * @param info - 要更新的字段
   */
  setCommonInfo(info: Partial<IReportItem>): void {
    for (const key in info) {
      if (info.hasOwnProperty(key)) {
        (this._commonInfo as any)[key] = (info as any)[key];
      }
    }
  },

  /**
   * 获取当前公共字段
   * @returns
   */
  getCommonInfo(): Partial<IReportItem> {
    const copy: any = {};
    for (const key in this._commonInfo) {
      if (this._commonInfo.hasOwnProperty(key)) {
        copy[key] = (this._commonInfo as any)[key];
      }
    }
    return copy;
  },

  /** 获取底层 supersetLewo 实例（高级用法） */
  get instance(): typeof supersetLewo {
    return supersetLewo;
  },
};
