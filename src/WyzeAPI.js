const axios = require('axios');
const md5 = require('md5');

module.exports = class WyzeAPI {
  constructor(options, log) {
    this.log = log;

    this.username = options.username;
    this.password = options.password;
    this.baseUrl = options.baseUrl || 'https://api.wyzecam.com:8443';
    this.phoneId = options.phoneId || 'bc151f39-787b-4871-be27-5a20fd0a1937';
    this.appName = options.appName || 'com.hualai.WyzeCam';
    this.appVer = options.appVer || 'com.hualai.WyzeCam___2.10.62';
    this.appVersion = options.appVersion || '2.10.62';
    this.sc = '9f275790cab94a72bd206c8876429f3c';
    this.sv = '9d74946e652647e9b6c9d59326aef104';
    this.accessToken = options.accessToken || '';
    this.refreshToken = options.refreshToken || '';
  }

  getRequestData() {
    return {
      'access_token': this.accessToken,
      'app_name': this.appName,
      'app_ver': this.appVer,
      'app_version': this.appVersion,
      'phone_id': this.phoneId,
      'phone_system_type': '1',
      'sc': this.sc,
      'sv': this.sv,
      'ts': (new Date).getTime(),
    };
  }

  async request(url, data = {}) {
    try {
      return await this._performRequest(url, data);
    } catch (e) {
      this.log.debug(e);
      this.log.error('Error, logging in and trying again');

      // Log in and try again
      await this.login();
      return this._performRequest(url, data);
    }
  }

  async _performRequest(url, data = {}) {
    this.log.debug(`Performing request: ${url}`);

    const result = await axios({
      url,
      data,
      baseURL: this.baseUrl,
      method: 'POST',
    });

    if (result.data.msg === 'AccessTokenError') {
      throw new Error('AccessTokenError');
    }

    this.log.debug(`API response: ${JSON.stringify(result.data)}`);

    // Catch-all error
    if (result.data.msg) {
      throw new Error(result.data.msg);
    }

    return result;
  }

  async login() {
    const data = {
      ...this.getRequestData(),
      access_token: '',
      user_name: this.username,
      password: md5(md5(this.password)),
      two_factor_auth: '',
    };

    const result = await this._performRequest('app/user/login', data);

    this.accessToken = result.data.data.access_token;
    this.refreshToken = result.data.data.refresh_token;

    this.log.info('Successfully logged into Wyze API');
  }

  async maybeLogin() {
    if (!this.accessToken) {
      await this.login();
    }
  }

  async getObjectList() {
    await this.maybeLogin();

    const result = await this.request('app/v2/home_page/get_object_list', this.getRequestData());

    return result.data;
  }

  async getPropertyList(deviceMac, deviceModel) {
    await this.maybeLogin();

    const data = {
      ...this.getRequestData(),
      device_mac: deviceMac,
      device_model: deviceModel,
    };

    const result = await this.request('app/v2/device/get_property_list', data);

    return result.data;
  }

  async setProperty(deviceMac, deviceModel, propertyId, propertyValue) {
    await this.maybeLogin();

    const data = {
      ...this.getRequestData(),
      device_mac: deviceMac,
      device_model: deviceModel,
      pid: propertyId,
      pvalue: propertyValue,
    };

    const result = await this.request('app/v2/device/set_property', data);

    return result.data;
  }
};
