var supersetLewo = (function () {
  // ========== 私有常量与缓存（闭包内部，外部无法访问） ==========
  var STORAGE_KEY = 'analytics.device_id.uuid_v4';
  var memoryCache = null;

  /**
   * 生成标准 UUID v4
   * 优先使用原生 crypto API，逐级降级
   */
  function createUuidV4() {
    if (globalThis.crypto['randomUUID']) {
      return globalThis.crypto.randomUUID().toLowerCase();
    }

    if (globalThis.crypto['getRandomValues']) {
      var bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      // UUID v4 版本与变种位
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;

      var hex = Array.from(bytes, function (val) {
        return val.toString(16).padStart(2, '0');
      }).join('');
      return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' +
        hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
    }

    // 最低降级：Math.random 伪随机（熵低，仅统计场景兜底）
    return generatePseudoUuid();
  }

  function generatePseudoUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * 安全获取 Cookie（自动转义key，避免正则特殊字符 . + * 等失效）
   */
  function getCookie(name) {
    try {
      var escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var reg = new RegExp('(^| )' + escapedName + '=([^;]+)');
      var match = document.cookie.match(reg);
      return match ? match[2] : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 设置 Cookie：自动适配 HTTPS/HTTP，动态控制 Secure
   */
  function setCookie(name, value) {
    try {
      var isHttps = window.location.protocol === 'https:';
      var parts = [
        name + '=' + value,
        'max-age=31536000',
        'path=/',
        'SameSite=Lax'
      ];
      if (isHttps) {
        parts.push('Secure');
      }
      document.cookie = parts.join(';');
    } catch (e) {
    }
  }

  // ========== 对外暴露对象 ==========
  return {
    // ===================== 公共配置 =====================
    config: {
      // 上报接口地址
      reportUrl: 'http://sup.daoran.tv/bi-api/api/game/lewo/batch',
      // reportUrl: '/bi-api/api/game/lewo/batch',
      // 默认请求头
      defaultHeaders: [
        // { name: 'md5', value: "GYWmhK2MfuQtDc9Cj8Fbw9hGoJwQ+f3WTgHRahD1TRiA6TpexZSORQ==" }
      ],
      defaultContentType: 'application/json;charset=UTF-8',
      // 默认行为类型
      defaultActionType: '曝光'
    },

    // ===================== 公共上报字段模板（驼峰入参，自动转下划线请求后端） =====================
    defaultReportItem: {
      userId: '',          // 用户唯一标识（需要用户登录，产生UID
      deviceId: '',        // 设备唯一标识（设备号，如果无，则需要生成）
      appItem: '',         // 项目编码
      contentType: '独立游戏',  // 游戏（乐窝的游戏，这个字段都固定上报游戏）
      contentId: '',       // 游戏ID（具体乐窝的游戏ID）
      contentTitle: '',    // 游戏名（具体的乐窝游戏名）
      elementPosition: '', // 元素位置
      actionType: '',      // 行为类型-曝光、点击
      eventName: '',       // 具体事件名（新增，需要按照上面表格传值）
      adRequestId: '',   // 广告请求ID，仅广告相关事件需要
      eventTime: '',       // 事件发生时间（格式建议：yyyy-MM-dd HH:mm:ss）
    },

    // ===================== 工具方法 =====================
    /**
     * 驼峰命名转下划线命名（保证后端接收字段与原格式完全一致）
     * @param {Object} obj 驼峰格式对象
     * @returns {Object} 下划线格式对象
     */
    camelToSnake: function (obj) {
      var result = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          var snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
          result[snakeKey] = obj[key];
        }
      }
      return result;
    },

    /**
     * 合并默认上报字段，补全默认值
     * @param {Object} item 传入的上报数据
     * @returns {Object} 合并后的完整上报项
     */
    mergeReportItem: function (item) {
      var merged = {};
      var defaultItem = this.defaultReportItem;
      // 拷贝默认值，传入值优先
      for (var key in defaultItem) {
        if (defaultItem.hasOwnProperty(key)) {
          merged[key] = item[key] !== undefined ? item[key] : defaultItem[key];
        }
      }
      // 自动生成事件时间（未传时）
      if (!merged.eventTime) {
        merged.eventTime = this.handleTime();
      }
      // 填充默认行为类型
      if (!merged.actionType) {
        merged.actionType = this.config.defaultActionType;
      }
      console.log('mergeReportItem-result', merged);
      return merged;
    },

    /**
     * 时间格式化：yyyy-MM-dd HH:mm:ss
     */
    handleTime: function () {
      var date_t = new Date();
      var y_t = date_t.getFullYear();
      var m_t = date_t.getMonth() + 1;
      m_t = m_t < 10 ? "0" + m_t : m_t;
      var d_t = date_t.getDate();
      d_t = d_t < 10 ? "0" + d_t : d_t;
      var h_t = date_t.getHours();
      h_t = h_t < 10 ? "0" + h_t : h_t;
      var min_t = date_t.getMinutes();
      min_t = min_t < 10 ? "0" + min_t : min_t;
      var sec_t = date_t.getSeconds();
      sec_t = sec_t < 10 ? "0" + sec_t : sec_t;
      return y_t + "-" + m_t + "-" + d_t + " " + h_t + ":" + min_t + ":" + sec_t;
    },

    // ===================== 设备ID相关新增方法 =====================
    /**
     * 获取或创建设备唯一ID（持久化，优先内存缓存 > localStorage > cookie）
     * @returns {string} uuid v4 deviceId
     */
    createDeviceId: function () {
      if (memoryCache) {
        return memoryCache;
      }

      // 1. 尝试从 LocalStorage 读取
      try {
        var existing = localStorage.getItem(STORAGE_KEY);
        if (existing) {
          existing = existing.trim();
          memoryCache = existing.toLowerCase();
          return memoryCache;
        }
      } catch (e) {
      }

      // 2. 尝试从 Cookie 读取
      var existingCookie = getCookie(STORAGE_KEY);
      if (existingCookie) {
        existingCookie = existingCookie.trim();
        memoryCache = existingCookie.toLowerCase();
        // 尝试同步回 LocalStorage
        try {
          localStorage.setItem(STORAGE_KEY, memoryCache);
        } catch (e) {
        }
        return memoryCache;
      }

      // 3. 重新生成并存储
      var newId = createUuidV4();
      memoryCache = newId;

      try {
        localStorage.setItem(STORAGE_KEY, newId);
      } catch (e) {
      }
      setCookie(STORAGE_KEY, newId);

      return newId;
    },

    /**
     * 重置/清除设备ID（清除内存缓存、localStorage、cookie）
     */
    resetDeviceId: function () {
      memoryCache = null;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
      }
      try {
        var isHttps = window.location.protocol === 'https:';
        var cookieParts = [
          STORAGE_KEY + '=',
          'max-age=0',
          'path=/',
          'SameSite=Lax'
        ];
        if (isHttps) {
          cookieParts.push('Secure');
        }
        document.cookie = cookieParts.join(';');
      } catch (e) {
      }
    },

    // ===================== 核心上报方法 =====================
    /**
     * 单次日志上报
     * @param {Object} obj 驼峰格式的上报数据
     */
    superBatchReport: function (obj) {
      var mergedItem = this.mergeReportItem(obj);
      var snakeItem = this.camelToSnake(mergedItem);
      var dataObj = {
        data: [snakeItem]
      };
      this.supersetAjax(dataObj);
    },

    /**
     * 批量曝光上报
     * @param {Array} dataList 上报数据列表（驼峰格式）
     * @param {Object} commonInfo 可选-公共字段（设备信息，统一填充到所有条目）
     */
    batchReporting: function (dataList, commonInfo) {
      console.log('BatchReporting', dataList);
      var exposureFlag = false;
      for (var i = 0; i < dataList.length; i++) {
        var item = dataList[i];
        if (item.exposureFlag) {
          exposureFlag = true;
          break;
        }
      }

      if (!exposureFlag) {
        var dataObj = {
          "data": []
        };
        commonInfo = commonInfo || {};

        for (var i = 0; i < dataList.length; i++) {
          var item = dataList[i];
          dataList[i].exposureFlag = true;

          // 合并公共字段 + 当前条目字段
          var reportItem = {};
          for (var cKey in commonInfo) {
            if (commonInfo.hasOwnProperty(cKey)) {
              reportItem[cKey] = commonInfo[cKey];
            }
          }
          for (var iKey in item) {
            if (item.hasOwnProperty(iKey)) {
              reportItem[iKey] = item[iKey];
            }
          }

          // 合并默认值 + 转下划线格式
          var mergedItem = this.mergeReportItem(reportItem);
          var snakeItem = this.camelToSnake(mergedItem);
          dataObj.data.push(snakeItem);
        }

        console.log(dataObj);
        this.supersetAjax(dataObj);
      }
    },

    /**
     * 上报请求封装
     * @param {Object} dataObj 完整的请求体
     */
    supersetAjax: function (dataObj) {
      this.ajax({
        url: this.config.reportUrl,
        data: dataObj,
        type: 'post',
        dataType: 'json',
        headers: [],
        success: function (xhr, rsp) {
          // ropFun.testLog('superBatch---itemObj---success---' + rsp);
        },
        error: function (xhr, rsp) {
          // ropFun.testLog('superBatch---itemObj---error---' + rsp);
        }
      });
    },

    /**
     * 基础ajax封装
     * @param {Object} config 请求配置
     */
    ajax: function (config) {
      var url = config.url;
      var data = config.data;
      var dataAsync = config.async !== false;
      var type = (config.type || 'GET').toUpperCase();
      var contentType = config.contentType || this.config.defaultContentType;
      var dataType = config.dataType;
      var headers = config.headers || this.config.defaultHeaders;
      var fnSuccess = config.success || function () { };
      var fnError = config.error || function () { };
      var xmlhttp;

      if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
      } else {
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
      }

      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4) {
          var rsp = xmlhttp.responseText || xmlhttp.responseXML;
          var parseError = false;
          // 增加JSON解析异常捕获，避免响应格式错误导致页面报错
          if (dataType == 'json' && typeof rsp == 'string') {
            try {
              rsp = JSON.parse(rsp);
            } catch (e) {
              parseError = true;
              return;
            }
          }

          if (parseError) {
            fnError(xmlhttp, rsp);
          } else if (xmlhttp.status == 200) {
            fnSuccess(xmlhttp, rsp);
          } else {
            fnError(xmlhttp, rsp);
          }
        }
      };

      xmlhttp.open(type, url, dataAsync);
      for (var i = 0; i < headers.length; ++i) {
        xmlhttp.setRequestHeader(headers[i].name, headers[i].value);
      }
      xmlhttp.setRequestHeader('Content-Type', contentType);
      data = JSON.stringify(data);
      xmlhttp.send(data);
    }
  };
})();

