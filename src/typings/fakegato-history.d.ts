declare module "fakegato-history" {
  export declare type FakeGatoAccessoryType =
    | "weather"
    | "energy"
    | "room"
    | "door"
    | "motion"
    | "switch"
    | "thermo"
    | "aqua";
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  export declare class FakeGatoHistoryService {
    constructor(accessoryType: FakeGatoAccessoryType, accessory: PlatformAccessory);
  }
  export default function historyServiceFactory(homebridge: unknown): FakeGatoHistoryService;
}
