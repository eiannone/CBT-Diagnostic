# CANBus Triple - OBD II Diagnostic App

This is a Ionic Framework app wich connects to a [CANBus Triple](http://www.canb.us) device 
and does some OBD II communication through CAN protocol.

Currently it has been tested on Android platform, but it should work on iOS and Windows Phone, too.

**NOTE**: You need a firmware which supports CAN mask filtering, such as my [v0.5.1 can-mask branch](https://github.com/eiannone/CANBus-Triple/tree/can-mask).

# Installation

Make sure you have [Ionic Framework](http://ionicframework.com/getting-started/) installed 
(it requires also [Node.js](http://nodejs.org/) to be installed).

Switch to project folder and run the following command to install framework libraries and plugins:
```
npm install
```

Then run the following command to add the platform(s) for which you want to build the app:
```
ionic cordova platform add android
```

# Building and running the app

You can build the app with the following command:
```
ionic cordova build android
```

Or you can run it directly to an attached device with:
```
ionic cordova run android
```

# Screenshots
![Menu](http://res.cloudinary.com/duk6jfuuh/image/upload/c_scale,e_shadow,w_300/v1434881198/ss01_menu_asg731.png)
![Hardware](http://res.cloudinary.com/duk6jfuuh/image/upload/c_scale,e_shadow,w_300/v1434881198/ss03_hardware_nokjoc.png)
![Connecting](http://res.cloudinary.com/duk6jfuuh/image/upload/c_scale,e_shadow,w_300/v1434881197/ss02_connecting_oti6pf.png)
![obd](http://res.cloudinary.com/duk6jfuuh/image/upload/c_scale,e_shadow,w_300/v1434881200/ss04_obd_bmoo6g.png)
