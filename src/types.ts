export interface SinopeDevice {
  id: number;
  identifier: string;
  name: string;
  location$id?: number;
  parentDevice$id?: number;
  sku: string;
  vendor: string;
}

export interface SinopeThermostatState {
  roomTemperature: RootTemperature;
  roomSetpoint: number;
  outputPercentDisplay: number;
  setpointMode: string;
}

export interface SinopeSwitchState {
  onOff: string;
}

export interface SinopeDimmerState {
  onOff: string;
  intensity: number;
}

export interface SinopeThermostatStateRequest {
  roomSetpoint?: number;
  setpointMode?: string;
}

export interface SinopeSwitchStateRequest {
  onOff?: string;
}

export interface SinopeDimmerStateRequest {
  onOff?: string;
  intensity?: number;
}

export interface RootTemperature {
  value: number;
}
