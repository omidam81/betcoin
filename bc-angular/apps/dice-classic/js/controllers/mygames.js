'use strict';

/* global Application, bitcoin */

var MyGamesController = function($scope, $rootScope, $http, MyAddresses, PlayerStats, Dice) {

    $scope.addresses = MyAddresses.getAddresses();
    $scope.myGamesLoading = false;
    $scope.limit = 10;
    $scope.diceQuery = "";
    $scope.diceSearchLoading = false;

    var updateTable = function(newVal) {
        if (angular.isArray(newVal)) {
            $scope.myGamesLoading = true;
            if (newVal.length) {
                $scope.myGames = PlayerStats.query({
                    addresses: $scope.addresses,
                    limit: $scope.limit
                }, function() {
                    $scope.myGamesLoading = false;
                });
            } else {
                $scope.myGames = Dice.recent({limit: $scope.limit}, function() {
                    $scope.myGamesLoading = false;
                });
            }
        }
    };

    var gameParams = {
        method: 'GET',
        url: './game-data.json'
    };

    var gamesReq = $http(gameParams);
    gamesReq.success(function(data) {
        $scope.games = data;
    });

    $scope.$watch('addresses', updateTable);

    MyAddresses.$on('addressesChanged', function(event, newAddresses) {
        $scope.addresses = newAddresses;
        updateTable(newAddresses);
    });

    $rootScope.$on('diceAnimated', function(event, diceArray) {
        if (!angular.isArray(diceArray)) {
            diceArray = [diceArray];
        }
        $scope.$apply(function() {
            diceArray.forEach(function(dice) {
                if ($scope.addresses.length) {
                    if ($scope.addresses.indexOf(dice.player_id) >= 0) {
                        if ($scope.myGames.length >= $scope.limit) {
                            $scope.myGames.pop();
                        }
                        $scope.myGames.unshift(dice);
                    }
                } else {
                    if ($scope.myGames.length >= $scope.limit) {
                        $scope.myGames.pop();
                    }
                    $scope.myGames.unshift(dice);
                }
            });
        });
    });

    // reset the error message when the query changes
    $scope.$watch('diceQuery', function() {
        $scope.diceSearchError = false;
    });

    // look up a dice game by txid
    $scope.diceLookup = function() {
        $scope.diceSearchLoading = true;
        Dice.query({id: $scope.diceQuery}, function(data) {
            $scope.diceSearchLoading = false;
            if (data.length) {
                $scope.diceSearchResult = data[0];
            } else {
                // we did not find anything, show the error div
                $scope.diceSearchResult = undefined;
                $scope.diceSearchError = true;
            }
        }, function(err) {
            console.error(err);
            $scope.diceSearchLoading = false;
            $scope.diceSearchError = true;
        });
    };

    $scope.newAddress = '';

    $scope.addAddress = function() {
        if ($scope.newAddress) {
            MyAddresses.addAddress($scope.newAddress);
            $scope.newAddress = '';
        }
    };

    if(window.bitcoin){
        bitcoin.getUserInfo(function(info){
            if(!MyAddresses.isMine(info.address)){
                MyAddresses.addAddress(info.address);
            }
        });
    }

    $scope.removeAddress = function(address) {
        MyAddresses.removeAddress(address);
    };

    $scope.toggleStar = function(address) {
        if (MyAddresses.isMine(address)) {
            $scope.addresses = MyAddresses.removeAddress(address);
        } else {
            $scope.addresses = MyAddresses.addAddress(address);
        }
    };

    $scope.starGraphic = function(address) {
        return MyAddresses.isMine(address) ? 'img/starred.png' : 'img/unstarred.png';
    };
};

Application.Controllers.controller('MyGamesController', [
    "$scope",
    "$rootScope",
    "$http",
    "MyAddresses",
    "PlayerStats",
    "Dice",
    MyGamesController
]);
