'use strict';

var BCAccountController = function($rootScope, $scope, $location, $routeParams, LowLagSounds, BCPlayer, BCSession) {
    $scope.user = BCSession.user;
    $scope.userEditData = angular.copy(BCSession.user);
    $scope.target = $routeParams.target;


    $scope.checkAnonymous = function(user){
        if ((/^\/account/).test($location.path())) {
            if(user && user.anonymous && $scope.target !== 'edit'){
                setTimeout(function(){
                    $rootScope.$broadcast('new notification', {type:'anonymous_upgrade'});
                }, 1000);
                $location.path('/account/edit');
            }
        }
    };

    $scope.getChallenge = function() {
        if($routeParams.target === 'edit'){
            BCPlayer.User.getChallenge({}, function(data){
                $scope.challenge = data.challenge;
            });
        }
    };
    $scope.init = function(event,user) {

        $scope.user = user;
        $scope.userEditData = angular.copy(user);
        $scope.getChallenge();
        $scope.checkAnonymous(user);
        var bonuses = [];
        var currency = 'btc';
        if(!$scope.user || !$scope.user.activeBonuses) { return; }
        for (var bonusId in $scope.user.activeBonuses[currency]) {
            if ($scope.user.activeBonuses[currency].hasOwnProperty(bonusId)) {
                bonuses.push(angular.extend({}, $scope.user.activeBonuses[currency][bonusId]));
            }
        }
        bonuses.sort(function(a, b) {
            if (a.accepted < b.accepted) { return -1; }
            if (a.accepted > b.accepted) { return 1; }
            return 0;
        });
        $scope.bonuses = bonuses;
    };
    BCPlayer.$on('user update', $scope.init);

    if(BCSession.user){
        $scope.init(undefined,BCSession.user);
    }
    $scope.recentFilter = function(bonus) {
        console.log(bonus.exhausted,bonus.unlocked);
        if (bonus.exhausted || bonus.unlocked) {
            return true;
        } else {
            return false;
        }
    };
    $scope.exhaustedFilter = function(bonus) {
        if (bonus.exhausted) {
            return false;
        } else {
            return true;
        }
    };
    $scope.login = function() {
        BCPlayer.login($scope.loginForm.alias, $scope.loginForm.password).then(function(user) {
            $scope.loginForm.password = "";
            $scope.user = user;
        }, function() {
            $scope.loginForm.password = "";
            $scope.user = null;
        });
    };

    $scope.logout = function() {
        BCPlayer.logout().then(function() {
            //$location.path('/');
        });
    };

    $scope.update = function() {
        $scope.error = null;
        $scope.updated = false;
        var backupAddress;
        if($scope.userEditData.withdraw.btc.backup){
            backupAddress = $scope.userEditData.withdraw.btc.backup.address;
        }
        BCPlayer.User.update({
            alias: $scope.userEditData.alias,
            password: $scope.userEditData.password,
            email: $scope.userEditData.email,
            btcWithdrawAddress: $scope.userEditData.withdraw.btc.address,
            btcBackupWithdrawAddress: (backupAddress === null || backupAddress === '')?null: backupAddress,
            signature: $scope.userEditData.signature,
            signature_old: $scope.userEditData.signature_old,
            backupSignature: $scope.userEditData.backupSignature,
            backupSignature_old: $scope.userEditData.backupSignature_old
        }, function(res){
            var user = res.data;
            BCPlayer.$emit('user update', user);
            BCSession.user = user;
            $scope.updated = true;
            $location.path('/account');
        }, function(err){
            $scope.error = err.data;
        });
    };
    $scope.initiateWithdraw = function() {
        $scope.withdrawPending = true;
    };
    $scope.withdrawBtc = function() {
        $scope.errors = {};
        $scope.successWithdraw = false;

        var btcWithdrawAmount = parseFloat($scope.btcWithdrawAmount);
        btcWithdrawAmount = isNaN(btcWithdrawAmount) === true? 0 : btcWithdrawAmount;
        btcWithdrawAmount = btcWithdrawAmount.toSatoshi();

        BCPlayer.User.withdraw({currency: 'btc', amount: btcWithdrawAmount}, function(respond){
            $scope.user = respond.user;
            $scope.btcWithdrawAmount = 0;
            $scope.successWithdraw = true;
            $scope.withdrawPending = false;
        }, function(err){
            $scope.withdrawPending = false;
            $scope.errors.server = err.data;
            console.log($scope.errors.server);
            if (err.status === 423) {
                $scope.minconfErr = true;
            } else {
                $scope.withdrawErr = true;
            }
        });

    };

    BCPlayer.$on('withdraw', function(){
        LowLagSounds.play('cashoutSound');
    });
    BCPlayer.$on('deposit', function(){
        LowLagSounds.play('depositSound');
    });
};

Application.Controllers.controller('BCAccountController', ['$rootScope', '$scope', '$location', '$routeParams', 'LowLagSounds', 'BCPlayer', 'BCSession', BCAccountController]);
