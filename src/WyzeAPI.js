const axios = require('axios');
const md5 = require('md5');

module.exports = class WyzeAPI {
  constructor(options, log) {
    this.log = log;

    // User login parameters
    this.username = options.username;
    this.password = options.password;
    this.mfaCode = options.mfaCode;

    // URLs
    this.authBaseUrl = options.authBaseUrl || 'https://auth-prod.api.wyze.com';
    this.apiBaseUrl = options.apiBaseUrl || options.baseUrl || 'https://api.wyzecam.com';

    // App emulation constants
    this.authApiKey = options.authApiKey || 'WMXHYf79Nr5gIlt3r0r7p9Tcw5bvs6BB4U8O8nGJ';
    this.phoneId = options.phoneId || 'bc151f39-787b-4871-be27-5a20fd0a1937';
    this.appName = options.appName || 'com.hualai.WyzeCam';
    this.appVer = options.appVer || 'com.hualai.WyzeCam___2.10.72';
    this.appVersion = options.appVersion || '2.10.72';
    this.sc = '9f275790cab94a72bd206c8876429f3c';
    this.sv = '9d74946e652647e9b6c9d59326aef104';

    // Login tokens
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

  async _performRequest(url, data = {}, config = {}) {
    config = {
      method: 'POST',
      url,
      data,
      baseURL: this.apiBaseUrl,
      ...config,
    };

    this.log.debug(`Performing request: ${url}`);
    this.log.debug(`Request config: ${JSON.stringify(config)}`);

    let result;

    try {
      result = await axios(config);
      this.log.debug(`API response: ${JSON.stringify(result.data)}`);
    } catch (e) {
      this.log.error(`Request failed: ${e}`);

      if (e.response) {
        this.log.error(`Response (${e.response.statusText}): ${JSON.stringify(e.response.data)}`);
      }

      throw e;
    }

    // Catch-all error message
    if (result.data.msg) {
      throw new Error(result.data.msg);
    }

    return result;
  }

  _performLoginRequest(data = {}) {
    const url = 'user/login';

    data = {
      email: this.username,
      password: md5(md5(md5(this.password))),
      ...data,
    };

    const config = {
      baseURL: this.authBaseUrl,
      headers: { 'x-api-key': this.authApiKey },
    };

    return this._performRequest(url, data, config);
  }

  async login() {
    let response = await this._performLoginRequest();

    // Do we need to perform a 2-factor login?
    if (!response.data.access_token && response.data.mfa_details) {
      if (!this.mfaCode) {
        throw new Error('Your account has 2-factor auth enabled. Please provide the "mfaCode" parameter in config.json.');
      }

      const data = {
        mfa_type: 'TotpVerificationCode',
        verification_id: response.data.mfa_details.totp_apps[0].app_id,
        verification_code: this.mfaCode,
      };

      response = await this._performLoginRequest(data);
    }

    this.accessToken = response.data.access_token;
    this.refreshToken = response.data.refresh_token;

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
