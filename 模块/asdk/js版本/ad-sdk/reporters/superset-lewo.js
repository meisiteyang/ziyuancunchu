var supersetLewo = (function () {
  // ========== 私有常量与缓存（闭包内部，外部无法访问） ==========
  var STORAGE_KEY = 'analytics.device_id.uuid_v4';
  var memoryCache = null;

  /**
   * 生成标准 UUID v4
   * 优先使用原生 crypto API，逐级降级
   */
  function createUuidV4() {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID().toLowerCase();
    }

    if (globalThis.crypto?.getRandomValues) {
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
      reportUrl: 'https://sup.daoran.tv/bi-api/api/game/lewo/batch',
      // reportUrl: '/bi-api/api/game/lewo/batch',
      // 默认请求头
      defaultHeaders: [
        // { name: 'md5', value: "GYWmhK2MfuQtDc9Cj8Fbw9hGoJwQ+f3WTgHRahD1TRiA6TpexZSORQ==" }
      ],
      defaultContentType: 'application/json;charset=UTF-8',
      // 默认行为类型
      defaultActionType: '曝光'
    },

    // ===================== 公共上报字段模板（全部改为下划线字段，对齐后端接口图片参数） =====================
    defaultReportItem: {
      user_id: '',          // 用户唯一标识（需要用户登录，产生UID）
      device_id: '',        // 设备唯一标识（设备号，如果无，则需要生成）
      app_item: '',         // 渠道，如29，x5
      content_type: '游戏', // 游戏（乐窝的游戏，这个字段都固定上报游戏）
      content_id: '',       // 游戏ID（具体乐窝的游戏ID）
      content_title: '',    // 游戏名（具体的乐窝游戏名）
      element_position: '', // 元素位置（埋点范围表对应的 元素位置列）
      action_type: '',      // 曝光/点击
      event_name: '',       // 具体事件名（新增，友盟需要按照上面表格传值，通过元素位置和行为生成事件名字）
      event_time: '',       // 客户端事件时间（格式建议：yyyy-MM-dd HH:mm:ss）
      ad_request_id: ''     // 广告请求ID，仅广告相关事件需要
    },

    // ===================== 工具方法 =====================
    /**
     * 合并默认上报字段，补全默认值
     * @param {Object} item 传入的下划线格式上报数据
     * @returns {Object} 合并后的完整上报项（下划线字段）
     */
    mergeReportItem: function (item) {
      var merged = {};
      var defaultItem = this.defaultReportItem;
      // 拷贝默认值，传入值优先覆盖
      for (var key in defaultItem) {
        if (defaultItem.hasOwnProperty(key)) {
          merged[key] = item[key] !== undefined ? item[key] : defaultItem[key];
        }
      }
      // 自动生成事件时间（未传时）
      if (!merged.event_time) {
        merged.event_time = this.handleTime();
      }
      // 填充默认行为类型
      if (!merged.action_type) {
        merged.action_type = this.config.defaultActionType;
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
     * @returns {string} uuid v4 device_id
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
     * @param {Object} obj 下划线格式的上报数据
     */
    superBatchReport: function (obj) {
      var mergedItem = this.mergeReportItem(obj);
      // 已为下划线字段，直接上报，移除驼峰转译逻辑
      var dataObj = {
        data: [mergedItem]
      };
      this.supersetAjax(dataObj);
    },

    /**
     * 批量曝光上报
     * @param {Array} dataList 上报数据列表（下划线格式）
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

          // 合并默认值，直接下划线结构推入数组
          var mergedItem = this.mergeReportItem(reportItem);
          dataObj.data.push(mergedItem);
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

        },
        error: function (xhr, rsp) {

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

// 单次上报调用示例（入参直接使用下划线key，方法名保持驼峰不变）
/*supersetLewo.superBatchReport({
  user_id: '',          // 用户唯一标识（需要用户登录，产生UID）
  device_id: supersetLewo.createDeviceId(),       // 设备唯一标识（设备号，如果无，则需要生成）
  app_item: '29',         // 渠道，如29，x5
  content_type: '游戏',     // 游戏（乐窝的游戏，这个字段都固定上报游戏）
  content_id: '',       // 游戏ID（具体乐窝的游戏ID）
  content_title: '',    // 游戏名（具体的乐窝游戏名）
  element_position: '', // 元素位置（埋点范围表对应的 元素位置列）
  action_type: '曝光',      // 曝光/点击
  event_name: '',       // 具体事件名（新增，友盟需要按照上面表格传值，通过元素位置和行为生成事件名字）
  ad_request_id: '',   // 广告请求ID，仅广告相关事件需要
  event_time: '',       // 客户端事件时间（格式建议：yyyy-MM-dd HH:mm:ss）
});*/


// 批量上报调用示例（方法名驼峰，参数下划线）
/*supersetLewo.batchReporting([
  {
    user_id: 'test123',
    device_id: supersetLewo.createDeviceId(),
    app_item: '29',
    content_type: '游戏',
    content_id: '1',
    content_title: '2',
    element_position: '3',
    action_type: '曝光',
    event_name: '4',
    ad_request_id: '',
    event_time: '',
  },
  {
    user_id: 'test123444',
    device_id: supersetLewo.createDeviceId(),
    app_item: '29',
    content_type: '游戏',
    content_id: '1',
    content_title: '2',
    element_position: '3',
    action_type: '曝光',
    event_name: '4',
    ad_request_id: '',
    event_time: '',
  }
])*/

// CommonJS 模块导出（不改动上方 IIFE 逻辑）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = supersetLewo;
}
