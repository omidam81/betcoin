'use strict';

var message = function() {
    return {
        restrict: 'E',
        scope:{
            data:"=",
            dealing:"=",
            finished:"="
        },
        templateUrl: 'tpl/directives/message.html',
        link: function(scope) {
            scope.$watch('dealing', function(val){
                if(val === false && scope.data && scope.data.finished === true){
                    scope.alwaysDisplay = true;
                }
            });
            scope.$watch('finished', function(val){
                if(val === true){
                    delete scope.alwaysDisplay;
                }
            });
        }
    };
};
Application.Directives.directive('message', [message]);
