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
    if (config.report_url) {
      supersetLewo.config.reportUrl = config.report_url;
    }

    // 设置请求头
    if (config.headers && config.headers.length > 0) {
      supersetLewo.config.defaultHeaders = config.headers;
    }

    // 设置默认行为类型
    if (config.default_action_type) {
      supersetLewo.config.defaultActionType = config.default_action_type;
    }

    // 缓存公共字段
    this._commonInfo = {
      app_item: config.app_item || '',
      content_type: config.content_type || '游戏',
      content_id: config.content_id || '',
      content_title: config.content_title || '',
    };

    // 自动填充 device_id
    if (!this._commonInfo.device_id) {
      this._commonInfo.device_id = supersetLewo.createDeviceId();
    }

    this._initialized = true;
    console.log('[Reporter] Initialized, reportUrl:', supersetLewo.config.reportUrl);
  },

  /**
   * 单次上报
   * @param {import('../types/interfaces').IReportItem} data - 上报数据（下划线格式）
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

    // 自动填充 device_id
    if (!merged.device_id) {
      merged.device_id = supersetLewo.createDeviceId();
    }

    supersetLewo.superBatchReport(merged);
  },

  /**
   * 批量上报
   * @param {Array<import('../types/interfaces').IReportItem>} dataList - 上报数据列表（下划线格式）
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

    // 自动填充 device_id
    if (!mergedCommon.device_id) {
      mergedCommon.device_id = supersetLewo.createDeviceId();
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
      this._commonInfo.device_id = supersetLewo.createDeviceId();
    }
  },

  /**
   * 更新公共字段（如用户登录后更新 user_id）
   * @param {Object} info - 要更新的字段（下划线格式）
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
