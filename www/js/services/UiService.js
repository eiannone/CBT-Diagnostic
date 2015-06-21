'use strict';

angular.module('cbt')
    .factory('UiService', ['$ionicLoading', '$ionicPopup', function($ionicLoading, $ionicPopup) {
        return {
            loadingMessage: function (msg) {
                $ionicLoading.show({ template: msg + '... <ion-spinner></ion-spinner>'});
            },
            closeLoading: function closeLoading() {
                $ionicLoading.hide();
            },
            popAlert: function (title, message) {
                $ionicPopup.alert({ title: title, template: message });
            }
        };
    }]);