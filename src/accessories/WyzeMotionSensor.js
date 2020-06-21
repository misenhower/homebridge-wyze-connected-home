const { Service, Characteristic } = require('../types');
const WyzeAccessory = require('./WyzeAccessory');

const HOMEBRIDGE_SERVICE = Service.MotionSensor;
const HOMEBRIDGE_CHARACTERISTIC = Characteristic.MotionDetected;

module.exports = class WyzeMotionSensor extends WyzeAccessory {
  constructor(plugin, homeKitAccessory) {
    super(plugin, homeKitAccessory);

    this.getOnCharacteristic().on('set', this.set.bind(this));
  }

  getSensorService() {
    this.plugin.log.debug(`[MotionSensor] Retrieving previous service for "${this.display_name}"`);
    let service = this.homeKitAccessory.getService(HOMEBRIDGE_SERVICE);

    if (!service) {
      this.plugin.log.debug(`[MotionSensor] Adding service for "${this.display_name}"`);
      service = this.homeKitAccessory.addService(HOMEBRIDGE_SERVICE);
    }

    return service;
  }

  getOnCharacteristic() {
    this.plugin.log.debug(`[MotionSensor] Fetching status of "${this.display_name}"`);
    return this.getSensorService().getCharacteristic(HOMEBRIDGE_CHARACTERISTIC);
  }

  updateCharacteristics(device) {
    this.plugin.log.debug(`[MotionSensor] Updating status of "${this.display_name}"`);
    this.getOnCharacteristic().updateValue(device.device_params.motion_state);
  }
  
  async set(value, callback) {
    this.plugin.log.info(`Setting state of ${this.homeKitAccessory.context.mac} to ${value}`);

    try {
      await this.setProperty('motion_state', (value) ? '1' : '0');
      callback();
    } catch (e) {
      callback(e);
    }
  }
};
