'use strict';

Application.Directives.directive('bcNotifications', [
    function() {
        return {
            restrict:'E',
            scope: true,
            templateUrl: 'tpl/directives/notifications.html',
            link: function(scope) {
                scope.$on('new notification', function(event, data){
                    scope.notification = data;
                });

                var ua = navigator.userAgent.toLowerCase();
                var isStockAndroid = ua.indexOf('android') > -1 && ua.indexOf('mobile') && ua.indexOf('chrome') === -1;
                var isOpera = ua.indexOf('opera') !== -1;
                if(isStockAndroid || isOpera) {
                    scope.notification = {type:'browser_no_supported'};
                }

                scope.removeNotification = function(){
                    scope.notification = undefined;
                };
            }
        };
    }
]);
