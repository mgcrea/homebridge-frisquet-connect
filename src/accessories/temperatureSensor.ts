import assert from "assert";
import { FakeGatoHistoryService } from "fakegato-history";
import type { PlatformAccessory } from "homebridge";
import FrisqueConnectController, { FrisquetConnectAccessoryContext } from "../controller";
import {
  addAccessoryService,
  setupAccessoryIdentifyHandler,
  setupAccessoryInformationService,
  setupAccessoryTemperatureHistoryService,
} from "../utils/accessory";
import { debugGet, debugGetResult } from "../utils/debug";
import { Characteristic, Service } from "../utils/hap";

export const setupTemperatureSensor = (
  accessory: PlatformAccessory,
  controller: FrisqueConnectController,
  HistoryService?: FakeGatoHistoryService,
): void => {
  const { context } = accessory;

  const { deviceId } = context as FrisquetConnectAccessoryContext;
  setupAccessoryInformationService(accessory, controller);
  setupAccessoryIdentifyHandler(accessory, controller);

  // Add the actual accessory Service
  const service = addAccessoryService(accessory, Service.TemperatureSensor, accessory.displayName);
  const { CurrentTemperature } = Characteristic;

  service.getCharacteristic(CurrentTemperature).onGet(async () => {
    debugGet(CurrentTemperature, service);
    const temperature = await controller.getEnvironment(deviceId);
    assert(temperature, "Missing environment temperature");
    const nextValue = temperature / 10;
    debugGetResult(CurrentTemperature, service, nextValue);
    return nextValue;
  });

  // Add the history Service
  setupAccessoryTemperatureHistoryService(accessory, controller, service, HistoryService);
};
