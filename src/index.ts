import fakegatoHistory from 'fakegato-history';
import type {API as Homebridge} from 'homebridge';
import 'source-map-support/register';
import {PLATFORM_NAME, PLUGIN_NAME} from './config/env';
import FrisquetConnectPlatform from './platform';
import {defineHAPGlobals} from './utils/hap';

export default (homebridge: Homebridge): void => {
  defineHAPGlobals(homebridge);
  FrisquetConnectPlatform.HistoryService = fakegatoHistory(homebridge);
  homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, FrisquetConnectPlatform);
};
