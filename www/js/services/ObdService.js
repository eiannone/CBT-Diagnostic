'use strict';

angular.module('cbt')
    .factory('ObdService', ['HardwareService', '$q', '$timeout', function(HardwareService, $q, $timeout) {
        var OBD_BUS = 1;
        var initialized = false;
        var obdHandler = null;

        var errors = {
            FILTER: { id: "enableFilter", message: "Cannot enable can filter"},
            CMD_TIMEOUT: { id: "cmdTimeout", message: "Command timeout"},
            MULTI_FRAME_NI: { id: "mfNotSupported", message: "Multi frame messages not supported yet"}
        };

        HardwareService.onDisconnect(function() { initialized = false; });

        function initialize() {
            //if (initialized) return $q.when();

            HardwareService.resetBuffer();
            return HardwareService.setFilterMask(OBD_BUS, 0x07E0, 0xFFF0)
                .then(function(success) {
                    if (!success) return $q.reject(errors.FILTER);
                    HardwareService.setCanPacketHandler(canPacketReceived);
                    initialized = true;
                });
        }

        /**
         * @param can CANPacket
         */
        function canPacketReceived(can) {
            if (can.bus != OBD_BUS || obdHandler == null) return;
            if (can.data[0] > 8) {
                // Multi frame messages not supported yet
                // See: http://www.canbushack.com/blog/index.php?title=iso-15765-2-can-transport-layer-yes-it-can-be-fun&more=1&c=1&tb=1&pb=1
                obdHandler({id: -1});
                return;
            }
            var nBytes = can.data[0] - 2;
            var bytes = new Uint8Array(nBytes);
            for(var b = 0; b < nBytes; b++) bytes[b] = can.data[3 + b];
            // Return device id, mode, data bytes
            obdHandler({
                id: can.id - 0x07E8,
                mode: can.data[1],
                pid: can.data[2],
                data: bytes
            });
        }

        /**
         * @param mode int (OBD-II mode. Standard SAE J1979 modes are 01 - 0A)
         * @param data byte array
         * @param id int (0 - 7, if omitted, the request will be broadcasted to all devices)
         */
        function obdRequest(mode, data, id) {
            var cmdTimeout;
            return initialize()
                .then(function() {
                    var canId = (typeof id === "undefined")? 0x07DF : 0x07E0 + id;
                    var canData = new Uint8Array(data.length + 2);
                    canData[0] = data.length + 1;
                    canData[1] = mode;
                    for(var b = 0; b < data.length; b++) canData[2 + b] = data[b];
                    return HardwareService.sendCanPacket(new CANPacket(OBD_BUS, canId, canData));
                })
                .then(function() {
                    var deferred = $q.defer();
                    obdHandler = function(res) {
                        if (res.id == -1) deferred.reject(errors.MULTI_FRAME_NI);
                        else deferred.resolve(res);
                    };
                    cmdTimeout = $timeout(function() { deferred.reject(errors.CMD_TIMEOUT); }, 8000);
                    return deferred.promise;
                })
                .finally(function() {
                    obdHandler = null;
                    if (angular.isDefined(cmdTimeout)) {
                        $timeout.cancel(cmdTimeout);
                        cmdTimeout = undefined;
                    }
                });
        }

        /**
         * http://en.wikipedia.org/wiki/OBD-II_PIDs#Mode_1_PID_00
         * Each bit, from MSB to LSB, represents one of the next 32 PIDs and
         * is giving information about if it is supported.
         *
         * @param obdMode
         * @returns {*}
         */
        function getSupportedPids(obdMode) {
            HardwareService.resetBuffer();
            return obdRequest(obdMode, [0x00])
                .then(function(res) {
                    var pids = PIDUtils.decodeSupportedPids(res.data, 1);

                    if ((res.data[3] & 0x01) == 0) return pids; // Check if supports pids [21 - 40]
                    pids.pop(); // Remove PID 0x20
                    return obdRequest(obdMode, [0x20])
                        .then(function(res) {
                            pids = pids.concat(PIDUtils.decodeSupportedPids(res.data, 33));

                            if ((res.data[3] & 0x01) == 0) return pids; // Check if supports pids [41 - 60]
                            pids.pop(); // Remove PID 0x40
                            return obdRequest(obdMode, [0x40])
                                .then(function(res) {
                                    pids = pids.concat(PIDUtils.decodeSupportedPids(res.data, 65));

                                    if ((res.data[3] & 0x01) == 0) return pids; // Check if supports pids [61 - 80]
                                    pids.pop(); // Remove PID 0x60
                                    return obdRequest(obdMode, [0x60])
                                        .then(function(res) {
                                            pids = pids.concat(PIDUtils.decodeSupportedPids(res.data, 97));

                                            if ((res.data[3] & 0x01) == 0) return pids; // Check if supports pids [81 - A0]
                                            pids.pop(); // Remove PID 0x80
                                            return obdRequest(obdMode, [0x80])
                                                .then(function(res) {
                                                    return pids.concat(PIDUtils.decodeSupportedPids(res.data, 129));
                                                })
                                        })
                                })
                        })
                })
        }

        function getPidData(mode, pid, id) {
            return obdRequest(mode, [pid], id)
                .then(function(res) {
                    return {
                        id: pid,
                        name: PIDUtils.standardPids[pid],
                        bytes: PIDUtils.bytes2hex(res.data),
                        data: PIDUtils.decodePidData(pid, res.data),
                        address: (0x07E8 + res.id).toString(16).toUpperCase()
                    };
                });
        }

        function getStoredDTC(mode) {
            return obdRequest(mode, [])
                .then(function(res) {
                    var dtc = [];
                    for(var b = 0; b < res.data.length; b+=2)
                        dtc.push(PIDUtils.decodeDTC(res.data.subarray(b, 2)));
                    return dtc;
                });
        }

        function getSupportedInfo() {
            return obdRequest(0x09, [0x00])
                .then(function(res) { return PIDUtils.decodeSupportedInfo(res.data); });
        }

        return {
            getSupportedPids: getSupportedPids,
            getPidData: getPidData,
            getStoredDTC: function() { return getStoredDTC(0x03); },
            clearStoredDTC: function() { return obdRequest(0x04, []); },
            getSupportedInfo: getSupportedInfo,
            getPermanentDTC: function() { return getStoredDTC(0x0A); }
        };
    }]);
