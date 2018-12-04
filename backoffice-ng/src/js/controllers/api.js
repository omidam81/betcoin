'use strict';

var ApiController = function($scope) {
    $scope.dateOptions = {
        changeYear: true,
        changeMonth: true,
        yearRange: '2013:-0'
    };
    $scope.startDate = new Date();
    $scope.endDate = new Date();
    $scope.selectedGame = 'dice';
    $scope.playerId = '';
    $scope.requirePlayerId = false;
    $scope.requireDate = true;
    $scope.apiResponse = {};

    /**
     * watch for changes to the form
     */
    $scope.$watch('selectedGame', function(newVal) {
        $scope.dataEndpoint = $scope.endpoints[newVal][0];
    });
    $scope.$watch('dataEndpoint', function(newVal) {
        if (newVal.value === 'player' || newVal.value === 'timeline') {
            $scope.requirePlayerId = true;
        } else {
            $scope.requirePlayerId = false;
        }
        if (newVal.value === 'timeline') {
            $scope.requireDate = false;
        } else {
            $scope.requireDate = true;
        }
    });

    $scope.endpoints = {
        'dice': [
            {label: 'Totals', value: 'totals'},
            {label: 'Player Data', value: 'player'}
        ],
        'circle': [
            {label: 'Totals', value: 'totals'},
            {label: 'Player Data', value: 'player'},
            {label: 'Player Timeline', value: 'timeline'},
        ]
    };
};

Application.Controllers.controller('ApiController', ['$scope', ApiController]);
