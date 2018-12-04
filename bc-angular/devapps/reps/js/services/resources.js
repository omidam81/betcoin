(function(angular, Application) {
    'use strict';

    var api = "https://<%= hostname %>";
    var url = api + "/rep";

    Application.Services.factory('WelcomePack', function($resource) {
        var WelcomePack = $resource(url + '/welcomepack/:_id');
        return WelcomePack;
    });

    Application.Services.factory('Affiliate', function($resource) {
        var Affiliate = $resource(url + '/affiliate/:_id');
        return Affiliate;
    });

})(window.angular, window.Application);
