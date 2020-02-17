import assert from 'assert';
import {
  Characteristic,
  CharacteristicEventTypes,
  CharacteristicProps,
  CharacteristicSetCallback,
  CharacteristicValue,
  NodeCallback,
  Service
} from 'hap-nodejs';
import FrisquetConnectController, {FrisquetConnectAccessoryContext} from 'src/controller';
import {PlatformAccessory} from 'src/typings/homebridge';
import {
  addAccessoryService,
  setupAccessoryIdentifyHandler,
  setupAccessoryInformationService
} from 'src/utils/accessory';
import debug from 'src/utils/debug';

const HEATING_DELTA = 10;

export const setupThermostat = (accessory: PlatformAccessory, controller: FrisquetConnectController): void => {
  const {UUID: id, context} = accessory;

  const {deviceId} = context as FrisquetConnectAccessoryContext;
  setupAccessoryInformationService(accessory, controller);
  setupAccessoryIdentifyHandler(accessory, controller);

  // Add the actual accessory Service
  const service = addAccessoryService(accessory, Service.Thermostat, `${accessory.displayName}`, true);
  const {TargetHeatingCoolingState, CurrentHeatingCoolingState, TargetTemperature, CurrentTemperature} = Characteristic;

  service
    .getCharacteristic(CurrentHeatingCoolingState)!
    // @ts-ignore
    .setProps({validValues: [0, 1]} as Partial<CharacteristicProps>) // [OFF, HEAT, COOL]
    .on(CharacteristicEventTypes.GET, async (callback: NodeCallback<CharacteristicValue>) => {
      debug(`-> GET TargetHeatingCoolingState for "${id}"`);
      try {
        const {carac_zone: settings} = await controller.getZone(deviceId);
        assert(settings.CAMB, 'Missing `carac_zone.CAMB` value');
        assert(settings.TAMB, 'Missing `carac_zone.TAMB` value');
        callback(
          null,
          settings.CAMB < settings.TAMB - HEATING_DELTA
            ? CurrentHeatingCoolingState.HEAT
            : CurrentHeatingCoolingState.OFF
        );
      } catch (err) {
        callback(err);
      }
    });

  service
    .getCharacteristic(TargetHeatingCoolingState)!
    // @ts-ignore
    .setProps({validValues: [0, 1]} as Partial<CharacteristicProps>) // [OFF, HEAT, COOL, AUTO]
    .on(CharacteristicEventTypes.GET, async (callback: NodeCallback<CharacteristicValue>) => {
      debug(`-> GET TargetHeatingCoolingState for "${id}"`);
      try {
        const {carac_zone: settings} = await controller.getZone(deviceId);
        assert(settings.MODE, 'Missing `carac_zone.MODE` value');
        callback(null, settings.MODE === 6 ? TargetHeatingCoolingState.HEAT : TargetHeatingCoolingState.OFF);
      } catch (err) {
        callback(err);
      }
    })
    .on(CharacteristicEventTypes.SET, async (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
      debug(`-> SET TargetHeatingCoolingState value="${value}" for id="${id}"`);
      callback();
    });

  service
    .getCharacteristic(TargetTemperature)!
    .on(CharacteristicEventTypes.GET, async (callback: NodeCallback<CharacteristicValue>) => {
      debug(`-> GET TargetTemperature for "${id}"`);
      try {
        const {carac_zone: settings} = await controller.getZone(deviceId);
        assert(settings.CAMB, 'Missing `carac_zone.CAMB` value');
        callback(null, settings.CAMB / 10);
      } catch (err) {
        callback(err);
      }
    })
    .on(CharacteristicEventTypes.SET, async (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
      debug(`-> SET TargetTemperature value="${value}" for id="${id}"`);
      callback();
    });

  service
    .getCharacteristic(CurrentTemperature)!
    .on(CharacteristicEventTypes.GET, async (callback: NodeCallback<CharacteristicValue>) => {
      debug(`-> GET CurrentTemperature for "${id}"`);
      try {
        const {carac_zone: settings} = await controller.getZone(deviceId);
        assert(settings.TAMB, 'Missing `carac_zone.TAMB` value');
        callback(null, settings.TAMB / 10);
      } catch (err) {
        callback(err);
      }
    });
};
