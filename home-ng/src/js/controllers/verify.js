'use strict';

var VerifyController = function($scope, $rootScope, $location, BCPlayer, BCSession) {
    $rootScope.register = true;
    $rootScope.home = false;
    $scope.errors = {};
    $scope.walletAddress = BCPlayer.getCookie('lastAddress');

    $scope.selectProvider = function(){
        $scope.providerSelected = true;
    };

    if (BCSession.user) {
        $scope.user = BCSession.user;
        BCPlayer.User.getChallenge(function(data) {
            $scope.user.challenge = data.challenge;
        }, function(err) {
            $scope.error = err;
            console.error(err);
        });
    } else {
        BCPlayer.$on('login', function(user) {
            $scope.user = user;
            BCPlayer.User.getChallenge(function(data) {
                $scope.user.challenge = data.challenge;
            }, function(err) {
                $scope.error = err;
                console.error(err);
            });
        });
    }

    $scope.verifyWallet = function (){
        $scope.error = null;
        BCPlayer.User.addWithdrawAddress({address: $scope.walletAddress, sig:$scope.textSigned}, function(){
            if(BCSession.user && !BCSession.user.btc){
                BCSession.user.withdraw = {
                    btc:{
                        address: $scope.walletAddress
                    }
                };
            }
            if(BCSession.user && BCSession.user.btc){
                BCSession.user.btc.address = $scope.walletAddress;
            }
            $location.path('/account');
        }, function(err){
            $scope.error = err.data;
        });
    };
};

Application.Controllers.controller('VerifyController', [
    "$scope",
    "$rootScope",
    "$location",
    "BCPlayer",
    "BCSession",
    VerifyController
]);
