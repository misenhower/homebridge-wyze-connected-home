const { Service, Characteristic } = require('../types');
const WyzeAccessory = require('./WyzeAccessory');

const WYZE_API_POWER_PROPERTY = 'P3';
const WYZE_API_BRIGHTNESS_PROPERTY = 'P1501';
const WYZE_API_COLOR_TEMP_PROPERTY = 'P1502';
const WYZE_API_COLOR_PROPERTY = 'P1507';

const WYZE_COLOR_TEMP_MIN = 1800;
const WYZE_COLOR_TEMP_MAX = 6500;
const HOMEKIT_COLOR_TEMP_MIN = 500;
const HOMEKIT_COLOR_TEMP_MAX = 140;

module.exports = class WyzeMeshLight extends WyzeAccessory {
  constructor(plugin, homeKitAccessory) {
    super(plugin, homeKitAccessory);

    this.getCharacteristic(Characteristic.On).on('set', this.setOn.bind(this));
    this.getCharacteristic(Characteristic.Brightness).on('set', this.setBrightness.bind(this));
    this.getCharacteristic(Characteristic.ColorTemperature).on('set', this.setColorTemperature.bind(this));
    this.getCharacteristic(Characteristic.Hue).on('set', this.setHue.bind(this));
    this.getCharacteristic(Characteristic.Saturation).on('set', this.setSaturation.bind(this));

    // Local caching of HSL color space handling separate Hue & Saturation on HomeKit
    // Caching idea for handling HSL colors from:
    //    https://github.com/QuickSander/homebridge-http-rgb-push/blob/master/index.js
    this.cache = {};
    this.cacheUpdated = false;
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

        case WYZE_API_COLOR_PROPERTY:
          this.updateColor(property.value);
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

  updateColor(value) {
    // Convert a Hex color from Wyze into the HSL values recognized by HomeKit.
    let hslValue = this._hexToHSL(value);
    this.plugin.log.debug(`Updating color record for ${this.homeKitAccessory.context.mac} to ${value}: ${JSON.stringify(hslValue)}`)

    // Update Hue
    this.updateHue(hslValue.h);
    this.cache.hue = hslValue.h;

    // Update Saturation
    this.updateSaturation(hslValue.s);
    this.cache.saturation = hslValue.s;

    this.cache.brightness = hslValue.l;
  }

  updateHue(value) {
    this.getCharacteristic(Characteristic.Hue).updateValue(value);
  }

  updateSaturation(value) {
    this.getCharacteristic(Characteristic.Saturation).updateValue(value);
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

  async setOn(value, callback) {
    this.plugin.log.info(`Setting power for ${this.homeKitAccessory.context.mac} to ${value}`);

    try {
      await this.runActionList(WYZE_API_POWER_PROPERTY, (value) ? '1' : '0');
      callback();
    } catch (e) {
      callback(e);
    }
  }

  async setBrightness(value, callback) {
    this.plugin.log.info(`Setting brightness for ${this.homeKitAccessory.context.mac} to ${value}`);

    try {
      await this.runActionList(WYZE_API_BRIGHTNESS_PROPERTY, value);
      this.cache.brightness = value;
      callback();
    } catch (e) {
      callback(e);
    }
  }

  async setColorTemperature(value, callback) {
    let floatValue = this._rangeToFloat(value, HOMEKIT_COLOR_TEMP_MIN, HOMEKIT_COLOR_TEMP_MAX);
    let wyzeValue = this._floatToRange(floatValue, WYZE_COLOR_TEMP_MIN, WYZE_COLOR_TEMP_MAX);

    this.plugin.log.info(`Setting color temperature for ${this.homeKitAccessory.context.mac} to ${value} (${wyzeValue})`);

    try {
      await this.runActionList(WYZE_API_COLOR_TEMP_PROPERTY, wyzeValue);
      callback();
    } catch (e) {
      callback(e);
    }
  }

  async setHue(value, callback) {
    this.plugin.log.info(`Setting hue (color) for ${this.homeKitAccessory.context.mac} to ${value}`);
    this.plugin.log.debug(`(H)SL Values: ${value}, ${this.cache.saturation}, ${this.cache.brightness}`);

    try {
      this.cache.hue = value;
      if (this.cacheUpdated) {
        let hexValue = this._HSLToHex(this.cache.hue, this.cache.saturation, this.cache.brightness);
        hexValue = hexValue.replace("#", "");
        this.plugin.log.info(hexValue);

        await this.runActionList(WYZE_API_COLOR_PROPERTY, hexValue);
        this.cacheUpdated = false;
      } else {
        this.cacheUpdated = true;
      }
      callback();
    } catch (e) {
      callback(e);
    }
  }

  async setSaturation(value, callback) {
    this.plugin.log.info(`Setting saturation (color) for ${this.homeKitAccessory.context.mac} to ${value}`);
    this.plugin.log.debug(`H(S)L Values: ${value}, ${this.cache.saturation}, ${this.cache.brightness}`);

    try {
      this.cache.saturation = value;
      if (this.cacheUpdated) {
        let hexValue = this._HSLToHex(this.cache.hue, this.cache.saturation, this.cache.brightness);
        hexValue = hexValue.replace("#", "");
        this.plugin.log.info(hexValue);

        await this.runActionList(WYZE_API_COLOR_PROPERTY, hexValue);
        this.cacheUpdated = false;
      } else {
        this.cacheUpdated = true;
      }
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

  _hexToHSL(H) {
    // Sourced from: https://css-tricks.com/converting-color-spaces-in-javascript/
    // Convert hex to RGB first
    let r = 0, g = 0, b = 0;
    if (H.length == 4) {
      r = "0x" + H[1] + H[1];
      g = "0x" + H[2] + H[2];
      b = "0x" + H[3] + H[3];
    } else if (H.length == 6) {
      r = "0x" + H[0] + H[1];
      g = "0x" + H[2] + H[3];
      b = "0x" + H[4] + H[5];
    }
    // Then to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;
  
    if (delta == 0)
      h = 0;
    else if (cmax == r)
      h = ((g - b) / delta) % 6;
    else if (cmax == g)
      h = (b - r) / delta + 2;
    else
      h = (r - g) / delta + 4;
  
    h = Math.round(h * 60);
  
    if (h < 0)
      h += 360;
  
    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
  
    return {
      "h": h,
      "s": s,
      "l": l,
    };
  }

  _HSLToHex(h,s,l) {
    // Sourced from: https://css-tricks.com/converting-color-spaces-in-javascript/
    s /= 100;
    l /= 100;
  
    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0, 
        b = 0; 
  
    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    // Having obtained RGB, convert channels to hex
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);
  
    // Prepend 0s, if necessary
    if (r.length == 1)
      r = "0" + r;
    if (g.length == 1)
      g = "0" + g;
    if (b.length == 1)
      b = "0" + b;
  
    return "#" + r + g + b;
  }
};
