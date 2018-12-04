'use strict';

var templateString = "";

templateString += "<dl>";
templateString += "<dt>GMT</dt>";
templateString += "<dd>Since: {{ utcSince }}</dd>";
templateString += "<dd>Until: {{ utcUntil }}</dd>";
// templateString += "<dt>Local Time (GMT {{ gmtOffset }})</dt>";
// templateString += "<dd>Since: {{ localSince }}</dd>";
// templateString += "<dd>Until: {{ localUntil }}</dd>";
templateString += "</dl>";

function pad(number, length){
    var str = "" + number;
    while (str.length < length) {
        str = '0'+str;
    }
    return str;
}


var rangeDisplay = function() {
    return {
        replace: true,
        restrict: 'E',
        template: templateString,
        scope: {
            since: '=',
            until: '='
        },
        link: function(scope) {
            var offset = new Date().getTimezoneOffset();
            scope.gmtOffset = ((offset<0? '+':'-') + pad(parseInt(Math.abs(offset/60)), 2) + pad(Math.abs(offset%60), 2));
            scope.$watch('since', function(newVal) {
                if (!newVal) {
                    scope.utcSince = 'BAD DATE';
                    return;
                }
                var since = new Date(newVal);
                scope.utcSince = since.toUTCString();
            });
            scope.$watch('until', function(newVal) {
                if (!newVal) {
                    scope.utcUntil = 'BAD DATE';
                    return;
                }
                var until = new Date(newVal);
                scope.utcUntil = until.toUTCString();
            });
        }
    };
};
Application.Directives.directive('rangeDisplay', [rangeDisplay]);
