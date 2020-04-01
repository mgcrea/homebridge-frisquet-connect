import 'source-map-support/register';
import fakegatoHistory from 'fakegato-history';
import {PLATFORM_NAME, PLUGIN_NAME} from 'src/config/env';
import FrisquetConnectPlatform from './platform';

interface Homebridge {
  version: number;
  serverVersion: string;
  registerPlatform: (pluginName: string, platformName: string, constructor: unknown, dynamic?: boolean) => unknown;
}

export default (homebridge: Homebridge) => {
  FrisquetConnectPlatform.HistoryService = fakegatoHistory(homebridge);
  homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, FrisquetConnectPlatform, true);
};
