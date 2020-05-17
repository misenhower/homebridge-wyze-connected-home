const axios = require('axios');
const md5 = require('md5');

module.exports = class WyzeAPI {
  constructor(options, log) {
    this.log = log;

    this.mfaCode = options.mfaCode;
    this.username = options.username;
    this.password = options.password;
    this.baseUrl = options.baseUrl || 'https://api.wyzecam.com:8443';
    this.phoneId = options.phoneId || 'bc151f39-787b-4871-be27-5a20fd0a1937';
    this.appName = options.appName || 'com.hualai.WyzeCam';
    this.appVer = options.appVer || 'com.hualai.WyzeCam___2.10.72';
    this.appVersion = options.appVersion || '2.10.72';
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

  async _performRequest(url, data = {}, headers = {}) {
    var baseUrl = (url == 'user/login') ? 'https://auth-prod.api.wyze.com' : this.baseUrl
    
    const request = {
      method: 'post',
      url: url,
      data: data,
      baseURL: baseUrl,
      headers: headers,
    }
    
    this.log.debug(`Performing request: ${url}`);
    this.log.debug(request);
    
    try {
      var result = await axios(request);
      this.log.debug('Response:');
      this.log.debug(result);
    } catch (e) {
      var response = e.response;
      this.log.error(`REQUEST: ${e} - ${response.statusText}`);
      this.log.error(`Reason: ${response.data.description}`);
      this.log.error(response.data);
      throw e;
    }

    return result;
  }

  async login() {
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': 'WMXHYf79Nr5gIlt3r0r7p9Tcw5bvs6BB4U8O8nGJ'
    }
    const data = {
      email: this.username,
      password: md5(md5(md5(this.password)))
    }

    try {
      // login for accounts with multiple factor authentication disabled
      var result = await this._performRequest('user/login', data, headers, {});
      
      this.accessToken = result.data.access_token;
      this.refreshToken = result.data.refresh_token;
      var mfaDetails = result.data.mfa_details;
      
      if(this.accessToken == null && this.mfaCode != "") {
      // 2FA activated and pin provided
        const dataMFA = {
          ...data,
          verification_id: mfaDetails.totp_apps[0].app_id,
          mfa_type: "TotpVerificationCode",
          verification_code: this.mfaCode
        }
        
        result = await this._performRequest('user/login', dataMFA, headers);
      
        this.accessToken = result.data.access_token;
        this.refreshToken = result.data.refresh_token;
      } else if(this.accessToken == null && this.mfaCode == "") {
        throw Error('Login with two factor authentication detected. Please provide the "mfaCode" ' +
            'in the config.json.');
      } else {
        throw Error('Failed to log in due to an unknown reason.');
      }
        
      this.log.debug(`REQUEST: ${result.status} - ${result.statusText}`);
      this.log.debug(result.data);

      this.log.info('Successfully logged into Wyze API');
    } catch (e) {
      this.log.error(`LOGIN: ${e}`);
      throw e;
    }
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
