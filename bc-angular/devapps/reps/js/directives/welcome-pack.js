(function(angular, Application) {
    'use strict';

    Application.Directives.directive('welcomePackTable', function() {
        return {
            restrict: 'A',
            scope: {
                welcomePacks: '=welcomePackTable'
            },
            templateUrl: 'tpl/directives/welcome-pack-table.html',
        };
    });
})(window.angular, window.Application);
