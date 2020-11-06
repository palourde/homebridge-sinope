import { Logger } from 'homebridge';
import { NeviwebRestClient } from './rest-client';
import { SinopePlatformConfig } from './config';
import { SinopeDevice } from './types';

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

  // async fetchLocations() {}

  async fetchDevices() {
    return this.restClient.request<SinopeDevice[]>({
      url: this.config.url + '/devices',
      method: 'GET',
    });
  }
}