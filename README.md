# CANBus Triple - OBD II Diagnostic App

This is a Ionic Framework app wich connects to a [CANBus Triple](http://www.canb.us) device 
and does some OBD II communication through CAN protocol.

Currently it has been tested on Android platform, but it should work on iOS and Windows Phone, too.

# Installation

Make sure you have [Ionic Framework](http://ionicframework.com/getting-started/) installed 
(it requires also [Node.js](http://nodejs.org/) to be installed).

Switch to project folder and run the following command to install framework libraries and plugins:
```
npm install
```

Then run the following command to add the platform(s) for which you want to build the app:
```
ionic platform add android
```

# Building and running the app

You can build the app with the following command:
```
ionic build android
```

Or you can run it directly to an attached device with:
```
ionic run android
```