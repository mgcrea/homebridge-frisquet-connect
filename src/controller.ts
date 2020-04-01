import {EventEmitter} from 'events';
import {CancelableRequest, Response} from 'got';
import {Categories} from 'hap-nodejs';
import {get} from 'lodash';
import assert from 'assert';
import frisquetConnectClientFactory, {Client as FrisqueConnectClient} from './client';
import {FrisquetConnectPlatformConfig} from './platform';
import {SiteResponse, Zone} from './typings/frisquetConnect';
import {HomebridgeLog} from './typings/homebridge';

const SITE_INDEX = 0;
const DEBOUNCE_TIME = 10 * 1e3;

export type FrisquetConnectAccessoryContext = {
  name: string;
  deviceId: string;
  accessoryId: string;
  manufacturer: string;
  serialNumber: string;
  model: string;
};

export type ControllerDevicePayload = {
  name: string;
  category: Categories;
  context: FrisquetConnectAccessoryContext;
};

export default class FrisquetConnectController extends EventEmitter {
  client: FrisqueConnectClient;
  config: FrisquetConnectPlatformConfig;
  devices: Set<string>;
  log: HomebridgeLog;
  sitePromise?: CancelableRequest<Response<SiteResponse>>;
  siteTime: number = 0;
  constructor(log: HomebridgeLog, config: FrisquetConnectPlatformConfig) {
    super();
    this.config = config;
    this.log = log;
    this.devices = new Set();
    this.client = frisquetConnectClientFactory(log, config);
  }

  async getSite(): Promise<SiteResponse> {
    const {siteId} = this.config;
    this.siteTime = Date.now();
    this.log.info(`Performing GET request on "sites/${siteId}"`);
    this.sitePromise = this.client.get(`sites/${siteId}`);
    const {body} = await this.sitePromise;
    return body as SiteResponse;
  }
  async getDebouncedSite(): Promise<SiteResponse> {
    const now = Date.now();
    if (now < this.siteTime + DEBOUNCE_TIME) {
      const {body} = await this.sitePromise!;
      return body as SiteResponse;
    }
    return this.getSite();
  }
  async getEnvironment(deviceId: string): Promise<number> {
    const {environnement} = await this.getDebouncedSite();
    return get(environnement, deviceId, 0);
  }
  async getZone(deviceId: string): Promise<Zone> {
    const {zones} = await this.getDebouncedSite();
    return zones.find((zone) => zone.identifiant === deviceId) as Zone;
  }
  getAccessoryId(deviceId: string) {
    const {siteId} = this.config;
    return `FrisquetConnect:${siteId.slice(6)}:accessories:${deviceId}`;
  }
  async scan() {
    const {utilisateur} = await this.client.login();
    const siteId = get(utilisateur, `sites.${SITE_INDEX}.identifiant_chaudiere`, '') as string;
    assert(siteId, 'Unexpected missing "siteId" in login response');
    this.config.siteId = siteId;
    const {environnement, zones} = await this.getSite();

    const externalTemp = get(environnement, 'T_EXT', null);
    if (externalTemp) {
      const deviceId = 'T_EXT';
      const name = 'Sonde extérieure';
      this.devices.add(deviceId);
      const accessoryId = this.getAccessoryId(deviceId);
      const context: FrisquetConnectAccessoryContext = {
        name,
        deviceId,
        accessoryId,
        manufacturer: 'Frisquet',
        serialNumber: `${siteId}.${deviceId}`,
        model: `${deviceId}`
      };
      this.emit('device', {
        name,
        category: Categories.SENSOR,
        context
      } as ControllerDevicePayload);
    }

    zones.forEach((zone) => {
      const {id, identifiant, nom: name} = zone;
      const deviceId = identifiant;
      this.devices.add(deviceId);
      const accessoryId = this.getAccessoryId(deviceId);
      const context: FrisquetConnectAccessoryContext = {
        name,
        deviceId,
        accessoryId,
        manufacturer: 'Frisquet',
        serialNumber: `${siteId}.${deviceId}`,
        model: `${id}`
      };
      this.emit('device', {
        name,
        category: Categories.THERMOSTAT,
        context
      } as ControllerDevicePayload);
    });
  }
}
