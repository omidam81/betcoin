'use strict';

var rangeChooser = function() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'tpl/directives/range-chooser.html',
        scope: {
            submit: '&onSubmit'
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
            scope.timeValue = 24;
            scope.timeUnit = 'hours';
            scope.rangeType = 'time';

                // date defaults
            var now = new Date();
            scope.startDate = stripTime(new Date(now - (7 * 24 * 60 * 60 * 1000)));
            scope.endDate = stripTime(now);

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
            
            scope.rangeSubmit = function() {
                var range;
                if (scope.rangeType === 'time') {
                    range = timeRange();
                } else {
                    range = dateRange();
                }
                scope.submit({range: range});
            };
            scope.submit({range: timeRange()});
        }
    };
};
Application.Directives.directive('rangeChooser', [rangeChooser]);
