'use strict';

angular.module('cbt')
    .factory('BluetoothService', ['$rootScope', '$timeout', '$interval', '$q',
        function($rootScope, $timeout, $interval, $q)
    {
        var bluetoothReady = false;
        var enabled = null;
        var events = {
            STATUS_CHANGED: "BluetoothService.STATUS_CHANGED"
        };
        var errors = {
            START_SCAN: "startScan",
            NOT_CONNECTED: "notConnected",
            CLOSE: "notClosed",
            DISCONNECT: "notDisconnected",
            CONN_INVALID_ID: "invalidId",
            CONN_BT_DISABLED: "btDisabled",
            CONN_TIMEOUT: "connTimeout",
            CONNECT: "notConnected",
            SRV_NOT_DISCOVERED: "serviceNotFound",
            SRV_DISCOVER: "notDiscovered",
            READ: "notRead",
            SUBSCRIBE: "notSubscribed",
            UNSUBSCRIBE: "notUnsubscribed",
            WRITE: "notWritten"
        };
        var discoveredDevices = [];
        var deviceConnected = null;
        var deviceConnecting = null;
        var discoveredServices = [];
        var checker;
        var scanningTimeout;

        function err(id, message) {
            return { id: id, message: message };
        }

        function isEnabled() {
            return (enabled === true);
        }

        function stopChecker() {
            if (!angular.isDefined(checker)) return;
            $interval.cancel(checker);
            checker = undefined;
        }

        function checkInitialized(timeout) {
            if (isEnabled()) return $q.when();
            var deferred = $q.defer();
            checker = $interval(function() {
                timeout -= 300;
                if (timeout <= 0) {
                    stopChecker();
                    deferred.reject();
                }
                if (!bluetoothReady) return;
                bluetoothle.isInitialized(function(status) {
                    if (!status.isInitialized) return;
                    stopChecker();
                    deferred.resolve();
                });
            }, 300, 0, false);

            return deferred.promise;
        }

        function setEnabled(status) {
            var changed = (status !== enabled);
            enabled = status;
            if (changed) {
                if (!enabled) {
                    deviceConnected = deviceConnecting = null;
                    discoveredServices = [];
                }
                $rootScope.$broadcast(events.STATUS_CHANGED);
            }
        }

        function setConnected(bt_device) {
            var previousId = (deviceConnected === null)? null : deviceConnected.id;
            var currentId = (bt_device === null)? null : bt_device.id;
            var changed = (currentId !== previousId);
            deviceConnected = bt_device;
            deviceConnecting = null;
            if (bt_device === null) discoveredServices = [];
            if (changed) $rootScope.$broadcast(events.STATUS_CHANGED);
        }

        function isScanning(scanningCallback) {
            if (isEnabled())
                bluetoothle.isScanning(function(res) { scanningCallback(res.isScanning); });
            else
                scanningCallback(false);
        }

        function stopScan() {
            isScanning(function(scanning) {
                if (scanning) bluetoothle.stopScan();
            });
            if (!angular.isDefined(scanningTimeout)) return;
            $timeout.cancel(scanningTimeout);
            scanningTimeout = undefined;
        }

        function startScan(timeoutSec) {
            if (!isEnabled()) return $q.reject("Bluetooth not enabled");

            var deferred = $q.defer();
            bluetoothle.isScanning(function(res) {
                if (res.isScanning) {
                    deferred.resolve(discoveredDevices);
                    return;
                }

                discoveredDevices = [];
                if (typeof timeoutSec === "undefined") timeoutSec = 20;
                scanningTimeout = $timeout(stopScan, timeoutSec * 1000, false);
                bluetoothle.startScan(
                    // This function will be called multiple times during scan
                    function(res) {
                        if (res.status != "scanResult") return;
                        discoveredDevices[res.address] = { id: res.address, name: res.name };
                        deferred.notify(discoveredDevices);
                    },
                    function(res) {
                        deferred.reject(err(errors.START_SCAN, res.message));  // Unable to start scanning
                    },
                    {serviceUuids:[]}
                );
            });
            return deferred.promise;
        }

        function checkConnected(deviceId) {
            var deferred = $q.defer();
            bluetoothle.isConnected(
                function(status) {
                    deferred.resolve(status.hasOwnProperty('isConnected') && status.isConnected);
                },
                { address: deviceId }
            );
            return deferred.promise;
        }

        function ensureConnected() {
            if (deviceConnected == null || !isEnabled())
                return $q.reject(err(errors.NOT_CONNECTED, "Device not connected"));

            return checkConnected(deviceConnected.id).then(function(connected) {
                if (connected) return;
                // TODO: Try reconnect
                $q.reject(err(errors.NOT_CONNECTED, "Device not connected"));
            });
        }

        function forceDisconnect(deviceId) {
            var deferred = $q.defer();
            var param = { address: deviceId };
            bluetoothle.disconnect(
                // This function will be called multiple times while disconnecting
                function(res) {
                    if (res.status != "disconnected") return;
                    bluetoothle.close(
                        // This function will be called multiple times while closing
                        function(res) {
                            if (res.status != "closed") return;
                            deferred.resolve();
                        },
                        function(res) {
                            deferred.reject(err(errors.CLOSE, "Cannot close connection. " + res.message));
                        },
                        param
                    );
                },
                function(res) {
                    deferred.reject(err(errors.DISCONNECT, "Cannot disconnect current device. " + res.message));
                },
                param
            );
            return deferred.promise;
        }

        function btConnect(bt_device, timeoutSec) {
            var deferred = $q.defer();
            if (typeof timeoutSec === "undefined") timeoutSec = 10;
            var timeout = Date.now() + (timeoutSec * 1000);
            bluetoothle.connect(
                // This function will be called multiple times while connecting and when disconnected
                function(res) {
                    switch(res.status) {
                        case "connected":
                            deviceConnecting = null;
                            setConnected(bt_device);
                            deferred.resolve();
                            break;
                        case "connecting":
                            deviceConnecting = bt_device;
                            if (Date.now() > timeout) {
                                disconnect();
                                deferred.reject(err(errors.CONN_TIMEOUT, "Connection timed out"));
                            }
                            break;
                        case "disconnected":
                            setConnected(null);
                            break;
                    }
                },
                function(res) {
                    if (res.message == "Device previously connected, reconnect or close for new device")
                        return btReconnect(bt_device, timeoutSec);
                    else
                        deferred.reject(err(errors.CONNECT, "Error: " + res.message));
                },
                { address: bt_device.id }
            );
            return deferred.promise;
        }

        function btReconnect(bt_device, timeoutSec) {
            var deferred = $q.defer();
            var timeout = Date.now() + (timeoutSec * 1000);
            bluetoothle.reconnect(
                // This function will be called multiple times while connecting and when disconnected
                function(res) {
                    switch(res.status) {
                        case "connected":
                            deviceConnecting = null;
                            setConnected(bt_device);
                            deferred.resolve();
                            break;
                        case "connecting":
                            deviceConnecting = bt_device;
                            if (Date.now() > timeout) {
                                disconnect();
                                deferred.reject(err(errors.CONN_TIMEOUT, "Connection timed out"));
                            }
                            break;
                        case "disconnected":
                            setConnected(null);
                            break;
                    }
                },
                function(res) {
                    deferred.reject(err(errors.CONNECT, "Error: " + res.message));
                },
                { address: bt_device.id }
            );
            return deferred.promise;
        }

        function disconnect(deviceId) {
            if (!isEnabled()) return $q.when(false);
            if (typeof deviceId === "undefined") {
                if (deviceConnected !== null) deviceId = deviceConnected.id;
                else if (deviceConnecting !== null) deviceId = deviceConnecting.id;
                else return $q.when(false);
            }
            return forceDisconnect(deviceId).finally(function() {
                if (deviceConnected !== null && deviceConnected.id == deviceId) setConnected(null);
            });
        }

        function connect(bt_device, timeoutSec) {
            if (bt_device === null || !bt_device.hasOwnProperty('id'))
                return $q.reject(err(errors.CONN_INVALID_ID, "Invalid device object"));

            return checkInitialized(10000)
                .then(function() {
                    if (!isEnabled()) return $q.reject(err(errors.CONN_BT_DISABLED, "Bluetooth not enabled"));
                    stopScan();
                    // Check if there is some device already connecting
                    if (deviceConnecting != null)
                        return forceDisconnect(deviceConnecting.id)
                            .then(function() { deviceConnecting = null; });
                })
                .then(disconnect) // Check if there is some device already connected
                .then(function() {
                    return checkConnected(bt_device.id).then(function(alreadyConnected) {
                        if (alreadyConnected)
                            setConnected(bt_device);
                        else
                            return btConnect(bt_device, timeoutSec)
                    });
                });
        }

        function discoverService(serviceId) {
            var deferred = $q.defer();
            if (ionic.Platform.isIOS()) {
                bluetoothle.services(
                    function(res) {
                        if (res.status == "services") {
                            discoveredServices = [];
                            res.serviceUuids.forEach(function(uuid) { discoveredServices[uuid] = []; });
                            if (discoveredServices.hasOwnProperty(serviceId))
                                deferred.resolve(discoveredServices[serviceId]);
                            else
                                deferred.reject(
                                    err(errors.SRV_NOT_DISCOVERED, "Service " + serviceId + " not discovered.")
                                );
                        }
                        else {
                            deferred.reject(err(errors.SRV_DISCOVER, "Error discovering services: " + res.status));
                        }
                    },
                    function(res) {
                        deferred.reject(err(errors.SRV_DISCOVER, "Error discovering services: " + res.message));
                    },
                    { address: deviceConnected.id, serviceUuids: []}
                );
            }
            else {
                bluetoothle.discover(
                    function(res) {
                        if (res.status == "discovered") {
                            discoveredServices = [];
                            res.services.forEach(function(service) {
                                discoveredServices[service.serviceUuid] = [];
                                service.characteristics.forEach(function(ch) {
                                    discoveredServices[service.serviceUuid].push(ch.characteristicUuid);
                                });
                            });
                            if (discoveredServices.hasOwnProperty(serviceId))
                                deferred.resolve(discoveredServices[serviceId]);
                            else
                                deferred.reject(
                                    err(errors.SRV_NOT_DISCOVERED, "Service " + serviceId + " not discovered.")
                                );
                        }
                        else {
                            deferred.reject(err(errors.SRV_DISCOVER, "Error discovering services: " + res.status));
                        }
                    },
                    function(res) {
                        deferred.reject(err(errors.SRV_DISCOVER, "Error discovering services: " + res.message));
                    },
                    { address: deviceConnected.id }
                );
            }
            return deferred.promise;
        }

        function discoverCharacteristic(serviceId, characteristicId) {
            return ensureConnected()
                // Discover service
                .then(function() {
                    if (discoveredServices.hasOwnProperty(serviceId)) return discoveredServices[serviceId];
                    else return discoverService(serviceId);
                })
                // Discover characteristic
                .then(function(serviceCharacteristics) {
                    if (serviceCharacteristics.indexOf(characteristicId) > -1) return;
                    if (!ionic.Platform.isIOS())
                        return $q.reject("Characteristic " + characteristicId + " not discovered.");

                    var deferred = $q.defer();
                    bluetoothle.characteristics(
                        function(res) {
                            if (res.status == "characteristics") {
                                discoveredServices[serviceId] = [];
                                res.characteristics.forEach(function(ch) {
                                    discoveredServices[serviceId].push(ch.characteristicUuid);
                                });
                                if (discoveredServices[serviceId].indexOf(characteristicId) > -1)
                                    deferred.resolve();
                                else
                                    deferred.reject("Characteristic " + characteristicId + " not discovered.");
                            }
                            else {
                                deferred.reject("Error discovering characteristics: " + res.status);
                            }
                        },
                        function(res) { deferred.reject("Error discovering characteristics: " + res.message); },
                        { address: deviceConnected.id, serviceUuid: serviceId, characteristicUuids: [] }
                    );
                    return deferred.promise;
                });
        }

        function readCharacteristic(serviceId, characteristicId) {
            return discoverCharacteristic(serviceId, characteristicId)
                .then(function() {
                    var deferred = $q.defer();
                    bluetoothle.read(
                        function(res) {
                            if (res.status == "read")
                                deferred.resolve(bluetoothle.encodedStringToBytes(res.value));
                            else
                                deferred.reject(err(errors.READ, "Error reading: " + res.status));
                        },
                        function(res) {
                            deferred.reject(err(errors.READ, "Read error: " + res.message));
                        },
                        { address: deviceConnected.id, serviceUuid: serviceId, characteristicUuid: characteristicId }
                    );
                    return deferred.promise;
                });
        }

        function subscribe(serviceId, characteristicId, callback, withNotification) {
            return discoverCharacteristic(serviceId, characteristicId)
                .then(function() {
                    if (typeof withNotification === "undefined") withNotification = false;
                    var params = {
                        address: deviceConnected.id,
                        serviceUuid: serviceId,
                        characteristicUuid: characteristicId,
                        isNotification: withNotification
                    };
                    var deferred = $q.defer();
                    bluetoothle.subscribe(
                        function(res) {
                            if (res.status == "subscribed") {
                                deferred.resolve();
                            } else if (res.status == "subscribedResult") {
                                callback(bluetoothle.encodedStringToBytes(res.value));
                            } else {
                                deferred.reject(err(errors.SUBSCRIBE, "Error subscribing: " + res.status));
                            }
                        },
                        function(res) {
                            deferred.reject(err(errors.SUBSCRIBE, "Subscribe error: " + res.message));
                        },
                        params
                    );
                    return deferred.promise;
                });
        }

        function unsubscribe(serviceId, characteristicId) {
            return discoverCharacteristic(serviceId, characteristicId).then(
                function() {
                    var deferred = $q.defer();
                    bluetoothle.unsubscribe(
                        function(res) {
                            if (res.status == "unsubscribed")
                                deferred.resolve();
                            else
                                deferred.reject(err(errors.UNSUBSCRIBE, "Error unsubscribing: " + res.status));
                        },
                        function(res) {
                            deferred.reject(err(errors.UNSUBSCRIBE, "Unsubscribe error: " + res.message));
                        },
                        { address: deviceConnected.id, serviceUuid: serviceId, characteristicUuid: characteristicId }
                    );
                    return deferred.promise;
                },
                function() {} // Suppress errors
            );
        }

        function write(serviceId, characteristicId, bytes, noResponse) {
            return discoverCharacteristic(serviceId, characteristicId)
                .then(function() {
                    if (typeof noResponse === "undefined") noResponse = false;
                    var params = {
                        value: bluetoothle.bytesToEncodedString(bytes),
                        address: deviceConnected.id,
                        serviceUuid: serviceId,
                        characteristicUuid: characteristicId,
                        type: noResponse? "noResponse" : ""
                    };
                    var deferred = $q.defer();
                    bluetoothle.write(
                        function(res) {
                            if (res.status == "written") {
                                deferred.resolve();
                            } else {
                                deferred.reject(err(errors.WRITE, "Error writing: " + res.status));
                            }
                        },
                        function(res) {
                            deferred.reject(err(errors.WRITE, "Write error: " + res.message));
                        },
                        params
                    );
                    return deferred.promise;
                });
        }

        ionic.Platform.ready(function(){
            // will execute when device is ready, or immediately if the device is already ready.
            if (typeof bluetoothle !== "undefined") {
                bluetoothle.initialize(
                    // This function will be called every time bluetooth is enabled
                    function() { setEnabled(true); },
                    // This function will be called every time bluetooth is disabled
                    function() { setEnabled(false); },
                    {request: true}
                );
                bluetoothReady = true;
            }
        });

        return {
            STATUS_CHANGED: events.STATUS_CHANGED,
            checkStatus: function() {
                var res = {
                    isAvailable: this.isAvailable(),
                    isEnabled: isEnabled(),
                    isConnected: false
                };
                if (!res.isAvailable || !res.isEnabled) return $q.when(res);
                return this.checkConnected()
                    .then(function(connected) {
                        res.isConnected = connected;
                        return res;
                    });
            },
            status: function() {
                if (!this.isAvailable()) return "Bluetooth service not available";
                if (deviceConnected != null) return "Connected to " + deviceConnected.name;
                return "Bluetooth " + (enabled? "enabled" : "disabled");
            },
            isAvailable: function() { return (enabled !== null); },
            isEnabled: isEnabled,
            checkConnected: function() {
                if (deviceConnected == null || !isEnabled()) return $q.when(false);
                return checkConnected(deviceConnected.id);
            },
            isScanning: isScanning,
            scan: startScan,
            connect: connect,
            disconnect: disconnect,
            readCharacteristic: readCharacteristic,
            subscribe: subscribe,
            unsubscribe: unsubscribe,
            write: write
        }
    }]);
