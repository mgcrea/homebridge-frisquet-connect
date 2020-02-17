import {EventEmitter} from 'events';
import got, {CancelableRequest, Response} from 'got';
import {Categories} from 'hap-nodejs';
import {get} from 'lodash';
import assert from 'src/utils/assert';
import debug from 'src/utils/debug';
import {DEFAULT_APP_ID, DEFAULT_HOSTNAME, DEFAULT_USER_AGENT} from './config/env';
import {FrisquetConnectPlatformConfig} from './platform';
import {FrisqueConnectClient, SiteResponse, Zone} from './typings/frisquetConnect';

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
  log: typeof console;
  sitePromise?: CancelableRequest<Response<SiteResponse>>;
  siteTime: number = 0;
  constructor(log: typeof console, config: FrisquetConnectPlatformConfig) {
    super();
    this.config = config;
    this.log = log;
    this.devices = new Set();
    const {hostname = DEFAULT_HOSTNAME, username, password} = config;
    assert(hostname, 'Missing "hostname" config field for platform');
    assert(username, 'Missing "username" config field for platform');
    assert(password, 'Missing "password" config field for platform');
    debug(`Creating FrisquetConnect client with username="${username}" and hostname="${hostname}"`);
    this.client = got.extend({
      prefixUrl: hostname,
      headers: {
        'user-agent': DEFAULT_USER_AGENT
      },
      responseType: 'json'
    });
  }

  async login() {
    const {username, password} = this.config;
    const searchParams = {appId: DEFAULT_APP_ID};
    const {body} = await this.client.post('authentifications', {
      json: {
        locale: 'fr',
        email: username,
        password,
        type_client: 'IOS' // eslint-disable-line @typescript-eslint/camelcase
      },
      searchParams
    });
    return body;
  }

  async getSite(): Promise<SiteResponse> {
    const {token, siteId} = this.config;
    const searchParams = {token};
    this.siteTime = Date.now();
    this.sitePromise = this.client.get(`sites/${siteId}`, {
      searchParams
    });
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
    return zones.find(zone => zone.identifiant === deviceId) as Zone;
  }
  getAccessoryId(deviceId: string) {
    const {siteId} = this.config;
    return `FrisquetConnect:${siteId.slice(6)}:accessories:${deviceId}`;
  }
  async scan() {
    const {token, utilisateur} = await this.login();
    const siteId = get(utilisateur, `sites.${SITE_INDEX}.identifiant_chaudiere`, null);
    this.config.token = token;
    this.config.siteId = siteId;
    const {environnement, zones} = await this.getSite();

    const externalTemp = get(environnement, 'T_EXT', null);
    if (externalTemp) {
      const deviceId = 'T_EXT';
      this.devices.add(deviceId);
      const accessoryId = this.getAccessoryId(deviceId);
      const context: FrisquetConnectAccessoryContext = {
        name: 'Sonde extérieure',
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

    zones.forEach(zone => {
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
