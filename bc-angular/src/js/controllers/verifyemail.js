'use strict';

var VerifyEmailController = function($scope, $AccountFactory, BCPlayer, BCSession) {

    $scope.resendverifyemail = function() {

        $scope.submitting = true;
        BCPlayer.User.resendEmail({email:$scope.BCSession.user.pendingEmail}, function() {
            $scope.submitting = false;
            $("#emailnotverify").modal("hide");
            // ngToast.create("resend-email-success");
        });
        $scope.BCSession = BCSession;
    };

};

Application.Controllers.controller("VerifyEmailController", [
    "$scope",
    "AccountFactory",
    "BCPlayer",
    "$location",
    "$routeParams",
    "BCSession",
    VerifyEmailController
]);
