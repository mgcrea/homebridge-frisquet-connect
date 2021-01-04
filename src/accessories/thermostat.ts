import assert from 'assert';
import {FakeGatoHistoryService} from 'fakegato-history';
import {
  Characteristic,
  CharacteristicEventTypes,
  CharacteristicProps,
  CharacteristicSetCallback,
  CharacteristicValue,
  NodeCallback,
  Service
} from 'hap-nodejs';
import type {PlatformAccessory} from 'homebridge';
import {DEFAULT_HEATING_DELTA} from '../config/env';
import FrisquetConnectController, {FrisquetConnectAccessoryContext} from '../controller';
import {
  addAccessoryService,
  setupAccessoryIdentifyHandler,
  setupAccessoryInformationService,
  setupAccessoryTemperatureHistoryService
} from '../utils/accessory';
import {debugGet, debugGetResult, debugSetResult} from '../utils/debug';

export const setupThermostat = (
  accessory: PlatformAccessory,
  controller: FrisquetConnectController,
  HistoryService?: FakeGatoHistoryService
): void => {
  const {context} = accessory;

  const {deviceId} = context as FrisquetConnectAccessoryContext;
  setupAccessoryInformationService(accessory, controller);
  setupAccessoryIdentifyHandler(accessory, controller);

  // Add the actual accessory Service
  const service = addAccessoryService(accessory, Service.Thermostat, `${accessory.displayName}`);
  const {TargetHeatingCoolingState, CurrentHeatingCoolingState, TargetTemperature, CurrentTemperature} = Characteristic;

  service
    .getCharacteristic(CurrentHeatingCoolingState)
    .setProps({validValues: [0, 1]} as Partial<CharacteristicProps>) // [OFF, HEAT, COOL]
    .on(CharacteristicEventTypes.GET, async (callback: NodeCallback<CharacteristicValue>) => {
      debugGet(CurrentHeatingCoolingState, service);
      try {
        const {carac_zone: settings} = await controller.getZone(deviceId);
        assert(settings.CAMB, 'Missing `carac_zone.CAMB` value');
        assert(settings.TAMB, 'Missing `carac_zone.TAMB` value');
        const nextValue =
          settings.CAMB > settings.TAMB + DEFAULT_HEATING_DELTA
            ? CurrentHeatingCoolingState.HEAT
            : CurrentHeatingCoolingState.OFF;
        debugGetResult(CurrentHeatingCoolingState, service, nextValue);
        callback(null, nextValue);
      } catch (err) {
        callback(err);
      }
    });

  service
    .getCharacteristic(TargetHeatingCoolingState)
    .setProps({validValues: [0, 1]} as Partial<CharacteristicProps>) // [OFF, HEAT, COOL, AUTO]
    .on(CharacteristicEventTypes.GET, async (callback: NodeCallback<CharacteristicValue>) => {
      debugGet(TargetHeatingCoolingState, service);
      const HEATING_MODES = [
        6, // normal
        7 // réduit
      ];
      try {
        const {carac_zone: settings} = await controller.getZone(deviceId);
        assert(settings.MODE, 'Missing `carac_zone.MODE` value');
        const nextValue = HEATING_MODES.includes(settings.MODE)
          ? TargetHeatingCoolingState.HEAT
          : TargetHeatingCoolingState.OFF;
        debugGetResult(TargetHeatingCoolingState, service, nextValue);
        callback(null, nextValue);
      } catch (err) {
        callback(err);
      }
    })
    .on(CharacteristicEventTypes.SET, async (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
      // @TODO
      debugSetResult(TargetHeatingCoolingState, service, value);
      callback();
    });

  service
    .getCharacteristic(TargetTemperature)
    .on(CharacteristicEventTypes.GET, async (callback: NodeCallback<CharacteristicValue>) => {
      debugGet(TargetTemperature, service);
      try {
        const {carac_zone: settings} = await controller.getZone(deviceId);
        assert(settings.CAMB, 'Missing `carac_zone.CAMB` value');
        const nextValue = settings.CAMB / 10;
        debugGetResult(TargetTemperature, service, nextValue);
        callback(null, nextValue);
      } catch (err) {
        callback(err);
      }
    })
    .on(CharacteristicEventTypes.SET, async (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
      // @TODO
      debugSetResult(TargetTemperature, service, value);
      callback();
    });

  service
    .getCharacteristic(CurrentTemperature)
    .on(CharacteristicEventTypes.GET, async (callback: NodeCallback<CharacteristicValue>) => {
      debugGet(CurrentTemperature, service);
      try {
        const {carac_zone: settings} = await controller.getZone(deviceId);
        assert(settings.TAMB, 'Missing `carac_zone.TAMB` value');
        const nextValue = settings.TAMB / 10;
        debugGetResult(CurrentTemperature, service, nextValue);
        callback(null, nextValue);
      } catch (err) {
        callback(err);
      }
    });

  // Add the history Service
  setupAccessoryTemperatureHistoryService(accessory, controller, service, HistoryService);
};
