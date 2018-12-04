'use strict';

var EmailConfirmationController = function($scope, $routeParams, $http, PlayerApi) {
    $scope.status = 'pending';
    var confirmUrl = PlayerApi.protocol + '://' +
            PlayerApi.hostname + ':' + PlayerApi.port +
            '/confirm/' + $routeParams.code;
    $http.get(confirmUrl).success(function(data) {
        console.log(data);
        $scope.status = 'confirmed';
    }).error(function (err) {
        console.error(err);
        $scope.status = 'error';
    });

};

Application.Controllers.controller('EmailConfirmationController', ['$scope', '$routeParams', '$http', 'PlayerApi', EmailConfirmationController]);