/*
单次上报
supersetLewo.superBatchReport({
  userId: '',          // 用户唯一标识（需要用户登录，产生UID
  deviceId: supersetLewo.createDeviceId(),       // 设备唯一标识（设备号，如果无，则需要生成）
  appItem: '29',         // 项目编码，oms里面的渠道号
  contentType: '乐窝平台',     // 平台类型：独立游戏，或乐窝平台
  contentId: '',       // 游戏ID（具体乐窝的游戏ID）
  contentTitle: '',    // 游戏名（具体的乐窝游戏名）
  elementPosition: '', // 元素位置
  actionType: '曝光',      // 行为类型-曝光、点击
  eventName: '',       // 具体事件名（新增，需要按照上面表格传值）
  adRequestId: '',   // 广告请求ID，仅广告相关事件需要
  eventTime: '',       // 事件发生时间（格式建议：yyyy-MM-dd HH:mm:ss）
});


批量上报
supersetLewo.batchReporting([
  {
    userId: 'test123',
    deviceId: supersetLewo.createDeviceId(),
    appItem: 'wd',
    contentType: '游戏',
    contentId: '1',
    contentTitle: '2',
    elementPosition: '3',
    actionType: '曝光',
    eventName: '4',
    adRequestId: '',
    eventTime: '',
  },
  {
    userId: 'test123444',
    deviceId: supersetLewo.createDeviceId(),
    appItem: 'wd',
    contentType: '游戏',
    contentId: '1',
    contentTitle: '2',
    elementPosition: '3',
    actionType: '曝光',
    eventName: '4',
    adRequestId: '',
    eventTime: '',
  }
])
* */
/*supersetLewo.superBatchReport({
  userId: '',          // 用户唯一标识（需要用户登录，产生UID
  deviceId: supersetLewo.createDeviceId(),        // 设备唯一标识（设备号，如果无，则需要生成）
  appItem: 'wd',         // 项目编码
  contentType: '游戏',     // 游戏（乐窝的游戏，这个字段都固定上报游戏）
  contentId: '',       // 游戏ID（具体乐窝的游戏ID）
  contentTitle: '',    // 游戏名（具体的乐窝游戏名）
  elementPosition: '', // 元素位置
  actionType: '曝光',      // 行为类型-曝光、点击
  eventName: '',       // 具体事件名（新增，需要按照上面表格传值）
  adRequestId: '',   // 广告请求ID，仅广告相关事件需要
  eventTime: '',       // 事件发生时间（格式建议：yyyy-MM-dd HH:mm:ss）
});*/

// CommonJS 模块导出（不改动上方 IIFE 逻辑）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = supersetLewo;
}
