
(function(window, angular) {
    'use strict';

    if (window.io === undefined) {
        throw "No socket.io found!";
    }

    var bcGame = angular.module('bcGame', ['ng', 'ngResource']);
    var appRun = function($rootScope, $route, DiceSocket, secretHash) {

        $rootScope.secrets = {};
        $rootScope.loadingSecret = false;
        $rootScope.games = [];

        $rootScope.loadSecret = function(dice) {
            $rootScope.loadingSecret = true;
            secretHash(new Date(dice.createdAt), function(err, secret) {
                $rootScope.loadingSecret = false;
                if (err) {
                    $rootScope.secrets[dice._id] = "ERROR, TRY AGAIN";
                    setTimeout(function() {
                        $rootScope.$apply(function() {
                            $rootScope.secrets[dice._id] = undefined;
                        });
                    }, 3000);
                } else {
                    $rootScope.secrets[dice._id] = secret;
                }
            });
        };
        // set up dice socklet bindings
        DiceSocket.on("onDiceAdded", function(dice) {
            if (!angular.isArray(dice)) {
                dice = [dice];
            }
            if (dice.length) {
                console.log('dice added', dice);
                $rootScope.$broadcast('onDiceAdded', dice);
            }
        });
        DiceSocket.on("totalDiceUpdate", function(data) {
            var recents = {};
            recents.exchange = data.exchange;
            recents.totalUSD = Math.round(data.exchange * data.sum);
            recents.totalDice = data.count;
            recents.totalBitcoin = Math.round(data.sum);
            $rootScope.$broadcast('totalDiceUpdate', recents);
        });
    };

    var appConfig = function($routeProvider, $locationProvider, $compileProvider, BCPlayerProvider, PlayerApi) {


        $routeProvider.when('/', {
            templateUrl: 'tpl/mygames.html',
            controller: 'MyGamesController'
        }).when('/index.html', {
            templateUrl: 'tpl/mygames.html',
            controller: 'MyGamesController'
        }).when('/how-to-play', {
            templateUrl: 'tpl/howtoplay.html',
        }).when('/recent', {
            templateUrl: 'tpl/recent.html',
            controller: 'RecentController'
        }).when('/recent/:type', {
            templateUrl: 'tpl/recent.html',
            controller: 'RecentController'
        }).when('/leaderboard', {
            templateUrl: 'tpl/leaderboard.html',
            controller: 'LeaderboardController'
        }).when('/leaderboard/:type', {
            templateUrl: 'tpl/leaderboard.html',
            controller: 'LeaderboardController'
        }).when('/awards', {
            templateUrl: 'tpl/awards.html',
            controller: 'RecentController'
        }).when('/prizes', {
            templateUrl: 'tpl/prizes.html',
            controller: 'PrizeController'
        }).when('/support', {
            templateUrl: 'tpl/support/new-ticket.html',
            controller: 'NewTicketController'
        }).when('/support/submit/:id', {
            templateUrl: 'tpl/support/submit-ticket.html',
            controller: 'SubmittedTicketController'
        }).when('/support/view/:id', {
            templateUrl: 'tpl/support/detail-ticket.html',
            controller: 'ViewTicketController'
        }).when('/faq', {
            templateUrl: 'tpl/faq-en.html'
        }).otherwise({
            templateUrl: 'tpl/error404.html'
        });

        BCPlayerProvider.serverConfig({
            hostname: PlayerApi.hostname,
            port: PlayerApi.port,
            scheme: PlayerApi.protocol
        });
        BCPlayerProvider.socketConfig({
            hostname: PlayerApi.hostname,
            port: 443,
            scheme: "https"
        });
    };

    bcGame.config([
            '$routeProvider',
            '$locationProvider',
            '$compileProvider',
            'BCPlayerProvider',
            'PlayerApi',
            appConfig
        ])
        .run([
            '$rootScope',
            '$route',
            'DiceSocket',
            'secretHash',
            appRun
        ]);
})(window,angular);
