(function(define) {
    'use strict';

    define(['angular', 'socket.io'], function(angular, io) {
        var module = angular.module('bc.socket', ['ng', 'bc.server']);

        module.factory('BCSocket', ['$rootScope', 'BCServer', function($rootScope, BCServer) {
            var subscribedUserId;
            var socket = io.connect(BCServer.socketUrl(), {
                'reconnection limit': 5000,
                'max reconnection attempts': Infinity
            });
            socket.on('reconnect', function(){
                socket.emit('subscribe', subscribedUserId);
                $rootScope.$broadcast('clear notification');
            });
            socket.on('disconnect', function(){
                setTimeout(function(){
                    $rootScope.$broadcast('new notification', {type:'socket_disconnected'});
                }, 5000);
            });
            var originEmit = socket.emit;
            socket.emit = function(){
                originEmit.apply(socket, arguments);
                if(arguments[0] === 'subscribe' && arguments[1]){
                    subscribedUserId = arguments[1];
                }
            };
            return socket;
        }]);
    });

})(window.define);
