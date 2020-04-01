import {Categories} from 'hap-nodejs';
import {PLATFORM_NAME, PLUGIN_NAME, DEFAULT_HISTORY_INTERVAL, DEFAULT_HISTORY_DISABLED} from './config/env';
import FrisquetConnectController, {ControllerDevicePayload, FrisquetConnectAccessoryContext} from './controller';
import {HomebridgeApi, Platform, PlatformAccessory, HomebridgeLog} from './typings/homebridge';
import {getFrisquetConnectAccessorySetup} from './utils/accessory';
import {FakeGatoHistoryService} from 'fakegato-history';

export type FrisquetConnectPlatformConfig = {
  platform: string;
  hostname: string;
  username: string;
  password: string;
  siteId: string;
  settings: Record<string, {name?: string; category?: Categories}>;
  historyDisabled: boolean;
  historyInterval: number;
};

export default class FrisquetConnectPlatform implements Platform {
  static HistoryService: FakeGatoHistoryService | null = null;
  cleanupAccessoriesIds: Set<string>;
  accessories: Map<string, PlatformAccessory>;
  controller?: FrisquetConnectController;
  api: HomebridgeApi;
  config: FrisquetConnectPlatformConfig;
  disabled: boolean = false;
  log: HomebridgeLog;

  constructor(log: HomebridgeLog, config: FrisquetConnectPlatformConfig, api: HomebridgeApi) {
    // Expose args
    this.config = Object.assign(
      {historyInterval: DEFAULT_HISTORY_INTERVAL, historyDisabled: DEFAULT_HISTORY_DISABLED},
      config
    );
    this.log = log;
    this.api = api;
    // Internal
    this.accessories = new Map();
    this.cleanupAccessoriesIds = new Set();

    if (!config) {
      log.warn('Ignoring FrisquetConnect platform setup because it is not configured');
      this.disabled = true;
      return;
    }

    this.controller = new FrisquetConnectController(log, this.config) as FrisquetConnectController;
    // Prevent configureAccessory getting called after node ready
    this.api.on('didFinishLaunching', () => setTimeout(() => this.didFinishLaunching(), 16));
    // this.controller.on('connect', () => {
    //   this.log.info();
    // });
    this.controller.on('device', this.handleControllerDevice.bind(this));
  }
  async didFinishLaunching() {
    this.cleanupAccessoriesIds = new Set(this.accessories.keys());
    await this.controller!.scan();
    this.cleanupAccessoriesIds.forEach((accessoryId) => {
      const accessory = this.accessories.get(accessoryId)!;
      this.log.warn(`Deleting missing accessory with id="${accessoryId}"`);
      // accessory.updateReachability(false);
      this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    });
    this.log.info(`Properly loaded ${this.accessories.size}-accessories`);
  }
  handleControllerDevice({name, category, context}: ControllerDevicePayload) {
    const id = this.api.hap.uuid.generate(context.accessoryId);
    this.log.info(`Found new frisquet connect device named="${name}" with id="${id}"`);
    this.log.debug(`Frisquet Connect device="${id}" context="${JSON.stringify(context)}"`);
    // Prevent automatic cleanup
    this.cleanupAccessoriesIds.delete(id);
    if (this.accessories.has(id)) {
      this.updateAccessory(this.accessories.get(id)!, context);
      return;
    }
    const accessory = this.createAccessory(name, id, category, context);
    this.accessories.set(id, accessory);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  }
  createAccessory(name: string, id: string, category: Categories, context: FrisquetConnectAccessoryContext) {
    this.log.info(`Creating accessory named="${name}" with id="${id}"`);
    const {platformAccessory: PlatformAccessory} = this.api;
    const accessory = new PlatformAccessory(name, id, category);
    Object.assign(accessory.context, context);
    this.updateAccessory(accessory, context);
    return accessory;
  }
  updateAccessory(accessory: PlatformAccessory, context: FrisquetConnectAccessoryContext) {
    const {HistoryService} = FrisquetConnectPlatform;
    const {displayName: name, UUID: id} = accessory;
    this.log.info(`Updating accessory named="${name}" with id="${id}"`);
    Object.assign(accessory.context, context);
    const FrisquetConnectAccessorySetup = getFrisquetConnectAccessorySetup(accessory);
    FrisquetConnectAccessorySetup(accessory, this.controller!, HistoryService as FakeGatoHistoryService);
    this.api.updatePlatformAccessories([accessory]);
  }
  // Called by homebridge with existing cached accessories
  configureAccessory(accessory: PlatformAccessory) {
    this.log.debug(`Found cached accessory with id="${accessory.UUID}"`);
    this.accessories.set(accessory.UUID, accessory);
  }
}
