import { Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback } from 'homebridge';

import { SinopeDevice, SinopeDeviceState } from './types';
import { SinopePlatform } from './platform';

// Neviweb API polling interval, in seconds
const POLLING_INTERVAL = 10;

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class SinopeAccessory {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private state = {
    CurrentTemperature: 0,
    TargetTemperature: 0,
    CurrentHeatingCoolingState: 0,
    TargetHeatingCoolingState: 0,
  };

  constructor(
    private readonly platform: SinopePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: SinopeDevice,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.device.vendor)
      .setCharacteristic(this.platform.Characteristic.Model, this.device.sku)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.identifier);

    // create a new Thermostat service
    this.service = this.accessory.getService(this.platform.Service.Thermostat)
    || this.accessory.addService(this.platform.Service.Thermostat);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.name);

    // create handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.CurrentHeatingCoolingState)
      .on('get', this.handleCurrentHeatingCoolingStateGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .on('get', this.handleTargetHeatingCoolingStateGet.bind(this))
      .on('set', this.handleTargetHeatingCoolingStateSet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .on('get', this.handleCurrentTemperatureGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .on('get', this.handleTargetTemperatureGet.bind(this))
      .on('set', this.handleTargetTemperatureSet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
      .on('get', this.handleTemperatureDisplayUnitsGet.bind(this))
      .on('set', this.handleTemperatureDisplayUnitsSet.bind(this));

    this.updateState();
    setInterval(() => {
      this.updateState();
    }, POLLING_INTERVAL * 1000);
  }

  /**
   * Handle requests to get the current value of the "Current Heating Cooling State" characteristic
   */
  handleCurrentHeatingCoolingStateGet(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Triggered GET CurrentHeatingCoolingState');

    // HEAT = 1
    // const currentValue = 1;

    callback(null, this.state.CurrentHeatingCoolingState);
  }


  /**
   * Handle requests to get the current value of the "Target Heating Cooling State" characteristic
   */
  handleTargetHeatingCoolingStateGet(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Triggered GET TargetHeatingCoolingState');

    // HEAT = 1
    // const currentValue = 1;

    callback(null, this.state.TargetHeatingCoolingState);
  }

  /**
   * Handle requests to set the "Target Heating Cooling State" characteristic
   */
  handleTargetHeatingCoolingStateSet(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.platform.log.debug('Triggered SET TargetHeatingCoolingState:' + value);

    callback(null);
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  handleCurrentTemperatureGet(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Triggered GET CurrentTemperature');

    // set this to a valid value for CurrentTemperature
    // const currentValue = 1;

    callback(null, this.state.CurrentTemperature);
  }


  /**
   * Handle requests to get the current value of the "Target Temperature" characteristic
   */
  handleTargetTemperatureGet(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Triggered GET TargetTemperature');

    // set this to a valid value for TargetTemperature
    // const currentValue = 1;

    callback(null, this.state.TargetTemperature);
  }

  /**
   * Handle requests to set the "Target Temperature" characteristic
   */
  handleTargetTemperatureSet(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.platform.log.debug('Triggered SET TargetTemperature:' + value);

    callback(null);
  }

  /**
   * Handle requests to get the current value of the "Temperature Display Units" characteristic
   */
  handleTemperatureDisplayUnitsGet(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Triggered GET TemperatureDisplayUnits');

    // set this to a valid value for TemperatureDisplayUnits
    const currentValue = 1;

    callback(null, currentValue);
  }

  /**
   * Handle requests to set the "Temperature Display Units" characteristic
   */
  handleTemperatureDisplayUnitsSet(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.platform.log.debug('Triggered SET TemperatureDisplayUnits:' + value);

    callback(null);
  }

  async updateState() {
    let state: SinopeDeviceState;
    try {
      state = await this.platform.neviweb.fetchDevice(this.device.id);
      this.platform.log.debug('fetched update for device %s from Neviweb API: %s', this.device.name, JSON.stringify(state));

      this.state.CurrentTemperature = state.roomTemperature.value;
      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentTemperature,
        state.roomTemperature.value,
      );

      this.state.TargetTemperature = state.roomSetpoint;
      this.service.updateCharacteristic(
        this.platform.Characteristic.TargetTemperature,
        state.roomSetpoint,
      );

      if (state.outputPercentDisplay > 0) {
        this.state.CurrentHeatingCoolingState = 1;
      } else {
        this.state.CurrentHeatingCoolingState = 0;
      }
      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentHeatingCoolingState,
        this.state.CurrentHeatingCoolingState,
      );

      // if (state.setpointMode === 'auto') {
      //   this.state.TargetHeatingCoolingState = 3;
      // } else {
      //   this.state.TargetHeatingCoolingState = 1;
      // }
      this.state.TargetHeatingCoolingState = 1;
      this.service.updateCharacteristic(
        this.platform.Characteristic.TargetHeatingCoolingState,
        this.state.TargetHeatingCoolingState,
      );


    } catch(error) {
      this.platform.log.error('could not fetch update for device %s from Neviweb API', this.device.name);
    }
  }
}
