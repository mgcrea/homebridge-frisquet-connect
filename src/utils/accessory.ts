import {AccessoryEventTypes, Categories, Characteristic, Service, VoidCallback} from 'hap-nodejs';
import {setupTemperatureSensor} from 'src/accessories/temperatureSensor';
import {setupThermostat} from 'src/accessories/thermostat';
import FrisquetConnectController, {FrisquetConnectAccessoryContext} from 'src/controller';
import {PlatformAccessory} from 'src/typings/homebridge';
import assert from 'src/utils/assert';
import debug from 'src/utils/debug';

export const addAccessoryService = (
  accessory: PlatformAccessory,
  service: Service | typeof Service,
  name: string,
  removeExisting: boolean = false
) => {
  const existingService = accessory.getService(service);
  if (existingService) {
    if (!removeExisting) {
      return existingService;
    }
    accessory.removeService(existingService);
  }
  return accessory.addService(service, name);
};

type FrisquetConnectAccessorySetup = (accessory: PlatformAccessory, controller: FrisquetConnectController) => void;

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

  const informationService = accessory.getService(Service.AccessoryInformation);
  assert(informationService, `Did not found AccessoryInformation service`);
  informationService
    .setCharacteristic(Characteristic.Manufacturer, manufacturer)
    .setCharacteristic(Characteristic.SerialNumber, serialNumber)
    .setCharacteristic(Characteristic.Model, model);
};

export const setupAccessoryIdentifyHandler = (
  accessory: PlatformAccessory,
  _controller: FrisquetConnectController
): void => {
  const {displayName: name, UUID: id} = accessory;
  // listen for the "identify" event for this Accessory
  accessory.on(AccessoryEventTypes.IDENTIFY, async (paired: boolean, callback: VoidCallback) => {
    debug({id, type: 'AccessoryEventTypes.IDENTIFY', paired});
    debug(`New identify request for device named="${name}" with id="${id}"`);
    callback();
  });
};

export const assignFrisquetConnectContext = (
  prev: PlatformAccessory['context'],
  next: FrisquetConnectAccessoryContext
): prev is FrisquetConnectAccessoryContext => {
  Object.assign(prev, next);
  return true;
};
