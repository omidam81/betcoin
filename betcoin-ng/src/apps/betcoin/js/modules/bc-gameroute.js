(function(define) {
    'use strict';

    define(['angular', 'units/bc-route'], function(angular) {
        var module = angular.module('bc.gameroute', ['ng', 'oc.lazyLoad', 'bc.route']);

        var BCGameRouteProvider = function(BCRouteProvider) {
            this.route = BCRouteProvider;
        };

        BCGameRouteProvider.prototype.setupRoutes = function(config) {
            // here we will store the generated routes
            var deferred = {};
            var unit = config.name;
            // all game base viewws are abstract
            config.abstract = true;
            var controllerName = unit[0].toUpperCase() + unit.slice(1) + 'Controller';
            // set up the base route for the game unit
            config.views = {
                // this references the ui-view on the main index.html page
                '': {
                    controller: controllerName,
                    templateProvider: ['$location', '$q', function($location, $q) {
                        console.debug('calling templateProvider for ' + unit + '.index');
                        if (!deferred.index) {
                            deferred.index = $q.defer();
                        }
                        return deferred.index.promise.then(function(html) {
                            console.debug('got ' + unit + '.index html');
                            return html;
                        });
                    }],
                }
            };

            // this references the ui-view='gamecontrols' div in the index.html file
            config.views['gamecontrols@' + unit] = {
                controller: controllerName,
                templateProvider: ['$location', '$q', function($location, $q) {
                    console.debug('calling templateProvider for ' + unit + '.gamecontrols');
                    if (!deferred.gamecontrols) {
                        deferred.gamecontrols = $q.defer();
                    }
                    return deferred.gamecontrols.promise.then(function(html) {
                        console.debug('got ' + unit + '.gamecontrols html');
                        return html;
                    });
                }],
            };

            var routes = this.route.setupRoutes(config);
            return routes;
        };

        BCGameRouteProvider.prototype.$get = angular.noop;

        module.provider('BCGameRoute', ['BCRouteProvider', BCGameRouteProvider]);

        return module;
    });
})(window.define);
