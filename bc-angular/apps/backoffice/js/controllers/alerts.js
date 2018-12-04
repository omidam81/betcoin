(function(angular, Application) {
    'use strict';

    var EmailAlertController = function($scope, Alert) {
        $scope.alerts = Alert.query();

        $scope.updateAlert = function(alert) {
            Alert.update(alert);
        };

        $scope.removeAlert = function(alert, index) {
            Alert.delete(alert);
            $scope.alerts.splice(index, 1);
        };
    };

    Application.Controllers.controller('EmailAlertController', [
        '$scope',
        'Alert',
        EmailAlertController
    ]);

})(window.angular, window.Application);
