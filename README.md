# homebridge-wyze-connected-home

This plugin adds support for Wyze Connected Home devices to [Homebridge](https://github.com/homebridge/homebridge).

## Supported Devices
- Light Bulb (experimental)
- Plug
- Contact Sensor
- Motion Sensor

For more information about our version updates, please check our [change log](CHANGELOG.md).

## Configuration

Supported devices will be found and added to Homebridge automatically.
The configuration below can be done also using the Homebridge Config UI X.

### Accounts without 2FA

For accounts without two factor authentication enabled, add the following your config.js file.

```js
{
  "platforms": [
    {
      "platform": "WyzeConnectedHome",
      "name": "Wyze",
      "username": "YOUR_EMAIL",
      "password": "YOUR_PASSWORD"
    }
  ]
}
```

### Accounts with 2FA

For accounts with two factor authentication enabled, add the following to your config.js file.

```js
{
  "platforms": [
    {
      "platform": "WyzeConnectedHome",
      "name": "Wyze",
      "username": "YOUR_EMAIL",
      "password": "YOUR_PASSWORD",
      "mfaCode": "YOUR_AUTHENTICATION_PIN"
    }
  ]
}
```

### Optional fields

* `refreshInterval` - Defines how often the status of the devices will be polled in milliseconds (e.g., `"refreshInterval": 5000` will check the status of your devices' status every 5 seconds). Defaults to 10 seconds.

* `phoneId` - The phone id used by the Wyze App. This value is just found by intercepting your phone's traffic. If no `phoneId` is specified, a default value will be used.

## Special Thanks

Special thanks to the following projects for reference and inspiration.
* **[ha-wyzeapi](https://github.com/JoshuaMulliken/ha-wyzeapi)**, a Wyze integration for Home Assistant
* **[wyze-node](https://github.com/noelportugal/wyze-node)**, a Node library for the Wyze API

Special thanks also to all the volunteers that contributed to this project adding few features of support to more devices.
