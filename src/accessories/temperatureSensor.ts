import assert from 'assert';
import {FakeGatoHistoryService} from 'fakegato-history';
import {Characteristic, CharacteristicEventTypes, CharacteristicValue, NodeCallback, Service} from 'hap-nodejs';
import type {PlatformAccessory} from 'homebridge';
import FrisqueConnectController, {FrisquetConnectAccessoryContext} from 'src/controller';
import {
  addAccessoryService,
  setupAccessoryIdentifyHandler,
  setupAccessoryInformationService,
  setupAccessoryTemperatureHistoryService
} from 'src/utils/accessory';
import {debugGet, debugGetResult} from 'src/utils/debug';

export const setupTemperatureSensor = (
  accessory: PlatformAccessory,
  controller: FrisqueConnectController,
  HistoryService?: FakeGatoHistoryService
): void => {
  const {context} = accessory;

  const {deviceId} = context as FrisquetConnectAccessoryContext;
  setupAccessoryInformationService(accessory, controller);
  setupAccessoryIdentifyHandler(accessory, controller);

  // Add the actual accessory Service
  const service = addAccessoryService(accessory, Service.TemperatureSensor, `${accessory.displayName}`);
  const {CurrentTemperature} = Characteristic;

  service
    .getCharacteristic(CurrentTemperature)
    .on(CharacteristicEventTypes.GET, async (callback: NodeCallback<CharacteristicValue>) => {
      debugGet(CurrentTemperature, service);
      try {
        const temperature = await controller.getEnvironment(deviceId);
        assert(temperature, 'Missing environment temperature');
        const nextValue = temperature / 10;
        debugGetResult(CurrentTemperature, service, nextValue);
        callback(null, nextValue);
      } catch (err) {
        callback(err);
      }
    });

  // Add the history Service
  setupAccessoryTemperatureHistoryService(accessory, controller, service, HistoryService);
};
