angular.module('cbt')
    .controller('HardwareCtrl', function(
        $scope, $ionicModal, $timeout, BluetoothService, HardwareService, SettingsService, UiService
    ) {
        function forceScopeApply() {
            if(!$scope.$$phase) $scope.$apply();
        }

        function checkScanning() {
            BluetoothService.isScanning(function(scanning) {
                $scope.btScanning = scanning;
                forceScopeApply();
                if (scanning) $timeout(checkScanning, 1000);
            });
        }

        // Actions

        $scope.refreshStatus = function() {
            HardwareService.checkStatus().then(function(status) {
                $scope.btAvailable = status.isAvailable;
                $scope.btEnabled = status.isEnabled;
                $scope.btConnected = status.isConnected;
                $scope.serviceStatus = status.msg;
                forceScopeApply();
            });
        };

        $scope.btSearch = function() {
            $ionicModal.fromTemplateUrl('templates/bluetoothScan.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.modal = modal;
                $scope.modal.show();
                $scope.btScan();
            });
            $scope.closeModal = function() {
                $scope.modal.hide();
                $scope.refreshStatus();
            };
            //Cleanup the modal when we're done with it!
            $scope.$on('$destroy', function() { $scope.modal.remove(); });
        };

        $scope.btScan = function() {
            $scope.btScanning = true;
            BluetoothService.scan(10).then(null,
                function(err) { UiService.popAlert('Scan failed', err.message); },
                // This (notify) function will be called multiple times during scan
                function(devices) {
                    $scope.devices = [];
                    for(var addr in devices) $scope.devices.push(devices[addr]);
                }
            );
            $timeout(checkScanning, 1000);
        };

        $scope.btConnect = function(device) {
            UiService.loadingMessage('Connecting to ' + device.name);
            HardwareService
                .connect(device)
                .then(function() { SettingsService.setDevice(device); })
                .then($scope.closeModal)
                .catch(function(error) {
                    UiService.popAlert('Connection failed', "Couldn't connect to " + device.name +"<br/>" + error.message);
                })
                .finally(UiService.closeLoading);
        };

        $scope.btDisconnect = function() {
            UiService.loadingMessage('Disconnecting device');
            HardwareService.disconnect().catch(function(error) {
                UiService.popAlert('Error disconnecting', "Couldn't disconnect device.<br/>" + error.message);
            }).finally(UiService.closeLoading);
        };

        $scope.cbAutoConnect = function() {
            SettingsService.setAutoConnect($scope.settings.autoConnect);
        };

        $scope.settings = { autoConnect: SettingsService.getAutoConnect() };
        $scope.$on(BluetoothService.STATUS_CHANGED, $scope.refreshStatus);
        $scope.refreshStatus();
        checkScanning();
    });
