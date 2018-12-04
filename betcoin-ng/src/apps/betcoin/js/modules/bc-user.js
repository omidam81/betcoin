(function(define) {
    'use strict';

    define(['angular', 'base64'], function(angular) {
        var module = angular.module('bc.user', [
            'ng',
            'base64',
            'bc.server'
        ]);

        var UserFactory = function($http, $q, $resource, $base64, BCServer) {
            var User = $resource(BCServer.resourceUrl('/user/:userId'), {
                userId: '@_id'
            });

            // auth functions need to use raw $http calls, both return
            // an $http promise
            User.login = function(username, password, otp) {
                var headers = {
                    Authorization: 'Basic ' + $base64.encode(username + ":" + password)
                };
                var httpConf = {
                    method: 'GET',
                    url: BCServer.url('/user/auth'),
                    headers: headers
                };
                if (otp) {
                    httpConf.params = {
                        one_time_pass: otp
                    };
                }
                return $http(httpConf).then(function(response) {
                    // return a $resource object
                    response.user = new User(response.data);
                    return response;
                });
            };

            User.token = function() {
                var httpConf = {
                    method: 'GET',
                    url: BCServer.url('/user/token')
                };
                return $http(httpConf).then(function(response) {
                    // return a $resource object
                    response.user = new User(response.data);
                    return response;
                });
            };

            User.prototype.logout = function() {
                var deferred = $q.defer();
                this.$delete(function() {
                    deferred.resolve();
                });
                return deferred.promise;
            };

            return User;
        };

        // an angular resource for a user, including custom methods
        module.factory('User', [
            '$http',
            '$q',
            '$resource',
            '$base64',
            'BCServer',
            UserFactory
        ]);

        var WalletsFactory = function($resource, BCServer) {
            var Wallets = $resource(BCServer.resourceUrl('/wallet/:userId'));
            return Wallets;
        };

        module.factory('Wallets', [
            '$resource',
            'BCServer',
            WalletsFactory
        ]);

        return module;
    });
})(window.define);
