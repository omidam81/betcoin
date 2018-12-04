'use strict';


Application.Directives.directive('logSearchLink', [function() {
    return {
        replace: false,
        restrict: 'A',
        template: '<a ng-href="search/logs?__sort=timestamp_desc&q_level=__nin_silly||verbose&q_timestamp=__gte_{{range.start}}&q_timestamp=__lte_{{range.end}}">{{displayVal}}</a>',
        scope: {
            date: '@',
            buffer: '@'
        },
        link: function(scope) {
            var buffer = scope.buffer || 30;
            var date = new Date(scope.date);
            scope.range = {
                start: new Date(date.getTime() - (buffer * 1000)).toISOString(),
                end: new Date(date.getTime() + (buffer * 1000)).toISOString(),
            };
            scope.displayVal = date.toISOString();
        }
    };
}]);
