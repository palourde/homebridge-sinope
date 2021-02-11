import { Logger } from 'homebridge';
import { NeviwebRestClient } from './rest-client';
import { SinopePlatformConfig } from './config';
import { SinopeDevice, SinopeThermostatState, SinopeThermostatStateRequest, SinopeSwitchState, SinopeSwitchStateRequest, 
  SinopeDimmerState, SinopeDimmerStateRequest } from './types';
import Queue from 'async-await-queue';

const myPriority = -1;

export class NeviwebApi {
  private readonly restClient = new NeviwebRestClient(this.config, this.log);
  private myq = new Queue(1, 120);


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
      //url: this.config.url + '/devices' + '?location$id=' + this.config.locationid,
      url: this.config.url + '/devices' + ((this.config.locationid !== undefined) ? '?location$id=' + this.config.locationid : ''),
      method: 'GET',
    });
  }

  async fetchThermostat(id: number) {
    return this.restClient.request<SinopeThermostatState>({
      url: this.config.url + '/device/' + id +
        '/attribute?attributes=roomTemperature,outputPercentDisplay,setpointMode,alarmsActive0,roomSetpoint',
      method: 'GET',
    });
  }

  async fetchSwitch(id: number) {
    return this.restClient.request<SinopeSwitchState>({
      url: this.config.url + '/device/' + id +
        '/attribute?attributes=onOff',
      method: 'GET',
    });
  }

  async fetchDimmer(id: number) {
    return this.restClient.request<SinopeDimmerState>({
      url: this.config.url + '/device/' + id +
        '/attribute?attributes=onOff,intensity',
      method: 'GET',
    });
  }

  async updateThermostat(id: number, data: SinopeThermostatStateRequest) {
    return this.restClient.request<SinopeThermostatState>({
      url: this.config.url + '/device/' + id + '/attribute',
      method: 'PUT',
      data: data,
    });
  }

  async updateSwitch(id: number, data: SinopeSwitchStateRequest) {
    const me = Symbol();
    await this.myq.wait(me, myPriority);
    const reqresult = this.restClient.request<SinopeSwitchState>({
      url: this.config.url + '/device/' + id + '/attribute',
      method: 'PUT',
      data: data,
    });
    this.myq.end(me);
    return reqresult;
  }

  async updateDimmer(id: number, data: SinopeDimmerStateRequest) {
    const me = Symbol();
    await this.myq.wait(me, myPriority);
    const reqresult = this.restClient.request<SinopeDimmerState>({
      url: this.config.url + '/device/' + id + '/attribute',
      method: 'PUT',
      data: data,
    });
    this.myq.end(me);
    return reqresult;
  }
}
