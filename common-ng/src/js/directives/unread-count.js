'use strict';

Application.Directives.directive('bcUnread', [
    'BCPlayer',
    'BCSession',
    function(BCPlayer, BCSession) {
        return {
            restrict:'E',
            scope: true,
            template: "<b class='badge'>{{unreadCount}}</b>",
            link: function(scope) {
                if(BCSession.unreadCount === undefined){
                    scope.unreadCount = 0;
                }else{
                    scope.unreadCount = BCSession.unreadCount;
                }
                BCPlayer.onMessageUnreadCount(function(unreads){
                    scope.unreadCount = unreads[0];
                    BCSession.unreadCount = scope.unreadCount;
                });
            }
        };
    }
]);
