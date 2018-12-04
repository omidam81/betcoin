'use strict';

/* global io */

Application.Services.service('Socket', ['$rootScope', function($rootScope) {
    var socketService = {};
    socketService.getConnection = function(url){
        var subscribedUserId;
        var socket = io.connect(url, {
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
    };
    return socketService;
}]);