'use strict';

//@TODO if socket.io disconnects, display error in loading-overlay and allow retry ....
// ^ impement this in page directive?

var Application = {};

Application.Constants = angular.module('application.constants', []);
Application.Services = angular.module('application.services', ['ngCookies', "btford.socket-io"]);
Application.Controllers = angular.module('application.controllers', []);
Application.Filters = angular.module('application.filters', []);
Application.Directives = angular.module('application.directives', []);

var appDeps = [
    'ui.bootstrap', 
    'ngTouch',   
    'ngCookies',
    'ngRoute',
    'ngResource',
    'application.filters',
    'application.services',
    'application.directives',
    'application.constants',
    'application.controllers'
];

Application.Controllers.controller("NavBarCtrl", ["$scope", "$location", function ($scope, $location) {  //@TODO move to common once per-project concatenation works
    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };

    $scope.isLoading = false;

    $scope.isVisible = false;

    $scope.dashboardVisible = false;

    $scope.$on("$routeChangeStart", function() {
        $scope.isVisible = false;
    });
}]);

Application.Services.factory("CommonUtil", ["$rootScope","$routeParams", function($rootScope) { //@TODO move to common once per-project concatenation works
    $rootScope.getCurrencyAmount = function(id) {
        return $rootScope.currencies[id].amount;
    };

    $rootScope.getCurrencyCode = function(id) {
        return $rootScope.currencies[id].code;
    };

    $rootScope.getCurrencies = function() {
        var currencyIds = [];
        for(var i =0; i< $rootScope.currencies.length; i++) {
            currencyIds.push(i);
        }

        return currencyIds;
    };
}]);

Application.Services.factory("OlympiaUtil", ["$rootScope","$routeParams", function($rootScope, $routeParams) {
    $rootScope.eventCanTie = function (event) {
        var mlCount = 0;

        if(!event) {
            return "";
        }

        event.sportsBetOdds.forEach(function (el) {
            if (el.type === "moneyline") {
                mlCount++;
            }
        });

        return mlCount === 3;
    };

    $rootScope.getSideOddValue = function (side, event) {
        var participantId;
        var oddValue;

        if(!event) {
            return "";
        }

        event.sportsEventParticipants.forEach(function (participant) {
            if (participant.visiting_home_draw.toLowerCase() === side) {
                participantId = participant.sportsParticipant.id;
            }
        });

        event.sportsBetOdds.forEach(function (betOdd) {
            if (betOdd.participant_id === participantId && betOdd.type === "moneyline") {
                oddValue = betOdd.payout;
            }
        });

        return oddValue;
    };


    $rootScope.getParticipantName = function(participantId, event) {
        var participantName;

        event.sportsEventParticipants.forEach(function (participant) {
            if (participant.participant_id === participantId) {
                participantName = participant.sportsParticipant.name;
            }
        });

        return participantName;
    };

    $rootScope.getSideParticipantName = function (side, event) {
        var name;

        if(!event) {
            return "";
        }

        event.sportsEventParticipants.forEach(function (element) {
            if (element.visiting_home_draw.toLowerCase() === side) {
                name = element.sportsParticipant.name;
            }
        });

        return name;
    };

    $rootScope.isCurrentLeague = function(league) {
        return league.slug === $routeParams.league;

    };

    $rootScope.isCurrentSport = function(sport){
        return sport.slug === $routeParams.sport;
    };
}]);

var run = function($rootScope, $route, GameService) {
    // Bind the `$routeChangeSuccess` event on the rootScope, so that we dont need to bind in individual controllers.
    $rootScope.$on('$routeChangeSuccess', function() {
        // This will set the custom property that we have defined while configuring the routes.
        if ($route.current.action && $route.current.action.length > 0) {
            $rootScope.action = $route.current.action;
        }
    });

    //@TODO maybe fetch currencies?

    $rootScope.logged = false;

    $rootScope.currencies = [
        {"code": "BTC", "amount": "0.34562975", "name": "Bitcoin"},
        {"code": "LTC", "amount": "0.64064226", "name": "Litecoin"},  //stored as strings to avoid any floating point messups
        {"code": "DGC", "amount": "0.12121129", "name": "Dogecoin"}
    ];
    $rootScope.currentCurrency = 0;

    GameService.doQuery([
        {name: "olympiaSports" }
    ], function (obj) {
        if (obj.status === "success") {
            $rootScope.olympiaSports = obj.data.olympiaSports;
        } else {
            //@TODO display error message or maybe retry?
        }
    });

    $rootScope.olympiaSports = [];    
};


var config = function($routeProvider, $locationProvider, $compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|bitcoin):/);
    $locationProvider.html5Mode(true).hashPrefix('!');

    $routeProvider.
        when('/home', {
            templateUrl: 'tpl/home.html',
            controller: 'HomeCtrl'
        }).
        when('/sports/:sport/leagues/:league/events/:event', {
            templateUrl: 'tpl/event.html',
            controller: 'EventCtrl'
        }).
        when('/sports/:sport/leagues/:league', {
            templateUrl: 'tpl/league.html',
            controller: 'LeagueCtrl'
        }).
        when('/sports/:sport', {
            templateUrl: 'tpl/sport.html',
            controller: 'SportCtrl'
        }).
        when('/about', {
            templateUrl: 'tpl/about.html',
            controller: 'AboutCtrl'
        }).
        when('/fairness', {
            templateUrl: 'tpl/fairness.html',
            controller: 'FairnessCtrl'
        }).
        when('/what-is-bitcoin', {
            templateUrl: 'tpl/whatisbitcoin.html',
            controller: 'WhatIsBitcoinCtrl'
        }).
        when('/where-to-get-bitcoins', {
            templateUrl: 'tpl/wheretogetbitcoins.html',
            controller: 'WhereToGetBitcoinsCtrl'
        }).
        otherwise({
            redirectTo: '/home'
        });

                //@TODO betslip view
};

angular.module('application', appDeps).
config(['$routeProvider', '$locationProvider', '$compileProvider', config])
    .run(['$rootScope', '$route', 'GameService', 'OlympiaUtil', 'CommonUtil', run]);


