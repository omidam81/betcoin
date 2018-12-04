(function(angular, Application) {
    'use strict';

    var api = "https://<%= hostname %>";
    var url = api + "/agent";

    Application.Services.factory('WelcomePack', function($resource) {
        var WelcomePack = $resource(url + '/welcomepack/:_id', {}, {
            unassigned: {
                method: 'GET',
                params: {
                    type: 'unassigned',
                },
                isArray: true
            }
        });
        return WelcomePack;
    });

    Application.Services.factory('Rep', function($resource) {
        var Rep = $resource(url + '/rep/:_id');
        return Rep;
    });

    Application.Services.factory('Affiliate', function($resource) {
        var Affiliate = $resource(url + '/affiliate/:_id');
        return Affiliate;
    });

})(window.angular, window.Application);
