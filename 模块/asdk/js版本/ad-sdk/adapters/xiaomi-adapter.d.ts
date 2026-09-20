/**
 * 聚合广告 SDK - 小米电视适配器类型声明
 */

import { AdPlatform, AdEvent } from '../types/enums';
import {
  IAdAdapter,
  IAdapterConfig,
  IAdRequest,
  IAdRewardResult,
  IDeviceInfo,
  IAccountInfo,
  IEventHandler,
} from '../types/interfaces';

export declare class XiaomiAdapter implements IAdAdapter {
  readonly platform: AdPlatform;
  init(config: IAdapterConfig): Promise<void>;
  requestAd(request: IAdRequest): Promise<IAdRewardResult>;
  destroy(): void;
  on(event: AdEvent, handler: IEventHandler): void;
  off(event: AdEvent, handler?: IEventHandler): void;
  getDeviceInfo(): Promise<IDeviceInfo>;
  getAccount(): Promise<IAccountInfo>;
  onGameReady(version: string): void;
  onGamePause(): void;
  onGameResume(): void;
  exitGame(): Promise<void>;
}
