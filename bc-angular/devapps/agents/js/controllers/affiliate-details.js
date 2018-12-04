'use strict';


var AffiliateDetailsController = function($scope, $location, BCPlayer, BCSession, $window, ngToast) {

    // dummy data
    $scope.aff = {
        realName: "Dusty McFart",
        username: 'Me',
        email: 'blablabla@blalbla.com',
        address:'123 Test St. Nowhere, WV',
        phone: '7029393493',
        notes:'Some notes and stuff',
        serials:['8111111-888','8111112-888','8111113-888','8111114-888','8111115-888'],
        totalEarnings: '$ 1 TRILLION',
        commission: '0.38',
        associates:
            [
                {serial:"8111111-888",totalEarnings:"$ 1 BILLION", lastEarnings:"1 hour ago", lastLogin:"1 hour ago" },
                {serial:"8111112-888",totalEarnings:"$ 8 BILLION", lastEarnings:"1 moon ago", lastLogin:"1 hour ago" },
                {serial:"8111113-888",totalEarnings:"$ 6 BILLION", lastEarnings:"1 aeon ago", lastLogin:"1 hour ago" },
                {serial:"8111114-888",totalEarnings:"$ 3 BILLION", lastEarnings:"1 second ago", lastLogin:"1 hour ago" },
                {serial:"8111115-888",totalEarnings:"$ 9 BILLION", lastEarnings:"1 year ago", lastLogin:"1 hour ago" },
                {serial:"8111116-888",totalEarnings:"$ 5 BILLION", lastEarnings:"1 day ago", lastLogin:"1 hour ago" },
            ]
    };

    // init form data
    $scope.affData = JSON.parse(JSON.stringify($scope.aff));
    $scope.affData.serials = $scope.affData.serials.join("\n");
    delete $scope.affData.associates;
    delete $scope.affData.totalEarnings;
    $scope.affData.password = '';
    $scope.affData.passwordConfirm = '';

    $scope.registering = false;

    $scope.errorVisible = {
        isNotEqual: false,
        usernameExist: false,
        badSerials: false
    };

    $scope.$watch('affData.serials', function(serials) {

        $scope.badSerialsPopup = false;
        $scope.errorVisible.badSerials = false;
        var serialsArr = serials.split("\n");
        for(var i=0;i<serialsArr.length;i++) {
            var serial = serialsArr[i];

            var re = new RegExp("8[0135689]{6,}-888");
              var m = re.exec(serial);
              if (serial.toString().length > 0 && m === null) {
                $scope.badSerialsPopup = true;
                $scope.errorVisible.badSerials = true;
              } else {
                // ok
                // console.log("OK",serial);
              }
        }
    });


    $scope.save = function() {
        $scope.error = null;
        $scope.registering = true;
        BCPlayer.User.save($scope.affData, function() {

            $scope.registering = false;
            ngToast.create('account-creation-success');
            $location.path('/');

        }, function(err) {
            $scope.error = err.data;
            $scope.registering = false;
        });
    };

    $scope.validatePassword = function () {
        if ($scope.errorVisible.isNotEqual) {
            $('.password-notmatch').removeClass('hide');
        } else {
            $('.password-notmatch').addClass('hide');
        }
        $scope.errorVisible.isNotEqual = ($scope.affData.password !== $scope.affData.passwordConfirm) ? true : false;
        $scope.passwordPopup = ($scope.affForm.password.$invalid&&$scope.affForm.password.$dirty);
        $scope.confirmPasswordPopup = $scope.affForm.passwordConfirm.$dirty&&$scope.errorVisible.isNotEqual;
    };
};

Application.Controllers.controller('AffiliateDetailsController', [
    "$scope",
    "$location",
    "BCPlayer",
    "BCSession",
    "$window",
    "ngToast",
    AffiliateDetailsController
]);
