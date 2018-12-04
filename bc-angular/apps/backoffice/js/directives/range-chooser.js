'use strict';

var rangeChooser = function($location) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'tpl/directives/range-chooser.html',
        scope: {
            submit: '&onSubmit',
            defaultType: '@type'
        },
        link: function(scope) {

            var stripTime = function(date) {
                var newDate = new Date();
                newDate.setUTCDate(date.getDate());
                newDate.setUTCMonth(date.getMonth());
                newDate.setUTCFullYear(date.getFullYear());
                newDate.setUTCHours(0);
                newDate.setUTCMinutes(0);
                newDate.setUTCSeconds(0);
                newDate.setUTCMilliseconds(0);
                return newDate;
            };

            // time defaults
            scope.timeValue = parseInt($location.search().timeValue, 10) || 24;
            scope.timeUnit = $location.search().timeUnit || 'hours';
            scope.rangeType = $location.search().rangeType || scope.defaultType || 'time';

            // date defaults
            var now = new Date();
            if (!scope.range) {
                scope.range = {};
            }

            if ($location.search().start || Date.parse($location.search().start)) {
                scope.startDate = new Date($location.search().start);
            } else {
                scope.startDate = scope.range.start ||
                    stripTime(new Date(now - (7 * 24 * 60 * 60 * 1000)));
            }

            if ($location.search().end || Date.parse($location.search().end)) {
                scope.endDate = new Date($location.search().end);
            } else {
                scope.endDate = scope.range.end ||
                    stripTime(new Date(now - (7 * 24 * 60 * 60 * 1000)));
            }

            var timeRange = function() {
                var value = scope.timeValue;
                var unit;
                switch (scope.timeUnit) {
                case 'minutes':
                    unit = (60 * 1000);
                    break;
                case 'hours':
                    unit = (60 * 60 * 1000);
                    break;
                case 'days':
                    unit = (24 * 60 * 60 * 1000);
                    break;
                case 'weeks':
                    unit = (7 * 24 * 60 * 60 * 1000);
                    break;
                case 'months':
                    unit = (30 * 24 * 60 * 60 * 1000);
                    break;
                }
                var now = new Date();
                return {
                    start: new Date(now - (value * unit)),
                    end: now
                };
            };

            var dateRange = function() {
                return {
                    start: stripTime(scope.startDate),
                    end: stripTime(new Date(scope.endDate.getTime() + (24 * 60 * 60 * 1000)))
                };
            };

            scope.sendRange = function() {
                var range;
                if (scope.rangeType === 'time') {
                    range = timeRange();
                } else {
                    range = dateRange();
                }
                scope.range = range;
                scope.submit({range: range});
            };

            scope.rangeSubmit = function() {
                var search = $location.search();
                search.rangeType = scope.rangeType;
                if (scope.rangeType === 'time') {
                    search.timeValue = scope.timeValue;
                    search.timeUnit = scope.timeUnit;
                    delete search.start;
                    delete search.end;
                } else {
                    search.start = scope.startDate.toISOString();
                    search.end = scope.endDate.toISOString();
                    delete search.timeValue;
                    delete search.timeUnit;
                }
                $location.search(search);
            };

            scope.sendRange();
        }
    };
};
Application.Directives.directive('rangeChooserBack', ['$location', rangeChooser]);
