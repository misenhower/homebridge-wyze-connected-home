const { Service, Characteristic } = require('../types');
const WyzeAccessory = require('./WyzeAccessory');

const WYZE_API_POWER_PROPERTY = 'P3';
const WYZE_API_BRIGHTNESS_PROPERTY = 'P1501';
const WYZE_API_COLOR_TEMP_PROPERTY = 'P1502';

const WYZE_COLOR_TEMP_MIN = 2700;
const WYZE_COLOR_TEMP_MAX = 6500;
const HOMEKIT_COLOR_TEMP_MIN = 500;
const HOMEKIT_COLOR_TEMP_MAX = 140;

module.exports = class WyzeLight extends WyzeAccessory {
  constructor(plugin, homeKitAccessory) {
    super(plugin, homeKitAccessory);

    this.getCharacteristic(Characteristic.On).on('set', this.setOn.bind(this));
    this.getCharacteristic(Characteristic.Brightness).on('set', this.setBrightness.bind(this));
    this.getCharacteristic(Characteristic.ColorTemperature).on('set', this.setColorTemperature.bind(this));
  }

  async updateCharacteristics(device) {
    this.getCharacteristic(Characteristic.On).updateValue(device.device_params.switch_state);

    let propertyList = await this.getPropertyList();
    for (let property of propertyList.data.property_list) {
      switch (property.pid) {
        case WYZE_API_BRIGHTNESS_PROPERTY:
          this.updateBrightness(property.value);
          break;

        case WYZE_API_COLOR_TEMP_PROPERTY:
          this.updateColorTemp(property.value);
          break;
      }
    }
  }

  updateBrightness(value) {
    this.getCharacteristic(Characteristic.Brightness).updateValue(value);
  }

  updateColorTemp(value) {
    let floatValue = this._rangeToFloat(value, WYZE_COLOR_TEMP_MIN, WYZE_COLOR_TEMP_MAX);
    let homeKitValue = this._floatToRange(floatValue, HOMEKIT_COLOR_TEMP_MIN, HOMEKIT_COLOR_TEMP_MAX);
    this.getCharacteristic(Characteristic.ColorTemperature).updateValue(homeKitValue);
  }

  getService() {
    let service = this.homeKitAccessory.getService(Service.Lightbulb);

    if (!service) {
      service = this.homeKitAccessory.addService(Service.Lightbulb);
    }

    return service;
  }

  getCharacteristic(characteristic) {
    return this.getService().getCharacteristic(characteristic);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async setOn(value, callback) {
    this.plugin.log.info(`Setting power for ${this.homeKitAccessory.context.mac} to ${value}`);

    try {
      await this.setProperty(WYZE_API_POWER_PROPERTY, (value) ? '1' : '0');
      callback();
    } catch (e) {
      callback(e);
    }
  }

  async setBrightness(value, callback) {
    await this.sleep(500);
    this.plugin.log.info(`Setting brightness for ${this.homeKitAccessory.context.mac} to ${value}`);

    try {
      await this.setProperty(WYZE_API_BRIGHTNESS_PROPERTY, value);
      callback();
    } catch (e) {
      callback(e);
    }
  }

  async setColorTemperature(value, callback) {
    await this.sleep(1000);

    let floatValue = this._rangeToFloat(value, HOMEKIT_COLOR_TEMP_MIN, HOMEKIT_COLOR_TEMP_MAX);
    let wyzeValue = this._floatToRange(floatValue, WYZE_COLOR_TEMP_MIN, WYZE_COLOR_TEMP_MAX);

    this.plugin.log.info(`Setting color temperature for ${this.homeKitAccessory.context.mac} to ${value} (${wyzeValue})`);

    try {
      await this.setProperty(WYZE_API_COLOR_TEMP_PROPERTY, wyzeValue);
      callback();
    } catch (e) {
      callback(e);
    }
  }

  _rangeToFloat(value, min, max) {
    return (value - min) / (max - min);
  }

  _floatToRange(value, min, max) {
    return Math.round((value * (max - min)) + min);
  }
};
