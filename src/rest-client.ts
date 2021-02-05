import { Logger } from 'homebridge';
import axios from 'axios';
import { AxiosRequestConfig } from 'axios';
import { SinopePlatformConfig } from './config';
import AsyncLock from 'async-lock';

const tokenExpiration = (9.5*60*1000);
const CLIENT_KEY = 'rest-client';

export class NeviwebRestClient {
  private access = '';
  private iat = 0;
  private refresh = '';
  private connected = false;
  private lock = new AsyncLock({ timeout: 5000 });

  constructor(
    private readonly config: SinopePlatformConfig,
    private readonly log: Logger,
  ) {}

  async login(): Promise<boolean> {
    this.log.debug('login with config ' + JSON.stringify(this.config));
    
    const req: AxiosRequestConfig = {
      method: 'POST',
      url: this.config.url + '/login',
      data: {
        username: this.config.username,
        password: this.config.password,
        interface: 'neviweb',
        stayConnected: 1,
      },
    };

    try {
      const response = await axios(req);
      if (response.data.error) {
        throw response.data.error;
      }

      this.access = response.data.session;
      this.iat = response.data.iat;
      this.refresh = response.data.refreshToken;
      this.connected = true;
      return true;
    } catch(error) {
      if (error.code) {
        switch(error.code) {
          case 'ACCSESSEXC': {
            this.log.error('too many session open on the neviweb API, please retry in 10 minutes');
            break;
          }
          case 'USRLOCKED':
          case 'USRMAXLOGRETRY': {
            this.log.error('too many authentication attempt failed, the account is currently locked');
            break;
          }   
        }
        return false;
      }

      this.log.error('could not authenticate against the neviweb API (error ' + JSON.stringify(error) + ')');
      return false;
    }
    
    // if (this.auth.iat && this.auth.iat + tokenExpiration > Date.now()) {
    //   this.log.debug('the neviweb session is still active,');
    // }
  }

  async connect(): Promise<boolean> {
    this.log.debug('renewing the access token with the refresh token');
    
    const req: AxiosRequestConfig = {
      method: 'POST',
      url: this.config.url + '/connect',
      headers: {
        refreshToken: this.refresh,
      },
    };

    try {
      const response = await axios(req);
      if (response.data.error) {
        throw response.data.error;
      }

      this.access = response.data.session;
      this.iat = response.data.iat;
      this.refresh = response.data.refreshToken;
      this.connected = true;

      this.log.debug('successfully renewed the neviweb session');

      return true;
    } catch(error) {
      if (error.code) {
        switch(error.code) {
          case 'ACCSESSEXC': {
            this.log.error('too many session open on the neviweb API, please retry in 10 minutes');
            break;
          }
          case 'USRLOCKED':
          case 'USRMAXLOGRETRY': {
            this.log.error('too many authentication attempt failed, the account is currently locked');
            break;
          }
          case 'USRSESSEXP': {
            this.log.error('the neviweb session expired');
            break;
          }
        }
      }

      this.log.error('could not reconnect against the neviweb API (error ' + JSON.stringify(error) + ')');
      return false;
    }
  }

  async logout(): Promise<boolean> {
    const req: AxiosRequestConfig = {
      method: 'GET',
      url: this.config.url + '/logout',
      headers: {
        'session-id': this.access,
        refreshToken: this.refresh,
      },
    };

    try {
      const response = await axios(req);
      if (!response.data.success) {
        throw response.data;
      }

      this.connected = false;
      return true;
    } catch(error) {
      this.log.debug('unexpected error while logging out: ' + JSON.stringify(error));
    }

    return false;
  }

  async request<T = void>(options: AxiosRequestConfig & { url: string }): Promise<T> {
    this.log.debug('requesting ' + options.url);

    if (!this.connected) {
      this.log.warn('no longer connected to the Neviweb API, ignoring this request');
      //await this.lock.acquire(CLIENT_KEY, async () => {
      //  await this.logout();
      //  await this.login();
      //});
      throw new Error('expired session');
    }

    // Require the lock to be acquired when determining whether the session is still valid, and optionally renewing it
    await this.lock.acquire(CLIENT_KEY, async () => {
      if (Date.now() >= this.iat+tokenExpiration) {
        this.log.debug('the neviweb session expired, renewing it first...');
        const connected = await this.connect();
        if (!connected) {
          this.log.error('the session expired and could not be renewed, abording this request');
          this.connected = false;
          throw new Error('expired session');
        }
      }
    });

    // TODO(palourde): Verify that the access token is still valid with this.iat and optionally refresh it with this.refresh
    if (!options.headers) {
      options.headers = {};
    }
    options.headers['session-id'] = this.access;

    try {
      const response = await axios(options);
      this.log.debug('received ' + JSON.stringify(response.data));

      if (response.data.error) {
        throw response.data;
      }

      const data = response.data as T;
      return data;

      // return true;
    } catch(error) {
      this.log.debug('unexpected error during request: ' + JSON.stringify(error));
      throw error;
    }
  }
}
