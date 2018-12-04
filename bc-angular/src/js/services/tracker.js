(function(angular, Application) {
    'use strict';

    var LANDING_REGEXP = new RegExp("https?://[^/]+/(.*)");
    var GetTracker = function($http, $location, PlayerApi) {
        var Tracker = {};

        Tracker.landingPage = function() {
            console.debug("tracking landing");
            var matches = LANDING_REGEXP.exec($location.absUrl());
            var landingPage = "/" + matches[1];
            console.debug(landingPage, PlayerApi.httpUrl);
            return $http.post(PlayerApi.httpUrl + '/track/landing', {
                landingPage: landingPage
            });
        };

        return Tracker;
    };

    Application.Services.factory('Tracker', [
        '$http',
        '$location',
        'PlayerApi',
        GetTracker
    ]);

})(window.angular, window.Application);
