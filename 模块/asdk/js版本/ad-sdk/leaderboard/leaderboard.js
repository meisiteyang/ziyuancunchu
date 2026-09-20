/**
 * 排行榜模块 - 积分排行与添加积分
 *
 * 使用方式：
 *   Leaderboard.init(config)           — 初始化（设置项目编码、服务地址）
 *   Leaderboard.getRank()              — 获取积分排行榜
 *   Leaderboard.addPoint(params)       — 添加积分
 */

// ────────────────────────────────────────
// 排行榜实现
// ────────────────────────────────────────

var Leaderboard = {
  /** 是否已初始化 */
  _initialized: false,

  /** 配置 */
  _config: {
    /** 排行榜服务地址 */
    rank_url: 'https://hyp-test.huyingpai.com/API_ACHIEVEMENT/api/user/point/rank',
    /** 添加积分服务地址 */
    add_url: 'https://hyp-test.huyingpai.com/API_ACHIEVEMENT/api/user/point/add',
    /** 项目编码 */
    project: '',
    /** 用户ID */
    user_id: '',
  },

  /**
   * 初始化排行榜模块
   * @param {import('../types/interfaces').ILeaderboardConfig} config
   */
  init: function (config) {
    config = config || {};

    if (config.rank_url) {
      this._config.rank_url = config.rank_url;
    }
    if (config.add_url) {
      this._config.add_url = config.add_url;
    }
    this._config.project = config.project || '';
    this._config.user_id = config.user_id || '';

    this._initialized = true;
    console.log('[Leaderboard] Initialized, project:', this._config.project);
  },

  /**
   * 获取积分排行榜
   * @returns {Promise<import('../types/interfaces').IRankResult>}
   */
  getRank: function () {
    if (!this._initialized) {
      console.warn('[Leaderboard] Not initialized. Call Leaderboard.init() first.');
      return Promise.reject({ code: -1, message: 'Leaderboard not initialized' });
    }

    var self = this;
    var data = {
      project: self._config.project,
      timestamp: Date.now(),
      time: self._formatTime(new Date()),
    };

    return self._post(self._config.rank_url, data);
  },

  /**
   * 添加积分
   * @param {import('../types/interfaces').IAddPointParams} params
   * @returns {Promise<any>}
   */
  addPoint: function (params) {
    if (!this._initialized) {
      console.warn('[Leaderboard] Not initialized. Call Leaderboard.init() first.');
      return Promise.reject({ code: -1, message: 'Leaderboard not initialized' });
    }

    var self = this;
    var data = {
      project: self._config.project,
      userId: params.user_id || self._config.user_id,
      point: params.point || 0,
    };

    // jsonData 为可选扩展数据
    if (params.jsonData) {
      data.jsonData = params.jsonData;
    }

    data.timestamp = Date.now();
    data.time = self._formatTime(new Date());

    return self._post(self._config.add_url, data);
  },

  /**
   * 更新用户ID（登录后调用）
   * @param {string} user_id
   */
  setUserId: function (user_id) {
    this._config.user_id = user_id;
  },

  /**
   * 获取当前项目编码
   * @returns {string}
   */
  getProject: function () {
    return this._config.project;
  },

  // ────────────────────────────────────────
  // 内部方法
  // ────────────────────────────────────────

  /**
   * 发送 POST 请求（Promise 封装）
   * @param {string} url
   * @param {Object} data
   * @returns {Promise<any>}
   */
  _post: function (url, data) {
    return new Promise(function (resolve, reject) {
      var dataStr = JSON.stringify(data);
      console.log('[Leaderboard] POST:', url, dataStr);

      var xmlhttp;
      if (typeof XMLHttpRequest !== 'undefined') {
        xmlhttp = new XMLHttpRequest();
      } else if (typeof ActiveXObject !== 'undefined') {
        xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
      } else {
        reject({ code: -1, message: 'No HTTP client available' });
        return;
      }

      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState !== 4) return;

        var rsp = xmlhttp.responseText || xmlhttp.responseXML;
        var parseError = false;

        if (typeof rsp === 'string') {
          try {
            rsp = JSON.parse(rsp);
          } catch (e) {
            parseError = true;
          }
        }

        if (parseError || xmlhttp.status !== 200) {
          var errMsg = parseError ? 'JSON parse error' : ('HTTP ' + xmlhttp.status);
          console.error('[Leaderboard] Request failed:', errMsg);
          reject({ code: xmlhttp.status || -1, message: errMsg });
        } else {
          console.log('[Leaderboard] Response:', rsp);
          resolve(rsp);
        }
      };

      xmlhttp.open('POST', url, true);
      xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      xmlhttp.send(dataStr);
    });
  },

  /**
   * 时间格式化：yyyy-MM-dd HH:mm:ss
   * @param {Date} date
   * @returns {string}
   */
  _formatTime: function (date) {
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? '0' + m : m;
    var d = date.getDate();
    d = d < 10 ? '0' + d : d;
    var h = date.getHours();
    h = h < 10 ? '0' + h : h;
    var min = date.getMinutes();
    min = min < 10 ? '0' + min : min;
    var sec = date.getSeconds();
    sec = sec < 10 ? '0' + sec : sec;
    return y + '-' + m + '-' + d + ' ' + h + ':' + min + ':' + sec;
  },
};

module.exports = {
  Leaderboard: Leaderboard,
};
