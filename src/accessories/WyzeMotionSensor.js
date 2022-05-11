const { Service, Characteristic } = require('../types');
const WyzeAccessory = require('./WyzeAccessory');

const HOMEBRIDGE_SERVICE = Service.MotionSensor;
const HOMEBRIDGE_CHARACTERISTIC = Characteristic.MotionDetected;

module.exports = class WyzeMotionSensor extends WyzeAccessory {
  constructor(plugin, homeKitAccessory) {
    super(plugin, homeKitAccessory);

    this.getOnCharacteristic();
  }

  getSensorService() {
    let service = this.homeKitAccessory.getService(HOMEBRIDGE_SERVICE);

    if (!service) {
      service = this.homeKitAccessory.addService(HOMEBRIDGE_SERVICE);
    }

    return service;
  }

  getOnCharacteristic() {
    return this.getSensorService().getCharacteristic(HOMEBRIDGE_CHARACTERISTIC);
  }

  updateCharacteristics(device) {
    this.getOnCharacteristic().updateValue(device.device_params.motion_state);
  }
};
