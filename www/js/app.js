// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('cbt', ['ionic', 'LocalStorageModule'])

    .run(function ($ionicPlatform) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleLightContent();
            }
        });
    })

    .config(function ($stateProvider, $urlRouterProvider, localStorageServiceProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider.state('app', {
            url: "/app",
            abstract: true,
            templateUrl: "templates/menu.html"
        });

        var states = {
            'hardware': { ctrl: "HardwareCtrl"},
            'obd-modes': { ctrl: "ObdModesCtrl"},
            'obd-show-data': { ctrl: "ObdShowDataCtrl", tpl: "obd/show-data.html", url: "/show-data/:mode"},
            'obd-show-pid': { ctrl: "ObdShowPidCtrl", tpl: "obd/show-pid.html", url: "/obd-pid/:mode/:pid"},
            'obd-show-dtc': { ctrl: "ObdShowDtcCtrl", tpl: "obd/show-dtc.html" },
            'obd-clear-dtc': { ctrl: "ObdClearDtcCtrl", tpl: "obd/clear-dtc.html" },
            'obd-request-info': { ctrl: "ObdRequestInfoCtrl", tpl: "obd/request-info.html" },
            'obd-permanent-dtc': { ctrl: "ObdPermanentDtcCtrl", tpl: "obd/permanent-dtc.html" }
        };
        for(var id in states) {
            if (!states.hasOwnProperty(id)) continue;
            $stateProvider.state('app.' + id, {
                url: states[id].hasOwnProperty("url")? states[id].url : "/" +id,
                views: {
                    'menuContent': {
                        templateUrl: "templates/" + (states[id].hasOwnProperty("tpl")? states[id].tpl : id + ".html"),
                        controller: states[id].ctrl
                    }
                }
            })
        }

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/app/obd-modes');

        localStorageServiceProvider.setPrefix('cbt');
    })

    .filter('hex', function() {
        return function(val) {
            return ((val < 16)? "0" : "") + val.toString(16).toUpperCase();
        };
    })
    .filter('nl2br', function($sce) {
        return function(str) {
            if (str === null || typeof(str) == "undefined") return "";
            return $sce.trustAsHtml(str.replace(/\r\n/g, '<br/>'));
        };
    });
