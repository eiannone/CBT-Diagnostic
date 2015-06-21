angular.module('cbt')
    .controller('ObdModesCtrl', function($scope, $state, HardwareService, SettingsService, UiService)
    {
        if (!HardwareService.isConnected()) {
            var device = SettingsService.getDevice();
            if (!SettingsService.getAutoConnect() || device == null) return $state.go("^.hardware");

            UiService.loadingMessage('Connecting to ' + device.name);
            HardwareService.connect(device)
                .catch(function(error) {
                    UiService.popAlert('Connection failed', "Couldn't connect to " + device.name +"<br/>" + error.message);
                    $state.go("^.hardware");
                })
                .finally(UiService.closeLoading);
        }

        $scope.modes = [{
            name: '01 - Show current data',
            desc: '',
            path: '#/app/show-data/01'
        }, {
            name: '02 - Show freeze frame data',
            desc: '',
            path: '#/app/show-data/02'
        }, {
            name: '03 - Show stored Diagnostic Trouble Codes',
            desc: '',
            path: '#/app/obd-show-dtc'
        }, {
            name: '04 - Clear Diagnostic Trouble Codes',
            desc: '',
            path: '#/app/obd-clear-dtc'
        }, {
            name: '09 - Request vehicle information',
            desc: '',
            path: '#/app/obd-request-info'
        }, {
            name: '0A - Permanent Diagnostic Trouble Codes (DTCs)',
            desc: '',
            path: '#/app/obd-permanent-dtc'
        }];
    })

    .controller('ObdShowDataCtrl', function($scope, $stateParams, ObdService, UiService)
    {
        var mode = parseInt($stateParams.mode);
        $scope.mode = $stateParams.mode;
        $scope.pids = [];

        UiService.loadingMessage("Retrieving supported PIDs");
        ObdService.getSupportedPids(mode)// Mode: 0x01 - Show current data, 0x02 - Show freeze frame data
            .then(function(pids) { $scope.pids = pids; })
            .catch(function(error) { UiService.popAlert('Error', error.message); })
            .finally(UiService.closeLoading);
    })

    .controller('ObdShowPidCtrl', function($scope, $stateParams, ObdService, UiService)
    {
        var mode = parseInt($stateParams.mode);
        var pid = parseInt($stateParams.pid);
        $scope.pid = {
            id: pid,
            name: PIDUtils.standardPids[pid],
            bytes: null,
            data: null,
            address: null
        };
        UiService.loadingMessage("Retrieving PID value");
        ObdService.getPidData(mode, pid)
            .then(function(pidObj) { $scope.pid = pidObj; })
            .catch(function(error) { UiService.popAlert('Error', error.message); })
            .finally(UiService.closeLoading);
    })

    .controller('ObdShowDtcCtrl', function($scope, ObdService, UiService)
    {
        $scope.dtc = [];

        UiService.loadingMessage("Retrieving stored DTCs");
        ObdService.getStoredDTC()
            .then(function(dtc) { $scope.dtc = dtc; })
            .catch(function(error) { UiService.popAlert('Error', error.message); })
            .finally(UiService.closeLoading);
    })

    .controller('ObdClearDtcCtrl', function($scope, $state, ObdService, UiService)
    {
        $scope.clearDTC = function() {
            UiService.loadingMessage("Clearing stored DTCs");
            ObdService.clearStoredDTC()
                .then(function() { $state.go("obd-modes"); })
                .catch(function(error) { UiService.popAlert('Error', error.message); })
                .finally(UiService.closeLoading);
        };
    })

    .controller('ObdRequestInfoCtrl', function($scope, ObdService, UiService)
    {
        $scope.pids = [];

        UiService.loadingMessage("Retrieving supported PIDs");
        ObdService.getSupportedInfo()
            .then(function(pids) { $scope.pids = pids; })
            .catch(function(error) { UiService.popAlert('Error', error.message); })
            .finally(UiService.closeLoading);
    })

    .controller('ObdPermanentDtcCtrl', function($scope, ObdService, UiService)
    {
        $scope.dtc = [];

        UiService.loadingMessage("Retrieving stored DTCs");
        ObdService.getPermanentDTC()
            .then(function(dtc) { $scope.dtc = dtc; })
            .catch(function(error) { UiService.popAlert('Error', error.message); })
            .finally(UiService.closeLoading);
    });