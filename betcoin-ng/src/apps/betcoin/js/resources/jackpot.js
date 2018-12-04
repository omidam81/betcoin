(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('app.resources');
    } catch (e) {
        module = angular.module('app.resources', []);
    }

    var Jackpots = function($resource, BCServer) {
        return $resource(BCServer.url('/jackpots'));
    };

    module.factory('Jackpots', [
        '$resource',
        'BCServer',
        Jackpots
    ]);

})(window.angular);
