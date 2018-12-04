'use strict';

var SecurityController = function($scope, BCPlayer, BCSession, PlayerApi) {
    $scope.constructQRCodeUrl = function(totpSecret){
        if(!totpSecret){
            return;
        }
        $scope.qrcodeUrl = PlayerApi.protocol + '://' + PlayerApi.hostname + ':' + PlayerApi.port + '/qrcode/google-two-factor/' + totpSecret;
    };
    $scope.getTotpSecret = function() {
        BCPlayer.User.getTotpSecret({}, function(data){
            $scope.user.totpSecret = data.totpSecret;
        });
    };
    $scope.activateTotp = function() {
        $scope.error = null;
        BCPlayer.User.activateTotp({oneTimePass: $scope.oneTimePass}, function(){
            $scope.user.totp = true;
        }, function(err){
            $scope.error = err.data;
        });
    };
    $scope.deactivateTotp = function() {
        BCPlayer.User.deactivateTotp({}, function(){
            $scope.user.totp = false;
            delete $scope.user.totpSecret;
        });
    };
    if(BCSession.user){
        $scope.user = BCSession.user;
    }
    BCPlayer.$on('user update', function() {
        $scope.user = BCSession.user;
    });

    $scope.$watch('user.totpSecret', function(newValue){
        $scope.constructQRCodeUrl(newValue);
    });

};

Application.Controllers.controller("SecurityController", [
    "$scope",
    "BCPlayer",
    "BCSession",
    "PlayerApi",
    SecurityController
]);

