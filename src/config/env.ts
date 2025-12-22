export const PLUGIN_NAME = "homebridge-frisquet-connect";
export const PLATFORM_NAME = "FrisquetConnect";
export const DEFAULT_HOSTNAME = "https://fcutappli.frisquet.com/api/v1";
export const DEFAULT_APP_ID = "fsmFOoGzGEz0q6MPLtvA_z";
export const DEFAULT_USER_AGENT =
  "Frisquet Connect/2.6.1 (com.frisquetsa.connect; build:54; iOS 26.1.0) Alamofire/5.9.1";
export const DEFAULT_HISTORY_DISABLED = false;
export const DEFAULT_HISTORY_INTERVAL = 15 * 60; // 15min
export const DEFAULT_HEATING_DELTA = 10; // 1°C
export const { HOMEBRIDGE_FRISQUET_CONNECT_PASSWORD } = process.env;
