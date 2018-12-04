'use strict';

var HomeController = function($scope, $location) {
    $scope.loginSuccess = function(player) {
        $scope.user = player;
        // console.debug('logged in home, redirecting', player.alias);
        $('#squeeze').modal('hide');
        $location.path('/account');
    };
	$('#squeeze').modal('show');
};
Application.Controllers.controller("HomeController", [
    "$scope",
    "$location",
    HomeController
]);
