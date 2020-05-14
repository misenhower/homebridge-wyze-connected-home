# homebridge-wyze-connected-home

This plugin adds support for Wyze Connected Home devices to [Homebridge](https://github.com/homebridge/homebridge).

Currently this plugin includes support for the Wyze Plug and experimental support for the Wyze Bulb.

## Supported Devices
- Light Bulb
- Plug
- Contact Sensor
- Motion Sensor

For more information about our version updates, please check our change log.

## Configuration

Use the settings UI in Homebridge Config UI X or add the following to the `platforms` section of your config file:

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

Make sure you fill in your email address and password.

Supported devices will be found and added to Homebridge automatically.

You can optionally specify a `refreshInterval` in milliseconds (e.g., `"refreshInterval": 5000` will refresh your devices' status every 5 seconds).
The default interval is 10 seconds.

You can also optionally specify a `phoneId` that will be passed to the Wyze API.
If no `phoneId` is specified, a default value will be used.
This value must be a valid ID (usually found by intercepting your phone's traffic).

## Other Info

Special thanks to the following projects for reference and inspiration:

* **[ha-wyzeapi](https://github.com/JoshuaMulliken/ha-wyzeapi)**, a Wyze integration for Home Assistant
* **[wyze-node](https://github.com/noelportugal/wyze-node)**, a Node library for the Wyze API
