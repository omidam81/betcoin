'use strict';

var SecurityController = function($scope, BCAuth) {
    $scope.constructQRCodeUrl = function(totpSecret){
        if(!totpSecret){
            return;
        }
        $scope.qrcodeUrl = BCAuth.resourceUrl + '/admin/security/qrcode/google-two-factor/' + totpSecret;
    };
    $scope.getTotpSecret = function() {
        BCAuth.Admin.getTotpSecret({}, function(data){
            $scope.user.totpSecret = data.totpSecret;
        });
    };
    $scope.activateTotp = function() {
        $scope.error = null;
        BCAuth.Admin.activateTotp({oneTimePass: $scope.oneTimePass}, function(data){
            if(data.code){
                $scope.error = true;
                return;
            }
            $scope.user.totp = true;
        }, function(err){
            $scope.error = err.data;
        });
    };
    $scope.deactivateTotp = function() {
        BCAuth.Admin.deactivateTotp({}, function(){
            $scope.user.totp = false;
            delete $scope.user.totpSecret;
        });
    };

    $scope.$watch('user.totpSecret', function(newValue){
        $scope.constructQRCodeUrl(newValue);
    });

    BCAuth.Admin.getAdmin({}, function(user){
        $scope.user = user;
    });
};

Application.Controllers.controller("SecurityController", [
    "$scope",
    "BCAuth",
    "BCAdminSession",
    SecurityController
]);

