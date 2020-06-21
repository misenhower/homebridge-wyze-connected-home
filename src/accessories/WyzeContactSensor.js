const { Service, Characteristic } = require('../types');
const WyzeAccessory = require('./WyzeAccessory');

const HOMEBRIDGE_SERVICE = Service.ContactSensor;
const HOMEBRIDGE_CHARACTERISTIC = Characteristic.ContactSensorState;

module.exports = class WyzeContactSensor extends WyzeAccessory {
  constructor(plugin, homeKitAccessory) {
    super(plugin, homeKitAccessory);

    this.getOnCharacteristic().on('set', this.set.bind(this));
  }

  getSensorService() {
    this.plugin.log.debug(`[ContactSensor] Retrieving previous service for "${this.display_name}"`);
    let service = this.homeKitAccessory.getService(HOMEBRIDGE_SERVICE);

    if (!service) {
      this.plugin.log.debug(`[ContactSensor] Adding service for "${this.display_name}"`);
      service = this.homeKitAccessory.addService(HOMEBRIDGE_SERVICE);
    }

    return service;
  }

  getOnCharacteristic() {
    this.plugin.log.debug(`[ContactSensor] Fetching status of "${this.display_name}"`);
    return this.getSensorService().getCharacteristic(HOMEBRIDGE_CHARACTERISTIC);
  }

  updateCharacteristics(device) {
    this.plugin.log.debug(`[ContactSensor] Updating status of "${this.display_name}"`);
    this.getOnCharacteristic().updateValue(device.device_params.open_close_state);
  }
  
  async set(value, callback) {
    this.plugin.log.info(`Setting state of ${this.homeKitAccessory.context.mac} to ${value}`);

    try {
      await this.setProperty('open_close_state', (value) ? '1' : '0');
      callback();
    } catch (e) {
      callback(e);
    }
  }
};
