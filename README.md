
<p align="center">

<img src="https://palourde.github.io/homebridge-sinope/images/homebridge-sinope.png" width="480">

</p>


# Homebridge Sinope

This [Homebridge](https://homebridge.io/) plugin provides a platform for [Sinopé Thermostats](https://www.sinopetech.com/).

## Installation

Install the plugin:
```
sudo npm install -g homebridge-sinope
```

## Configuration

Add the `Sinope` platform in your Homebridge `config.json` file, by replacing the username and password with your Neviweb credentials:
```
{
  "platforms": [
    {
      "platform": "Sinope",
      "username": "username@email.com",
      "password": "P@ssw0rd!",
      "url": "https://neviweb.com/api"
    }
  ]
}
```

## Development

### Build Plugin

TypeScript needs to be compiled into JavaScript before it can run. The following command will compile the contents of your [`src`](./src) directory and put the resulting code into the `dist` folder.

```
npm run build
```

### Link To Homebridge

Run this command so your global install of Homebridge can discover the plugin in your development environment:

```
npm link
```

You can now start Homebridge, use the `-D` flag so you can see debug log messages in your plugin:

```
homebridge -D
```

### Watch For Changes and Build Automatically

If you want to have your code compile automatically as you make changes, and restart Homebridge automatically between changes you can run:

```
npm run watch
```

This will launch an instance of Homebridge in debug mode which will restart every time you make a change to the source code. It will load the config stored in the default location under `~/.homebridge`. You may need to stop other running instances of Homebridge while using this command to prevent conflicts. You can adjust the Homebridge startup command in the [`nodemon.json`](./nodemon.json) file.

