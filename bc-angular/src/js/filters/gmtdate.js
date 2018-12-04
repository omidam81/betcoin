(function(Application) {
    'use strict';
    var pad = function(input) {
        if (parseInt(input, 10) < 10) {
            return '0' + input;
        } else {
            return input;
        }
    };

    Application.Filters.filter('gmtdate', function() {
        return function(dateString, unit) {
            if (!unit) {
                unit = 'day';
            }
            var date = new Date(dateString);
            dateString = "";
            dateString += date.getUTCFullYear();
            dateString += "/" + pad(date.getUTCMonth() + 1);
            if (unit === 'day') {
                dateString += "/" + pad(date.getUTCDate());
            }
            return dateString;

        };
    });

    Application.Filters.filter('datetime', function() {
        return function(dateString) {
            var date = new Date(dateString);
            dateString = "";
            dateString += date.getFullYear();
            dateString += "/" + pad(date.getMonth() + 1);
            dateString += "/" + pad(date.getDate());
            dateString += " " + pad(date.getHours());
            dateString += ":" + pad(date.getMinutes());
            dateString += ":" + pad(date.getSeconds());
            return dateString;

        };
    });


    Application.Filters.filter('gmtdatetime', function() {
        return function(dateString) {
            var date = new Date(dateString);
            dateString = "";
            dateString += date.getUTCFullYear();
            dateString += "/" + pad(date.getUTCMonth() + 1);
            dateString += "/" + pad(date.getUTCDate());
            dateString += " " + pad(date.getUTCHours());
            dateString += ":" + pad(date.getUTCMinutes());
            dateString += ":" + pad(date.getUTCSeconds());
            return dateString;

        };
    });
})(window.Application);
