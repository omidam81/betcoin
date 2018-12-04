(function(angular, Application) {
    'use strict';

    var api = "https://<%= hostname %>";

    Application.Services.factory('User', function($resource) {
        var User = $resource(api + '/user/:_id');
        return User;
    });

})(window.angular, window.Application);
