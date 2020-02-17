# homebridge-frisquet-connect

<p align="center">
  <a href="https://www.npmjs.com/package/homebridge-frisquet-connect">
    <img src="https://img.shields.io/npm/v/homebridge-frisquet-connect.svg" alt="Homebridge Frisquet Connect NPM Package" />
  </a>
  <a href="https://www.npmjs.com/package/homebridge-frisquet-connect">
    <img src="https://img.shields.io/npm/dm/homebridge-frisquet-connect.svg" alt="Homebridge Frisquet Connect NPM Download Count" />
  </a>
  <a href="https://travis-ci.com/mgcrea/homebridge-frisquet-connect">
    <img src="https://travis-ci.com/mgcrea/homebridge-frisquet-connect.svg?branch=master" alt="Homebridge Frisquet Connect Travis Builds" />
  </a>
  <a href="https://david-dm.org/mgcrea/homebridge-frisquet-connect">
    <img src="https://david-dm.org/mgcrea/homebridge-frisquet-connect/status.svg" alt="Homebridge Frisquet Connect Dependencies" />
  </a>
  <a href="https://codecov.io/gh/mgcrea/homebridge-frisquet-connect">
    <img src="https://codecov.io/gh/mgcrea/homebridge-frisquet-connect/branch/master/graph/badge.svg" alt="Homebridge Frisquet Connect Code Coverage" />
  </a>
</p>

---

[Homebridge](https://homebridge.io/) plugin to easily manage [Frisquet Connect hardware](https://connect.frisquet.com/) by [Frisquet](https://www.frisquet.com/) from [Apple HomeKit](https://www.apple.com/ios/home/).

- Built with [TypeScript](https://www.typescriptlang.org/) for static type checking with exported types along the library.

## Documentation

### Installation

1. Add `homebridge-frisquet-connect` plugin to your homebridge install:

- eg. using [oznu/docker-homebridge](https://github.com/oznu/docker-homebridge), update `./volumes/homebridge/package.json`

```json
{
  "private": true,
  "description": "This file keeps track of which plugins should be installed.",
  "dependencies": {
    "homebridge-dummy": "^0.4.0",
    "homebridge-frisquet-connect": "^0.2.1"
  }
}
```

2. Configure the `homebridge-frisquet-connect` platform, providing your Tydom identifiers:

```json
{
  "bridge": {
    "name": "Homebridge 27C9",
    "username": "0E:21:1B:E7:27:C9",
    "port": 53619,
    "pin": "031-45-154"
  },
  "accessories": [],
  "platforms": [
    {
      "platform": "FrisquetConnect",
      "username": "username@domain.com",
      "password": "YourPassw0rd"
    }
  ]
}
```

### Configurations

| **Field** | **Description**             |
| --------- | --------------------------- |
| hostname  | Tydom hostname              |
| username  | Tydom username              |
| password  | Tydom password              |
| settings  | Device settings (overrides) |

- The `settings` field enables you to override the name or homekit category of your Tydom device (check homebridge log for the device ids).

### Debug

This library uses [debug](https://www.npmjs.com/package/debug) to provide high verbosity logs, just pass the following environment:

```bash
DEBUG=homebridge-frisquet-connect
```

### Available scripts

| **Script**    | **Description**              |
| ------------- | ---------------------------- |
| start         | alias to `spec:watch`        |
| test          | Run all tests                |
| spec          | Run unit tests               |
| spec:coverage | Run unit tests with coverage |
| spec:watch    | Watch unit tests             |
| lint          | Run eslint static tests      |
| pretty        | Run prettier static tests    |
| build         | Compile the library          |
| build:watch   | Watch compilation            |

## Authors

**Olivier Louvignes**

- http://olouv.com
- http://github.com/mgcrea

## License

```
The MIT License

Copyright (c) 2020 Olivier Louvignes <olivier@mgcrea.io>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
