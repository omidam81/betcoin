'use strict';

var VerifyController = function($scope, $rootScope, $location, BCPlayer, BCSession) {
    $rootScope.register = true;
    $rootScope.home = false;
    $scope.errors = {};
    $scope.addresses = {};
    $scope.addresses.bitcoin = BCPlayer.getCookie('lastAddress');
    $scope.resetting = false;

    $scope.selectProvider = function(){
        $scope.providerSelected = true;
    };

    $scope.refreshChallenge = function(){
        BCPlayer.Wallet.getChallenge(function(data) {
            $scope.user.challenge = data.challenge;
        }, function(err) {
            $scope.error = err;
            console.error(err);
        });
    };

    if (BCSession.user) {
        $scope.user = BCSession.user;
        $scope.refreshChallenge();
    } else {
        BCPlayer.$on('login', function(user) {
            $scope.user = user;
            $scope.refreshChallenge();
        });
    }

    $scope.$on('currencyChange', function(){
        var path = $location.path();
        if(path === '/verify/wallet'){
            $scope.refreshChallenge();
        }
    });

    $scope.verifyWallet = function (){
        $scope.error = null;
        var addresses = {};
        Object.keys($scope.addresses).forEach(function(currency){
            if($scope.addresses[currency]){
                addresses[currency] = $scope.addresses[currency];
            }
        });
	$scope.resetting = true;
        BCPlayer.Wallet.addWithdrawAddress({addresses: addresses, signature:$scope.textSigned}, function(data){
	    $scope.resetting = false;
            BCSession.user.wallets = data;
            $location.path('/account');
        }, function(err){
	    $scope.resetting = false;
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
