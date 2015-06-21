'use strict';

angular.module('cbt')
    .factory('SettingsService', function(localStorageService){
        return {
            getDevice: function () {
                return localStorageService.get('device');
            },
            setDevice: function (v) {
                return localStorageService.set('device', v);
            },
            getAutoConnect: function () {
                var val = localStorageService.get('autoConnect');
                return (val == null)? true : val;
            },
            setAutoConnect: function (v) {
                localStorageService.set('autoConnect', v === 'true' || v);
            }
        };
    });
