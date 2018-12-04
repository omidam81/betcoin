(function(window, Application) {
    'use strict';
    var InfoBarController = function($scope, ActiveUsers, BCPlayer) {
        ActiveUsers.get().success(function(data) {
            $scope.activeUsers = data;
        });
        BCPlayer.socket.on('active users', function(data) {
            console.debug('active users', data);
            $scope.activeUsers = data;
        });
    };

    Application.Controllers.controller('InfoBarController', [
        '$scope',
        'ActiveUsers',
        'BCPlayer',
        InfoBarController
    ]);

})(window, window.Application);
