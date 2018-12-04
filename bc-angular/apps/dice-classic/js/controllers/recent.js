'use strict';

/* global Application */

var RecentController = function($scope, $rootScope, $routeParams, MyAddresses, Dice) {
    $scope.recentTab = $routeParams.type || 'recent';
    $scope.diceLoading = true;
    $scope.error = false;

    $scope.getRecentTabClass = function(tabName) {
        if (tabName === $scope.recentTab) {
            return "active";
        } else {
            return "";
        }
    };

    $scope.$watch('recentTab', function() {
        $scope.dices = Dice[$scope.recentTab](function(data) {
            $scope.diceLoading = false;
            if (data.length) {
                $scope.error = false;
            } else {
                $scope.error = 'Nothing to show';
            }
        }, function(error) {
            $scope.error = 'Error loading data';
            console.error(error.data);
            $scope.diceLoading = false;
        });
    });

    $rootScope.$on('diceAnimated', function(event, diceArray) {
        if (!angular.isArray(diceArray)) {
            diceArray = [diceArray];
        }
        $scope.$apply(function() {
            diceArray.forEach(function(dice) {
                $scope.newDiceObject(dice);
            });
        });
    });

    $scope.starGraphic = function(address) {
        return MyAddresses.isMine(address) ? 'img/starred.png' : 'img/unstarred.png';
    };

    $scope.toggleStar = function(address) {
        if (MyAddresses.isMine(address)) {
            $scope.addresses = MyAddresses.removeAddress(address);
        } else {
            $scope.addresses = MyAddresses.addAddress(address);
        }
    };

    $scope.newDiceObject = function(dice) {
        if ($scope.recentTab === 'recent') {
            if ($scope.dices.length >= 30) {
                $scope.dices.pop();
            }
            $scope.error = false;
            $scope.dices.unshift(dice);
        }
    };
};

Application.Controllers.controller('RecentController', [
    "$scope",
    "$rootScope",
    "$routeParams",
    "MyAddresses",
    "Dice",
    RecentController]);
