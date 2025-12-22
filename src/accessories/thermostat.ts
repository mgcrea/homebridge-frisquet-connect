import assert from "assert";
import { FakeGatoHistoryService } from "fakegato-history";
import type { PlatformAccessory } from "homebridge";
import { DEFAULT_HEATING_DELTA } from "../config/env";
import FrisquetConnectController, { FrisquetConnectAccessoryContext } from "../controller";
import {
  addAccessoryService,
  setupAccessoryIdentifyHandler,
  setupAccessoryInformationService,
  setupAccessoryTemperatureHistoryService,
} from "../utils/accessory";
import { debugGet, debugGetResult, debugSetResult } from "../utils/debug";
import { Characteristic, CharacteristicProps, CharacteristicValue, Service } from "../utils/hap";

export const setupThermostat = (
  accessory: PlatformAccessory,
  controller: FrisquetConnectController,
  HistoryService?: FakeGatoHistoryService,
): void => {
  const { context } = accessory;

  const { deviceId } = context as FrisquetConnectAccessoryContext;
  setupAccessoryInformationService(accessory, controller);
  setupAccessoryIdentifyHandler(accessory, controller);

  // Add the actual accessory Service
  const service = addAccessoryService(accessory, Service.Thermostat, accessory.displayName);
  const { TargetHeatingCoolingState, CurrentHeatingCoolingState, TargetTemperature, CurrentTemperature } =
    Characteristic;

  service
    .getCharacteristic(CurrentHeatingCoolingState)
    .setProps({ validValues: [0, 1] } as Partial<CharacteristicProps>) // [OFF, HEAT, COOL]
    .onGet(async () => {
      debugGet(CurrentHeatingCoolingState, service);
      const { carac_zone: settings } = await controller.getZone(deviceId);
      assert(settings.CAMB, "Missing `carac_zone.CAMB` value");
      assert(settings.TAMB, "Missing `carac_zone.TAMB` value");
      const nextValue =
        settings.CAMB > settings.TAMB + DEFAULT_HEATING_DELTA
          ? CurrentHeatingCoolingState.HEAT
          : CurrentHeatingCoolingState.OFF;
      debugGetResult(CurrentHeatingCoolingState, service, nextValue);
      return nextValue;
    });

  service
    .getCharacteristic(TargetHeatingCoolingState)
    .setProps({ validValues: [0, 1] } as Partial<CharacteristicProps>) // [OFF, HEAT, COOL, AUTO]
    .onGet(async () => {
      debugGet(TargetHeatingCoolingState, service);
      const HEATING_MODES = [
        6, // normal
        7, // réduit
      ];
      const { carac_zone: settings } = await controller.getZone(deviceId);
      assert(settings.MODE, "Missing `carac_zone.MODE` value");
      const nextValue = HEATING_MODES.includes(settings.MODE)
        ? TargetHeatingCoolingState.HEAT
        : TargetHeatingCoolingState.OFF;
      debugGetResult(TargetHeatingCoolingState, service, nextValue);
      return nextValue;
    })
    .onSet((value: CharacteristicValue) => {
      // @TODO
      debugSetResult(TargetHeatingCoolingState, service, value);
    });

  service
    .getCharacteristic(TargetTemperature)
    .onGet(async () => {
      debugGet(TargetTemperature, service);
      const { carac_zone: settings } = await controller.getZone(deviceId);
      assert(settings.CAMB, "Missing `carac_zone.CAMB` value");
      const nextValue = settings.CAMB / 10;
      debugGetResult(TargetTemperature, service, nextValue);
      return nextValue;
    })
    .onSet((value: CharacteristicValue) => {
      // @TODO
      debugSetResult(TargetTemperature, service, value);
    });

  service.getCharacteristic(CurrentTemperature).onGet(async () => {
    debugGet(CurrentTemperature, service);
    const { carac_zone: settings } = await controller.getZone(deviceId);
    assert(settings.TAMB, "Missing `carac_zone.TAMB` value");
    const nextValue = settings.TAMB / 10;
    debugGetResult(CurrentTemperature, service, nextValue);
    return nextValue;
  });

  // Add the history Service
  setupAccessoryTemperatureHistoryService(accessory, controller, service, HistoryService);
};
