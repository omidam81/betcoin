(function(moment, Application) {
    'use strict';
    Application.Directives.directive('elapsed', function() {
        return {
            restrict: 'E',
            scope: {
                date: '=',
            },
            template: '<span>{{elapsed}}</span>',
            link: function(scope) {
                scope.updateTime = function() {
                    scope.elapsed = moment(scope.date).fromNow(true);
                };

                setInterval(function() {
                        scope.$apply(function() {
                            scope.updateTime();
                        });
                }, (60 * 1000));

                scope.$watch('date', scope.updateTime);
            }
        };
    });
})(window.moment, window.Application);
