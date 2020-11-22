export interface SinopeDevice {
  id: number;
  identifier: string;
  name: string;
  parentDevice$id?: number;
  sku: string;
  vendor: string;
}

export interface SinopeDeviceState {
  roomTemperature: RootTemperature;
  roomSetpoint: number;
  outputPercentDisplay: number;
  setpointMode: string;
}

export interface SinopeDeviceStateRequest {
  roomSetpoint?: number;
  setpointMode?: string;
}

export interface RootTemperature {
  value: number;
}