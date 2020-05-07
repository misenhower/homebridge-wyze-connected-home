const { Service, Characteristic } = require('../types');

module.exports = class WyzeAccessory {
  constructor(plugin, homeKitAccessory) {
    this.plugin = plugin;
    this.homeKitAccessory = homeKitAccessory;
  }

  get mac() {
    return this.homeKitAccessory.context.mac;
  }

  get product_type() {
    return this.homeKitAccessory.context.product_type;
  }

  get product_model() {
    return this.homeKitAccessory.context.product_model;
  }

  /** Determines whether this accessory matches the given Wyze device */
  matches(device) {
    return this.mac === device.mac;
  }

  update(device) {
    this.homeKitAccessory.context = {
      mac: device.mac,
      product_type: device.product_type,
      product_model: device.product_model,
    };

    this.homeKitAccessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, device.nickname)
      .setCharacteristic(Characteristic.Manufacturer, 'Wyze')
      .setCharacteristic(Characteristic.Model, device.product_model)
      .setCharacteristic(Characteristic.SerialNumber, device.mac);
  }
};
