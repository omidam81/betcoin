'use strict';

var MessagesController = function($scope) {
    $scope.messages = [
        { date: new Date(), description: "Foo Bar" }
    ];
};

Application.Controllers.controller('MessagesController', ["$scope", MessagesController]);
