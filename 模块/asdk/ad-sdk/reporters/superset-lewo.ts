// ========== 私有常量与缓存（闭包内部，外部无法访问） ==========
const STORAGE_KEY: string = 'analytics.device_id.uuid_v4';
let memoryCache: string | null = null;

interface DefaultReportItem {
  userId: string;
  deviceId: string;
  appItem: string;
  contentType: string;
  contentId: string;
  contentTitle: string;
  elementPosition: string;
  actionType: string;
  eventName: string;
  adRequestId: string;
  eventTime: string;
  exposureFlag?: boolean;
  [key: string]: any;
}

interface HeaderItem {
  name: string;
  value: string;
}

interface SupersetConfig {
  reportUrl: string;
  defaultHeaders: HeaderItem[];
  defaultContentType: string;
  defaultActionType: string;
}

interface AjaxConfig {
  url: string;
  data?: any;
  async?: boolean;
  type?: string;
  contentType?: string;
  dataType?: string;
  headers?: HeaderItem[];
  success?: (xhr: XMLHttpRequest, rsp: any) => void;
  error?: (xhr: XMLHttpRequest, rsp: any) => void;
}

interface SupersetLewo {
  config: SupersetConfig;
  defaultReportItem: DefaultReportItem;
  camelToSnake: (obj: Record<string, any>) => Record<string, any>;
  mergeReportItem: (item: Partial<DefaultReportItem>) => DefaultReportItem;
  handleTime: () => string;
  createDeviceId: () => string;
  resetDeviceId: () => void;
  superBatchReport: (obj: Partial<DefaultReportItem>) => void;
  batchReporting: (dataList: Partial<DefaultReportItem>[], commonInfo?: Partial<DefaultReportItem>) => void;
  supersetAjax: (dataObj: { data: any[] }) => void;
  ajax: (config: AjaxConfig) => void;
}

/**
 * 生成标准 UUID v4
 * 优先使用原生 crypto API，逐级降级
 */
function createUuidV4(): string {
  const cryptoGlobal = globalThis.crypto as any;
  if (cryptoGlobal && typeof cryptoGlobal.randomUUID === 'function') {
    return cryptoGlobal.randomUUID().toLowerCase();
  }

  if (cryptoGlobal && typeof cryptoGlobal.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    cryptoGlobal.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (val: number) => {
      return val.toString(16).padStart(2, '0');
    }).join('');
    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' +
      hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  return generatePseudoUuid();
}

function generatePseudoUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 安全获取 Cookie（自动转义key，避免正则特殊字符 . + * 等失效）
 */
function getCookie(name: string): string | null {
  try {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reg = new RegExp('(^| )' + escapedName + '=([^;]+)');
    const doc = document as any;
    const match = doc.cookie.match(reg);
    return match ? match[2] : null;
  } catch (e) {
    return null;
  }
}

/**
 * 设置 Cookie：自动适配 HTTPS/HTTP，动态控制 Secure
 */
function setCookie(name: string, value: string): void {
  try {
    const win = window as any;
    const isHttps = win.location.protocol === 'https:';
    const parts: string[] = [
      name + '=' + value,
      'max-age=31536000',
      'path=/',
      'SameSite=Lax'
    ];
    if (isHttps) {
      parts.push('Secure');
    }
    (document as any).cookie = parts.join(';');
  } catch (e) {
    // ignore
  }
}

