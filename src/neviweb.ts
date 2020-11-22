import { Logger } from 'homebridge';
import { NeviwebRestClient } from './rest-client';
import { SinopePlatformConfig } from './config';
import { SinopeDevice, SinopeDeviceState, SinopeDeviceStateRequest } from './types';

export class NeviwebApi {
  private readonly restClient = new NeviwebRestClient(this.config, this.log);

  constructor(
    private readonly config: SinopePlatformConfig,
    private readonly log: Logger,
  ) {}

  async login(): Promise<boolean>{
    return this.restClient.login();
  }

  async logout(): Promise<boolean> {
    return this.restClient.logout();
  }

  async fetchDevices() {
    return this.restClient.request<SinopeDevice[]>({
      url: this.config.url + '/devices',
      method: 'GET',
    });
  }

  async fetchDevice(id: number) {
    return this.restClient.request<SinopeDeviceState>({
      url: this.config.url + '/device/' + id +
        '/attribute?attributes=roomTemperature,outputPercentDisplay,setpointMode,alarmsActive0,roomSetpoint',
      method: 'GET',
    });
  }

  async updateDevice(id: number, data: SinopeDeviceStateRequest) {
    return this.restClient.request<SinopeDeviceState>({
      url: this.config.url + '/device/' + id + '/attribute',
      method: 'PUT',
      data: data,
    });
  }
}