'use strict';

var BCAccountController = function($rootScope, $scope, $location, $routeParams,
                                   LowLagSounds, BCPlayer, BCSession,
                                   exchangeRate, PlayerApi, ngToast) {
    $scope.BCSession = BCSession;
    $scope.user = BCSession.user;
    $scope.target = $routeParams.target;
    $scope.updating = false;

    $('#helpModal').modal('hide');

    $('#squeeze').modal('hide');
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
        var isAgentOrRep = (/\/agents/).test($location.absUrl()) ||
            (/\/reps/).test($location.absUrl());
        if($routeParams.target === 'edit' || isAgentOrRep){
            BCPlayer.Wallet.getChallenge(function(data) {
                $scope.challenge = data.challenge;
            }, function(err) {
                $scope.error = err;
                console.error(err);
            });
        }
    };
    $scope.init = function(event,user) {
        if(!user) { return; }
        $scope.userEditData = angular.copy(user);

        if(user.wallets){
            $scope.userEditData.wallets = angular.copy(user.wallets);
            $scope.user = user;
            $scope.fiat = PlayerApi.lang === 'en_US' ? 'USD' : 'CNY';
            Object.keys($scope.user.wallets).forEach(function(currency) {
                if (!(/coin$/).test(currency)) {
                    return;
                }
                var wallet = user.wallets[currency];
                var btcBalance = exchangeRate.bitcoinValue(wallet.balance, wallet.currency);
                var btcAvailableBalance = exchangeRate.bitcoinValue(wallet.availableBalance, wallet.currency);
                wallet.fiatBalance = exchangeRate.convert(btcBalance, $scope.fiat);
                wallet.fiatAvailableBalance = exchangeRate.convert(btcAvailableBalance, $scope.fiat);
            });
        }
        if(!$scope.userEditData.email && $scope.userEditData.pendingEmail){
            $scope.userEditData.email = $scope.userEditData.pendingEmail;
        }
        $scope.getChallenge();

        $scope.checkAnonymous(user);
    };
    BCPlayer.$on('user update', $scope.init);
    BCPlayer.$on('valid wallet', $scope.init);

    if(BCSession.user){
        $scope.init(undefined,BCSession.user);
    }
    $scope.recentFilter = function(bonus) {
        if (bonus.exhaustedAt || bonus.unlockedAt) {
            return true;
        } else {
            return false;
        }
    };
    $scope.exhaustedFilter = function(bonus) {
        if (bonus.exhaustedAt) {
            return false;
        } else {
            return true;
        }
    };

    $scope.update = function() {
        $scope.error = null;
        $scope.updated = false;
        var addresses = {};
        Object.keys($scope.userEditData.wallets).forEach(function(currency){
            var wallet = $scope.userEditData.wallets[currency];
            if(wallet && wallet.withdrawAddress){
                if(!$scope.user.wallets[currency] ||
                   $scope.user.wallets[currency].withdrawAddress !== wallet.withdrawAddress) {
                    addresses[currency] = wallet.withdrawAddress;
                }
            }
        });
        var updateBackupAddress = false;
        if($scope.userEditData.wallets.bitcoin.withdrawBackup !== $scope.user.wallets.bitcoin.withdrawBackup){
            updateBackupAddress = true;
        }
        var oldSig = $scope.userEditData.signature_old;
        if ($scope.user.wallets.bitcoin.withdrawAddress === $scope.userEditData.wallets.bitcoin.withdrawAddress) {
            oldSig = $scope.userEditData.signature;
        }
        var params = {
            password: $scope.userEditData.password,
            passwordConfirm: $scope.userEditData.passwordConfirm,
            email: $scope.userEditData.email,
            addresses: addresses,
            signature: $scope.userEditData.signature,
            oldSignature: oldSig,
            withdrawBackup: updateBackupAddress? $scope.userEditData.wallets.bitcoin.withdrawBackup:null,
            backupSignature: $scope.userEditData.backupSignature || $scope.userEditData.backupSignature_old,
            oldBackupSignature: $scope.userEditData.backupSignature_old
        };
        if($scope.userEditData.anonymous){
            delete params.oldSignature;
        }
        if($scope.userEditData.username !== $scope.user.username){
            params.username = $scope.userEditData.username;
        }

        $scope.updating = true;
        BCPlayer.User.update(params, function(res){
            $scope.updating = false;
            ngToast.create("account-edit-success");
            BCSession.user = res.data.user||res.data;
            $scope.updated = true;
            if($scope.userEditData.wallets){
                BCSession.user.wallets = $scope.userEditData.wallets;
            }
            if($scope.userEditData.anonymous){
                BCPlayer.verifyToken();
            }else{
                BCPlayer.$emit('user update', BCSession.user);
            }
            $location.path('/account');
        }, function(err){
            $scope.updating = false;
            $scope.error = err.data;
        });

    };
    $scope.initiateWithdraw = function() {
        this.withdrawPending = true;
    };
    $scope.withdrawBtc = function(currency, btcWithdrawAmount) {
        var self = this;
        this.errors = {};
        this.successWithdraw = false;
        this.withdrawErr = false;
        btcWithdrawAmount = parseFloat(btcWithdrawAmount);
        btcWithdrawAmount = isNaN(btcWithdrawAmount) === true? 0 : btcWithdrawAmount;
        btcWithdrawAmount = btcWithdrawAmount.toSatoshi();

        BCPlayer.Wallet.withdraw({amount: btcWithdrawAmount, currency: currency}, function(tx){
            if (tx.status) {
                // this is a cashout request, not a real cashout
                ngToast.create("cashout-request-generated");
            } else if ($scope.user.wallets && $scope.user.wallets[tx.currency]) {
                $scope.user.wallets[tx.currency].balance = tx.balance;
                $scope.user.wallets[tx.currency].availableBalance = tx.availableBalance;
                ngToast.create("withdraw-processed");
            }
            self.btcWithdrawAmount = 0;
            self.successWithdraw = true;
            self.withdrawPending = false;
            BCPlayer.Wallet.getWallets(function(wallets) {
                BCSession.user.wallets = wallets;
            });
        }, function(){
            self.withdrawPending = false;
        });

    };
    $scope.switchActiveCurrency = function(currency) {
        if(BCSession.isGameInProgress){
            return;
        }
        $rootScope.$broadcast('currencyChange', currency);
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

    $scope.showhelpmodal = function(){
        $('#helpModal').modal('show');
    };

    BCPlayer.$on('withdraw', function(){
        LowLagSounds.play('cashoutSound');
    });
    BCPlayer.$on('deposit', function(){
        LowLagSounds.play('depositSound');
    });

    $scope.BCSession = BCSession;
};

Application.Controllers.controller('BCAccountController', [
    '$rootScope',
    '$scope',
    '$location',
    '$routeParams',
    'LowLagSounds',
    'BCPlayer',
    'BCSession',
    'exchangeRate',
    'PlayerApi',
    'ngToast',
    BCAccountController
]);
