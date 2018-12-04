'use strict';
/* exported BaseGameHomeController */

var BaseGameHomeController = function($scope, $cookies, BCPlayer, BCSession, GameSocket) {
    $scope.newPlayerPending = false;

    if (BCSession.user) {
        $scope.player = BCSession.user;
    }

    BCPlayer.$on('user update', function(event, user) {
        $scope.player = user;
    });

    BCPlayer.$on('login', function(event, user) {
        console.debug(user.alias, 'logged in');
        GameSocket.emit('subscribe', user._id);
    });
};