(function(window, Application) {
    'use strict';
    var VipStatusController = function($scope, $http, Api, MongoQuery, Config) {
        var refreshUsers = function() {
            MongoQuery.get({
                collection: 'user',
                q_pendingVipLevel: '__gte_0'
            }, function(data) {
                $scope.users = data.result;
            });
        };
        refreshUsers();

        Config.query({
            search: 'vipLevels'
        }, function(data) {
            $scope.vipLevels = data[0].value;
        }, function(err) {
            $scope.error = err;
        });

        $scope.permitUpgrade = function(user) {
            $http.post(Api.httpUrl + '/user/' + user._id + '/vip/upgrade', {}).success(function(res, status) {
                if (status !== 202) {
                    $scope.error = res.message;
                } else {
                    $scope.error = null;
                    refreshUsers();
                }
            }).error(function(err) {
                $scope.error = err;
            });
        };

        $scope.disallowUpgrade = function(user) {
            $http.post(Api.httpUrl + '/user/' + user._id + '/vip/cancel', {}).success(function(res, status) {
                if (status !== 201) {
                    $scope.error = res;
                    refreshUsers();
                } else {
                    $scope.error = null;
                }
            }).error(function(err) {
                $scope.error = err;
            });
        };
    };

    Application.Controllers.controller('VipStatusController', [
        '$scope',
        '$http',
        'Api',
        'MongoQuery',
        'Config',
        VipStatusController
    ]);
})(window, window.Application);
