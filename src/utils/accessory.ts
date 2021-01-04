import assert from 'assert';
import {FakeGatoHistoryService} from 'fakegato-history';
import type {PlatformAccessory, Service, WithUUID} from 'homebridge';
import {setupTemperatureSensor} from '../accessories/temperatureSensor';
import {setupThermostat} from '../accessories/thermostat';
import FrisquetConnectController, {FrisquetConnectAccessoryContext} from '../controller';
import debug from '../utils/debug';
import {
  AccessoryEventTypes,
  Categories,
  Characteristic,
  CharacteristicEventTypes,
  Service as ServiceStatics
} from '../utils/hap';

export type ServiceClass = WithUUID<typeof Service>;

export const addAccessoryService = (
  accessory: PlatformAccessory,
  service: ServiceClass,
  name: string,
  removeExisting: boolean = false
): Service => {
  const existingService = accessory.getService(service);
  if (existingService) {
    if (!removeExisting) {
      return existingService;
    }
    accessory.removeService(existingService);
  }
  return accessory.addService(service, name);
};

export const addAccessoryServiceWithSubtype = (
  accessory: PlatformAccessory,
  service: ServiceClass,
  name: string,
  subtype: string,
  removeExisting: boolean = false
): Service => {
  const existingService = accessory.getServiceById(service, subtype);
  if (existingService) {
    if (!removeExisting) {
      return existingService;
    }
    accessory.removeService(existingService);
  }
  return accessory.addService(service, name, subtype);
};

type FrisquetConnectAccessorySetup = (
  accessory: PlatformAccessory,
  controller: FrisquetConnectController,
  HistoryService?: FakeGatoHistoryService
) => void;

export const getFrisquetConnectAccessorySetup = (accessory: PlatformAccessory): FrisquetConnectAccessorySetup => {
  const {category} = accessory;
  switch (category) {
    case Categories.SENSOR:
      return setupTemperatureSensor;
    case Categories.THERMOSTAT:
      return setupThermostat;
    default:
      throw new Error(`Unsupported accessory category=${category}`);
  }
};

export const setupAccessoryInformationService = (
  accessory: PlatformAccessory,
  _controller: FrisquetConnectController
): void => {
  const {context} = accessory;
  const {manufacturer, serialNumber, model} = context as FrisquetConnectAccessoryContext;

  const informationService = accessory.getService(ServiceStatics.AccessoryInformation);
  assert(informationService, `Did not found AccessoryInformation service`);
  informationService
    .setCharacteristic(Characteristic.Manufacturer, manufacturer)
    .setCharacteristic(Characteristic.SerialNumber, serialNumber)
    .setCharacteristic(Characteristic.Model, model);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const setupAccessoryIdentifyHandler = (
  accessory: PlatformAccessory,
  _controller: FrisquetConnectController
): void => {
  const {displayName: name, UUID: id} = accessory;
  // listen for the "identify" event for this Accessory
  accessory.on(AccessoryEventTypes.IDENTIFY, (/* paired: boolean, callback: VoidCallback */) => {
    // debug({id, type: 'AccessoryEventTypes.IDENTIFY', paired});
    debug(`New identify request for device named="${name}" with id="${id}"`);
    // callback();
  });
};

export const setupAccessoryTemperatureHistoryService = (
  accessory: PlatformAccessory,
  controller: FrisquetConnectController,
  service: Service,
  HistoryService?: FakeGatoHistoryService
): void => {
  const {historyDisabled, historyInterval} = controller.config;
  // const {context} = accessory;
  if (historyDisabled) {
    controller.log.warn(`Accessory named="${accessory.displayName}" history is disabled`);
    return;
  }
  assert(HistoryService);
  const actualHistoryInterval = Math.max(5 * 60, historyInterval) * 1000; // min. 5min
  // Setup history
  controller.log.info(
    `Setting up accessory named="${accessory.displayName}" history with interval=${actualHistoryInterval}s`
  );
  // @ts-expect-error fake-gato
  const historyService = new (HistoryService as FakeGatoHistoryService)('weather', accessory, {
    storage: 'fs'
  });
  const historyIntervalId = setInterval(() => {
    controller.log.info(`Accessory named="${accessory.displayName}" is performing an history update`);
    const currentTemperature = service.getCharacteristic(Characteristic.CurrentTemperature);
    currentTemperature.emit(CharacteristicEventTypes.GET, (err: Error | null, value: number) => {
      if (err || typeof value === 'undefined') {
        return;
      }
      if (value) {
        const time = Math.floor(Date.now() / 1000);
        const entry = {time, temp: value, pressure: 0, humidity: 0};
        historyService.addEntry(entry);
        controller.log.debug(`Accessory named="${accessory.displayName}" has added entry="${JSON.stringify(entry)}"`);
      }
    });
  }, actualHistoryInterval);
  // Setup cleanup
  process.on('SIGINT', () => {
    clearInterval(historyIntervalId);
  });
};

export const assignFrisquetConnectContext = (
  prev: PlatformAccessory['context'],
  next: FrisquetConnectAccessoryContext
): prev is FrisquetConnectAccessoryContext => {
  Object.assign(prev, next);
  return true;
};
