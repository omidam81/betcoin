(function(Application) {
    'use strict';

    var LogoutController = function($scope, $location, ipCookie, BCPlayer) {
        $scope.tokenExpired = $location.search().type === 'token';
        // BCPlayer.$watch('user', function(user) {
            // if (user) {
                $location.path("/");
                BCPlayer.logout();
            // }
        // });
    };

    Application.Controllers.controller('LogoutController', [
        '$scope',
        '$location',
        'ipCookie',
        'BCPlayer',
        'BCSession',
        LogoutController
    ]);

})(window.Application);
