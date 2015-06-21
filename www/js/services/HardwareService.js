'use strict';

angular.module('cbt')
    .factory('HardwareService', ['BluetoothService', '$q', '$timeout', function(BluetoothService, $q, $timeout) {

        var dataType = { JSON: "Json", CAN: "CAN", LINE: "Line", NONE: "None" };

        var errors = {
            BUSY: { id: "busy", message: "Port busy. Cannot send command." },
            INVALID_DEVICE: { id: "invalidDevice", message: "Aborting connection, because invalid device."},
            INVALID_BUS: { id: "invalidBus", message: "Invalid BUS number."},
            INVALID_CAN_ID: { id: "invalidCanId", message: "Invalid can identifier"},
            INVALID_CAN: { id: "invalidCan", message: "Invalid can packet"},
            INVALID_FILTER: { id: "invalidFilter", message: "Invalid filter"},
            INVALID_MASK: { id: "invalidMask", message: "Invalid mask"},
            CMD_TIMEOUT: { id: "cmdTimeout", message: "Command timeout"}
        };

        /**
         * Bluegiga BLE112 GATT
         * From: https://github.com/CANBus-Triple/CBT-BLE112-Firmware/blob/master/gatt.xml
         */
        var btServices = {
            generic: { // Generic Access Profile
                UUID: "1800",
                C_NAME: "2a00"  // CANBus Triple
            },
            serial: { // ATmega32u4 Serial
                UUID: "7a1fb359-735c-4983-8082-bdd7674c74d2",
                C_RX_INDICATE: "b0d6c9fe-e38a-4d31-9272-b8b3e93d8657", // Serial RX Indicate
                C_DATA_NOTIFY: "b0d6c9fe-e38a-4d31-9272-b8b3e93d8658", // Serial (TX?) Notify
                C_ATM_INTERRUPT: "5fcd52b7-4cfb-4095-aeb2-5c5511646bbe" // Atmega Interrupt
            },
            utilities: {
                UUID: "35e71686-b1c3-45e7-9da6-1ca2393a41f3",
                C_DFU_RESET: "5fcd52b7-4cfb-4095-aeb2-5c5511646bbf" // Reset to DFU Mode
            }
        };
        var connected = false;
        var deviceInfo = null;
        var busy = false;

        var currentDataType = dataType.NONE;

        var lineHandler = null;
        var lineBuffer = "";

        var jsonHandler = null;
        var jsonBuffer = "";
        var jsonTagsOpen = 0;
        var jsonInString = false;

        var canHandler = null;
        var canBuffer = new Uint8Array(16);
        var canRead = 0;

        var okHandler = null;
        var disconnectHandler = null;

        function resetBuffer() {
            jsonBuffer = "";
            jsonTagsOpen = 0;
            jsonInString = false;
            currentDataType = dataType.NONE;
            canRead = 0;
        }

        function decodeLine(bytes) {
            var b = 0;
            while(b < bytes.length && bytes[b] != 0x0D){
                lineBuffer += String.fromCharCode(bytes[b]);
                b++;
            }
            if (b == bytes.length) return; // Partial read
            // Read completed
            b++;
            currentDataType = dataType.NONE;
            if (lineHandler !== null) lineHandler(lineBuffer);
            lineBuffer = "";
            if (b < bytes.length && bytes[b] == 0x0A) b++; // Discard line ending
            if (b < bytes.length) bytesReceived(bytes.subarray(b));
        }

        function decodeJson(bytes) {
            var b = 0;
            if (jsonTagsOpen == 0) {
                // Finds JSON string start character "{"
                while(bytes[b] != 0x7B && b < bytes.length) b++;  // 0x7B = '{'
                if (b == bytes.length) return;
                b++;
                jsonTagsOpen = 1;
                jsonBuffer = "{";
            }
            // 0x7B = '{', // 0x7D = '}'
            while(b < bytes.length && (jsonInString || (bytes[b] != 0x7B && bytes[b] != 0x7D))){
                // Check if starting/ending a string
                if (bytes[b] == 0x22 && jsonBuffer.slice(-1) != "\\") jsonInString = !jsonInString;
                jsonBuffer += String.fromCharCode(bytes[b]);
                b++;
            }
            if (b == bytes.length) return;

            jsonBuffer += String.fromCharCode(bytes[b]);
            if (bytes[b] == 0x7D) { // Found end tag
                jsonTagsOpen--;
                if (jsonTagsOpen == 0) {
                    // Read completed
                    currentDataType = dataType.NONE;
                    if (bytes[b+1] == 0x0D && bytes[b+2] == 0x0A) b+=2;
                    if (jsonHandler !== null) jsonHandler(JSON.parse(jsonBuffer));
                }
            }
            else { // Found start tag
                jsonTagsOpen++;
            }
            b++;
            if (b < bytes.length) bytesReceived(bytes.subarray(b));
        }

        function decodeCan(bytes) {
            var bytesToRead = canBuffer.length - canRead;
            for(var b = 0; b < bytesToRead; b++) canBuffer[canRead + b] = bytes[b];
            if (bytes.length < bytesToRead) {
                // Partial read
                canRead += bytes.length;
            }
            else {
                // Read completed
                canRead = 0;
                currentDataType = dataType.NONE;
                if (canHandler != null) {
                    var msg = new CANPacket(
                        canBuffer[1], // Bus
                        (canBuffer[2] << 8) + canBuffer[3], // Id
                        canBuffer.subarray(4, 4 + canBuffer[12]), // Data
                        new Date(),
                        canBuffer[13]
                    );
                    canHandler(msg);
                }
                if (bytes.length > bytesToRead) bytesReceived(bytes.subarray(bytesToRead));
            }
        }

        function bytesReceived(bytes) {
            if (currentDataType == dataType.NONE) {
                // Detect packet type from first byte
                switch (bytes[0]) {
                    case 0x03: // CAN message
                        currentDataType = dataType.CAN;
                        break;
                    case 0x7B: // Json message ('{')
                        currentDataType = dataType.JSON;
                        break;
                    case 0xFF: // OK message (COMMAND_OK)
                        if (okHandler != null) okHandler(true);
                        // Discard two next bytes (line terminator)
                        if (bytes.length > 3) bytesReceived(bytes.subarray(3));
                        break;
                    case 0x80: // Error message (COMMAND_ERROR)
                        if (okHandler != null) okHandler(false);
                        if (bytes.length > 1) bytesReceived(bytes.subarray(1));
                        break;
                    case 0x00: // Bluetooth disconnected
                        //if (disconnectHandler !== null) disconnectHandler();
                        if (bytes.length > 1) bytesReceived(bytes.subarray(1));
                        break;
                    default: // Reads a line
                        currentDataType = dataType.LINE;
                        break;
                }
            }
            switch(currentDataType) {
                case dataType.JSON:
                    decodeJson(bytes);
                    break;
                case dataType.CAN:
                    decodeCan(bytes);
                    break;
                case dataType.LINE:
                    decodeLine(bytes);
                    break;
            }
        }

        function connect(bt_device) {
            return BluetoothService.connect(bt_device)
                .then(function() {
                    return BluetoothService.subscribe(
                        btServices.serial.UUID, btServices.serial.C_RX_INDICATE, bytesReceived, false
                    );
                })
                .then(function() { return jsonCommand([0x01, 0x01]); })
                .then(function(json) {
                    if (json.event != "version") {
                        connected = false;
                        deviceInfo = null;
                        return $q.reject(errors.INVALID_DEVICE);
                    } else {
                        connected = true;
                        deviceInfo = json;
                        return json;
                    }
                })
                .catch(function(error) {
                    BluetoothService.disconnect();
                    return $q.reject(error);
                });
        }

        function disconnect() {
            //if (!connected) return $q.when(false);
            return BluetoothService.disconnect().then(function() {
                connected = false;
                deviceInfo = null;
                return true;
            });
        }

        function checkStatus() {
            return BluetoothService.checkStatus()
                .then(function(status) {
                    if (status.isConnected) {
                        status.msg = (deviceInfo == null)? BluetoothService.status()
                            : "Connected to " + deviceInfo.name + " v. " + deviceInfo.version;
                    }
                    else {
                        status.msg = BluetoothService.status() + " - No device connected.";
                    }
                    return status;
                });
        }

        function serialCommand(bytes, response) {
            if (typeof response === "undefined") response = true;
            return BluetoothService.write(btServices.serial.UUID, btServices.serial.C_DATA_NOTIFY, bytes, !response);
        }

        function jsonCommand(cmd, timeout) {
            //if (busy) return $q.reject(errors.BUSY);
            if (typeof timeout === "undefined") timeout = 5000;
            var cmdTimeout;
            resetBuffer();
            return serialCommand(cmd)
                .then(function() {
                    var deferred = $q.defer();
                    jsonHandler = deferred.resolve;
                    cmdTimeout = $timeout(function() { deferred.reject(errors.CMD_TIMEOUT); }, timeout);
                    return deferred.promise;
                })
                .finally(function() {
                    jsonHandler = null;
                    if (angular.isDefined(cmdTimeout)) {
                        $timeout.cancel(cmdTimeout);
                        cmdTimeout = undefined;
                    }
                });
        }

        /**
         * Send CAN packet to bus
         * @param canPacket CANPacket
         */
        function canCommand(canPacket) {
            if (canPacket.bus < 1 || canPacket.bus > 3) return $q.reject(errors.INVALID_BUS);
            if (canPacket.id > 0xFFF || canPacket.id <= 0) return $q.reject(errors.INVALID_CAN_ID);
            if (canPacket.data.length > 8) return $q.reject(errors.INVALID_CAN);

            var cmd = new Uint8Array([
                0x02, // CMD_SEND_CAN
                canPacket.bus,
                canPacket.id >> 8, canPacket.id & 0xFF,
                0, 0, 0, 0, 0, 0, 0, 0,
                canPacket.data.length
            ]);
            for(var b = 0; b < canPacket.data.length; b++) cmd[4 + b] = canPacket.data[b];
            return serialCommand(cmd);
        }

        function setFilterMask(bus, filter, mask) {
            if (bus < 1 || bus > 3) return $q.reject(errors.INVALID_BUS);
            if (filter > 0xFFFF || filter < 0) return $q.reject(errors.INVALID_FILTER);
            if (mask > 0xFFFF || mask < 0) return $q.reject(errors.INVALID_MASK);

            var cmd = new Uint8Array([
                0x03, // CMD_LOG
                bus,
                2,
                filter >> 8, filter & 0xFF,
                mask >> 8, mask & 0xFF
            ]);
            var cmdTimeout;
            return serialCommand(cmd)
                .then(function() {
                    var deferred = $q.defer();
                    okHandler = deferred.resolve;
                    cmdTimeout = $timeout(function() { deferred.reject(errors.CMD_TIMEOUT); }, 10000);
                    return deferred.promise;
                })
                .finally(function() {
                    okHandler = null;
                    if (angular.isDefined(cmdTimeout)) {
                        $timeout.cancel(cmdTimeout);
                        cmdTimeout = undefined;
                    }
                });
        }

        return {
            connect: connect,
            disconnect: disconnect,
            checkStatus: checkStatus,
            isConnected: function() { return (connected == true); },
            setCanPacketHandler: function(callback) { canHandler = callback; },
            sendCanPacket: canCommand,
            setFilterMask: setFilterMask,
            onDisconnect: function(callback) { disconnectHandler = callback; },
            resetBuffer: resetBuffer
        }
    }]);