// ========== 对外暴露对象 ==========
const supersetLewo: SupersetLewo = {
  // ===================== 公共配置 =====================
  config: {
    reportUrl: 'http://sup.daoran.tv/bi-api/api/game/lewo/batch',
    defaultHeaders: [],
    defaultContentType: 'application/json;charset=UTF-8',
    defaultActionType: '曝光'
  },

  // ===================== 公共上报字段模板（驼峰入参，自动转下划线请求后端） =====================
  defaultReportItem: {
    userId: '',
    deviceId: '',
    appItem: '',
    contentType: '独立游戏',
    contentId: '',
    contentTitle: '',
    elementPosition: '',
    actionType: '',
    eventName: '',
    adRequestId: '',
    eventTime: '',
  },

  // ===================== 工具方法 =====================
  /**
   * 驼峰命名转下划线命名（保证后端接收字段与原格式完全一致）
   * @param obj 驼峰格式对象
   * @returns 下划线格式对象
   */
  camelToSnake(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        result[snakeKey] = obj[key];
      }
    }
    return result;
  },

  /**
   * 合并默认上报字段，补全默认值
   * @param item 传入的上报数据
   * @returns 合并后的完整上报项
   */
  mergeReportItem(item: Partial<DefaultReportItem>): DefaultReportItem {
    const merged: any = {};
    const defaultItem = this.defaultReportItem;
    for (const key in defaultItem) {
      if (defaultItem.hasOwnProperty(key)) {
        merged[key] = item[key] !== undefined ? item[key] : defaultItem[key];
      }
    }
    if (!merged.eventTime) {
      merged.eventTime = this.handleTime();
    }
    if (!merged.actionType) {
      merged.actionType = this.config.defaultActionType;
    }
    console.log('mergeReportItem-result', merged);
    return merged;
  },

  /**
   * 时间格式化：yyyy-MM-dd HH:mm:ss
   */
  handleTime(): string {
    const date_t = new Date();
    const y_t = date_t.getFullYear();
    let m_t: number | string = date_t.getMonth() + 1;
    m_t = m_t < 10 ? '0' + m_t : m_t;
    let d_t: number | string = date_t.getDate();
    d_t = d_t < 10 ? '0' + d_t : d_t;
    let h_t: number | string = date_t.getHours();
    h_t = h_t < 10 ? '0' + h_t : h_t;
    let min_t: number | string = date_t.getMinutes();
    min_t = min_t < 10 ? '0' + min_t : min_t;
    let sec_t: number | string = date_t.getSeconds();
    sec_t = sec_t < 10 ? '0' + sec_t : sec_t;
    return y_t + '-' + m_t + '-' + d_t + ' ' + h_t + ':' + min_t + ':' + sec_t;
  },

  // ===================== 设备ID相关新增方法 =====================
  /**
   * 获取或创建设备唯一ID（持久化，优先内存缓存 > localStorage > cookie）
   * @returns uuid v4 deviceId
   */
  createDeviceId(): string {
    if (memoryCache) {
      return memoryCache;
    }

    try {
      const existing = (localStorage as any).getItem(STORAGE_KEY);
      if (existing) {
        memoryCache = existing.trim().toLowerCase();
        return memoryCache;
      }
    } catch (e) {
      // ignore
    }

    const existingCookie = getCookie(STORAGE_KEY);
    if (existingCookie) {
      memoryCache = existingCookie.trim().toLowerCase();
      try {
        (localStorage as any).setItem(STORAGE_KEY, memoryCache);
      } catch (e) {
        // ignore
      }
      return memoryCache;
    }

    const newId = createUuidV4();
    memoryCache = newId;

    try {
      (localStorage as any).setItem(STORAGE_KEY, newId);
    } catch (e) {
      // ignore
    }
    setCookie(STORAGE_KEY, newId);

    return newId;
  },

  /**
   * 重置/清除设备ID（清除内存缓存、localStorage、cookie）
   */
  resetDeviceId(): void {
    memoryCache = null;
    try {
      (localStorage as any).removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    try {
      const win = window as any;
      const isHttps = win.location.protocol === 'https:';
      const cookieParts: string[] = [
        STORAGE_KEY + '=',
        'max-age=0',
        'path=/',
        'SameSite=Lax'
      ];
      if (isHttps) {
        cookieParts.push('Secure');
      }
      (document as any).cookie = cookieParts.join(';');
    } catch (e) {
      // ignore
    }
  },

  // ===================== 核心上报方法 =====================
  /**
   * 单次日志上报
   * @param obj 驼峰格式的上报数据
   */
  superBatchReport(obj: Partial<DefaultReportItem>): void {
    const mergedItem = this.mergeReportItem(obj);
    const snakeItem = this.camelToSnake(mergedItem);
    const dataObj = {
      data: [snakeItem]
    };
    this.supersetAjax(dataObj);
  },

  /**
   * 批量曝光上报
   * @param dataList 上报数据列表（驼峰格式）
   * @param commonInfo 可选-公共字段（设备信息，统一填充到所有条目）
   */
  batchReporting(dataList: Partial<DefaultReportItem>[], commonInfo?: Partial<DefaultReportItem>): void {
    console.log('BatchReporting', dataList);
    let exposureFlag = false;
    for (let i = 0; i < dataList.length; i++) {
      const item = dataList[i];
      if (item.exposureFlag) {
        exposureFlag = true;
        break;
      }
    }

    if (!exposureFlag) {
      const dataObj: { data: any[] } = {
        data: []
      };
      commonInfo = commonInfo || {};

      for (let i = 0; i < dataList.length; i++) {
        const item = dataList[i];
        dataList[i].exposureFlag = true;

        const reportItem: any = {};
        for (const cKey in commonInfo) {
          if (commonInfo.hasOwnProperty(cKey)) {
            reportItem[cKey] = (commonInfo as any)[cKey];
          }
        }
        for (const iKey in item) {
          if (item.hasOwnProperty(iKey)) {
            reportItem[iKey] = (item as any)[iKey];
          }
        }

        const mergedItem = this.mergeReportItem(reportItem);
        const snakeItem = this.camelToSnake(mergedItem);
        dataObj.data.push(snakeItem);
      }

      console.log(dataObj);
      this.supersetAjax(dataObj);
    }
  },

  /**
   * 上报请求封装
   * @param dataObj 完整的请求体
   */
  supersetAjax(dataObj: { data: any[] }): void {
    this.ajax({
      url: this.config.reportUrl,
      data: dataObj,
      type: 'post',
      dataType: 'json',
      headers: [],
      success: (_xhr: XMLHttpRequest, _rsp: any) => {
        // success
      },
      error: (_xhr: XMLHttpRequest, _rsp: any) => {
        // error
      }
    });
  },

  /**
   * 基础ajax封装
   * @param config 请求配置
   */
  ajax(config: AjaxConfig): void {
    const url = config.url;
    const data = config.data;
    const dataAsync = config.async !== false;
    const type = (config.type || 'GET').toUpperCase();
    const contentType = config.contentType || this.config.defaultContentType;
    const dataType = config.dataType;
    const headers = config.headers || this.config.defaultHeaders;
    const fnSuccess = config.success || function () { };
    const fnError = config.error || function () { };
    let xmlhttp: XMLHttpRequest;

    const win = window as any;
    if (win.XMLHttpRequest) {
      xmlhttp = new win.XMLHttpRequest();
    } else {
      xmlhttp = new win.ActiveXObject('Microsoft.XMLHTTP');
    }

    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState === 4) {
        let rsp: any = xmlhttp.responseText || (xmlhttp as any).responseXML;
        let parseError = false;
        if (dataType === 'json' && typeof rsp === 'string') {
          try {
            rsp = JSON.parse(rsp);
          } catch (e) {
            parseError = true;
            return;
          }
        }

        if (parseError) {
          fnError(xmlhttp, rsp);
        } else if (xmlhttp.status === 200) {
          fnSuccess(xmlhttp, rsp);
        } else {
          fnError(xmlhttp, rsp);
        }
      }
    };

    xmlhttp.open(type, url, dataAsync);
    for (let i = 0; i < headers.length; ++i) {
      xmlhttp.setRequestHeader(headers[i].name, headers[i].value);
    }
    xmlhttp.setRequestHeader('Content-Type', contentType);
    const sendData = JSON.stringify(data);
    xmlhttp.send(sendData);
  }
};

export default supersetLewo;
