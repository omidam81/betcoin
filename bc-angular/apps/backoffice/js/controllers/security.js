'use strict';

var SecurityController = function($scope, BCAuth, BCAdminSession) {
    $scope.constructQRCodeUrl = function(totpSecret){
        if(!totpSecret){
            return;
        }
        $scope.qrcodeUrl = BCAuth.resourceUrl + '/qrcode/google-two-factor/' + totpSecret;
    };
    $scope.getTotpSecret = function() {
        BCAuth.Admin.getTotpSecret({}, function(data){
            $scope.totpSecret = data.totpSecret;
        });
    };
    $scope.activateTotp = function() {
        $scope.error = null;
        BCAuth.Admin.activateTotp({oneTimePass: $scope.oneTimePass}, function(data){
            if(data.code){
                $scope.error = true;
                return;
            }
            $scope.totp = true;
        }, function(err){
            $scope.error = err.data;
        });
    };
    $scope.deactivateTotp = function() {
        BCAuth.Admin.deactivateTotp({}, function(){
            $scope.totp = false;
            delete $scope.totpSecret;
        });
    };

    $scope.$watch('totpSecret', function(newValue){
        $scope.constructQRCodeUrl(newValue);
    });

    $scope.session = BCAdminSession;

    $scope.$watch('session.user', function(newValue){
        if (newValue) {
            $scope.totp = newValue.totp;
            $scope.totpSecret = newValue.totpSecret;
            $scope.constructQRCodeUrl($scope.totpSecret);
        }
    });


};

Application.Controllers.controller("SecurityController", [
    "$scope",
    "BCAuth",
    "BCAdminSession",
    SecurityController
]);
