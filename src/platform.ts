import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { SinopeThermostatAccessory, SinopeSwitchAccessory, SinopeDimmerAccessory } from './platformAccessory';
// import { SinopeDevice } from './types';
import { SinopePlatformConfig } from './config';
import { NeviwebApi } from './neviweb';
// import { NeviwebConfig } from './rest-client';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class SinopePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  public readonly neviweb: NeviwebApi;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig & SinopePlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    // let sinopeConfig: SinopePlatformConfig;
    // const sinopeConfig = this.config;

    this.neviweb = new NeviwebApi(this.config, log);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', async () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      await this.discoverDevices();
    });

    this.api.on('shutdown', () => {
      this.shutdown();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    const connected = await this.neviweb.login();
    if (!connected) {
      this.log.error('could not authenticate to the neviweb API');
      return;
    }
    this.log.info('successfully authenticated to the neviweb API');

    const devices = await this.neviweb.fetchDevices();
    this.log.debug('found the following devices: ' + JSON.stringify(devices));

    // Gateways are now returned in the list of devices so we need to
    // filter these out.
    // TODO(palourde): There must be a more reliable way of doing this than
    // looking at the parentDevice$id field
    const thermostats = devices.filter(device => device.sku.substring(0,2) == "TH");
    const dimmers = devices.filter(device => device.sku.substring(0,2) == "DM");
    const switchesregex = new RegExp("^SW|^SP|^RM", 'g');
    const switches = devices.filter(device => { return device.sku.match(switchesregex) } );

    // loop over the discovered devices and register each one if it has not already been registered
    for (const thermostat of thermostats) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(thermostat.identifier);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        if (thermostat) {
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          // this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          new SinopeThermostatAccessory(this, existingAccessory, thermostat);
          
          // update accessory cache with any changes to the accessory details and information
          this.api.updatePlatformAccessories([existingAccessory]);
        } else if (!thermostat) {
          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // remove platform accessories when no longer present
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        }
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', thermostat.name);

        // create a new accessory
        const accessory = new this.api.platformAccessory(thermostat.name, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = thermostat;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new SinopeThermostatAccessory(this, accessory, thermostat);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }

//---
    for (const aswitch of switches) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(aswitch.identifier);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        if (aswitch) {
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          // this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          new SinopeSwitchAccessory(this, existingAccessory, aswitch);
          
          // update accessory cache with any changes to the accessory details and information
          this.api.updatePlatformAccessories([existingAccessory]);
        } else if (!aswitch) {
          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // remove platform accessories when no longer present
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        }
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', aswitch.name);

        // create a new accessory
        const accessory = new this.api.platformAccessory(aswitch.name, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = aswitch;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new SinopeSwitchAccessory(this, accessory, aswitch);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
//---

//---
    for (const dimmer of dimmers) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(dimmer.identifier);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        if (dimmer) {
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          // this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          new SinopeSwitchAccessory(this, existingAccessory, dimmer);
          
          // update accessory cache with any changes to the accessory details and information
          this.api.updatePlatformAccessories([existingAccessory]);
        } else if (!dimmer) {
          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // remove platform accessories when no longer present
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        }
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', dimmer.name);

        // create a new accessory
        const accessory = new this.api.platformAccessory(dimmer.name, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = dimmer;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new SinopeDimmerAccessory(this, accessory, dimmer);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
//---

    // this.updateDevices(thermostats);
  }

  // private async updateDevices(devices: SinopeDevice[]) {
  //   for (const device of devices) {
  //     // const uuid = this.api.hap.uuid.generate(device.UUID);
  //     // this.accessories.get();
  //     this.log.debug('device = ' + JSON.stringify(device));

  //     const uuid = this.api.hap.uuid.generate(device.identifier);
  //     const accessory = this.accessories.find(accessory => accessory.UUID === uuid);
      
  //     if (accessory) {
  //       const state = this.neviweb.fetchDevice(device.id);
  //       this.log.debug(JSON.stringify(state));
  //       accessory.context.device.update(state);
  //       // accessory.
  //     } else {
  //       this.log.error('could not find Homebridge devic with UUID (%s) for Sinope device (%s)', uuid, device.name);
  //     }

      
  //     // accessory.updateAccessory(state);
  //     // accessory.
  //   }
  // }

  async shutdown() {
    const loggedOut = await this.neviweb.logout();
    if (!loggedOut) {
      this.log.error('could not log out from the neviweb API');
      return;
    }
    this.log.info('successfully logged out from the neviweb API');
  }
}
