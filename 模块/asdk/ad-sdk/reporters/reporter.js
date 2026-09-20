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

var supersetLewo = require('./superset-lewo');

// ────────────────────────────────────────
// 上报动作类型
// ────────────────────────────────────────

var ActionType = {
  /** 曝光 */
  Exposure: '曝光',
  /** 点击 */
  Click: '点击',
};

// ────────────────────────────────────────
// Reporter 实现
// ────────────────────────────────────────

var Reporter = {
  /** 是否已初始化 */
  _initialized: false,

  /** 公共字段缓存（初始化时设置，每次上报自动合并） */
  _commonInfo: {},

  /**
   * 初始化上报模块
   * @param {import('../types/interfaces').IReporterConfig} config
   */
  init: function (config) {
    config = config || {};

    // 设置上报地址（未传则使用 supersetLewo 默认值）
    if (config.reportUrl) {
      supersetLewo.config.reportUrl = config.reportUrl;
    }

    // 设置请求头
    if (config.headers && config.headers.length > 0) {
      supersetLewo.config.defaultHeaders = config.headers;
    }

    // 设置默认行为类型
    if (config.defaultActionType) {
      supersetLewo.config.defaultActionType = config.defaultActionType;
    }

    // 缓存公共字段
    this._commonInfo = {
      appItem: config.appItem || '',
      contentType: config.contentType || '游戏',
      contentId: config.contentId || '',
      contentTitle: config.contentTitle || '',
    };

    // 自动填充 deviceId
    if (!this._commonInfo.deviceId) {
      this._commonInfo.deviceId = supersetLewo.createDeviceId();
    }

    this._initialized = true;
    console.log('[Reporter] Initialized, reportUrl:', supersetLewo.config.reportUrl);
  },

  /**
   * 单次上报
   * @param {import('../types/interfaces').IReportItem} data - 上报数据
   */
  report: function (data) {
    if (!this._initialized) {
      console.warn('[Reporter] Not initialized. Call Reporter.init() first.');
      return;
    }

    // 合并公共字段 + 传入数据
    var merged = {};
    var key;
    for (key in this._commonInfo) {
      if (this._commonInfo.hasOwnProperty(key)) {
        merged[key] = this._commonInfo[key];
      }
    }
    for (key in data) {
      if (data.hasOwnProperty(key)) {
        merged[key] = data[key];
      }
    }

    // 自动填充 deviceId
    if (!merged.deviceId) {
      merged.deviceId = supersetLewo.createDeviceId();
    }

    supersetLewo.superBatchReport(merged);
  },

  /**
   * 批量上报
   * @param {Array<import('../types/interfaces').IReportItem>} dataList - 上报数据列表
   * @param {import('../types/interfaces').IReportItem} [commonInfo] - 可选公共字段（覆盖初始化的公共字段）
   */
  reportBatch: function (dataList, commonInfo) {
    if (!this._initialized) {
      console.warn('[Reporter] Not initialized. Call Reporter.init() first.');
      return;
    }

    var mergedCommon = {};
    var key;

    // 合并初始化时的公共字段
    for (key in this._commonInfo) {
      if (this._commonInfo.hasOwnProperty(key)) {
        mergedCommon[key] = this._commonInfo[key];
      }
    }

    // 合并传入的公共字段（优先级更高）
    if (commonInfo) {
      for (key in commonInfo) {
        if (commonInfo.hasOwnProperty(key)) {
          mergedCommon[key] = commonInfo[key];
        }
      }
    }

    // 自动填充 deviceId
    if (!mergedCommon.deviceId) {
      mergedCommon.deviceId = supersetLewo.createDeviceId();
    }

    supersetLewo.batchReporting(dataList, mergedCommon);
  },

  /**
   * 获取或创建设备唯一ID
   * @returns {string}
   */
  createDeviceId: function () {
    return supersetLewo.createDeviceId();
  },

  /**
   * 重置设备ID（清除缓存、localStorage、cookie）
   */
  resetDeviceId: function () {
    supersetLewo.resetDeviceId();
    if (this._commonInfo) {
      this._commonInfo.deviceId = supersetLewo.createDeviceId();
    }
  },

  /**
   * 更新公共字段（如用户登录后更新 userId）
   * @param {Object} info - 要更新的字段
   */
  setCommonInfo: function (info) {
    for (var key in info) {
      if (info.hasOwnProperty(key)) {
        this._commonInfo[key] = info[key];
      }
    }
  },

  /**
   * 获取当前公共字段
   * @returns {Object}
   */
  getCommonInfo: function () {
    var copy = {};
    for (var key in this._commonInfo) {
      if (this._commonInfo.hasOwnProperty(key)) {
        copy[key] = this._commonInfo[key];
      }
    }
    return copy;
  },

  /** 获取底层 supersetLewo 实例（高级用法） */
  get instance() {
    return supersetLewo;
  },
};

module.exports = {
  Reporter: Reporter,
  ActionType: ActionType,
};
