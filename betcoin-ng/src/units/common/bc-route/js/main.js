(function(define) {
    'use strict';

    define(['angular'], function(angular) {
        var module = angular.module('bc.route', ['ng', 'oc.lazyLoad']);

        var REPLACE_EXT_REGEXP = /.html$/;

        var BCRouteProvider = function($stateProvider) {
            this.state = function() {
                $stateProvider.state.apply($stateProvider, arguments);
            };
        };

        BCRouteProvider.prototype.setupRoutes = function(config) {
            // here we will store the generated routes
            var deferred = {};
            var unit, baseRouteName;
            if (config.unit && config.name) {
                unit = config.unit;
                baseRouteName = config.name;
            } else if (config.name) {
                unit = baseRouteName = config.name;
            } else {
                unit = baseRouteName = config.unit;
            }
            if (!unit) {
                throw new Error("invalid route config, no unit or name provided");
            }
            var baseUrl = config.url || '/' + unit;
            var controllerName = config.controller || unit[0].toUpperCase() + unit.slice(1) + 'Controller';

            var baseTemplates = [];

            // set up the base route for the unit
            var baseRoute = {
                url: baseUrl,
                name: baseRouteName,
            };

            // set default resolve functions
            var defaultResolve = {
                module: ['$ocLazyLoad', function($ocLazyLoad) {
                    console.debug('trying to resolve ' + unit + ' module');
                    return $ocLazyLoad.load({
                        name: 'app.' + unit,
                        files: ['units/' + unit + '/main']
                    }).then(function() {
                        console.debug('' + unit + ' module resolved');
                    });
                }],
                templates: [
                    '$ocLazyLoad',
                    '$q',
                    '$templateCache',
                    '$location',
                    function($ocLazyLoad, $q, $templateCache, $location) {
                        deferred[$location.path()] = $q.defer();
                        console.debug('trying to resolve ' + unit + '.templates');
                        return $ocLazyLoad.load({
                            name: unit + '.templates',
                            files: ['units/' + unit + '/templates']
                        }).then(function() {
                            console.debug(unit + '.templates resolved');
                            console.debug(baseTemplates);
                            baseTemplates.forEach(function(template) {
                                var deferredHtml = deferred[template.file];
                                if (deferredHtml) {
                                    deferredHtml.resolve($templateCache.get(template.file));
                                } else {
                                    console.error("no deferred html", template);
                                }
                            });
                            return $templateCache.get;
                        });
                    }]
            };
            if (config.resolve !== false) {
                // check for resolve overrides
                baseRoute.resolve = angular.extend(defaultResolve, config.resolve || {});
            }

            if (config.abstract) {
                baseRoute.abstract = true;
            }

            if (controllerName) {
                baseRoute.controller = controllerName;
            }

            if (config.views) {
                var views = {};
                angular.forEach(config.views, function(viewConf, viewName) {
                    var templateName = viewConf.template;
                    if (templateName) {
                        templateName = viewConf.template.replace(REPLACE_EXT_REGEXP, '');
                    } else {
                        // get just the part before the context reference
                        templateName = viewName.split('@')[0];
                    }
                    // if this is a blank view name, then use index as the default
                    if (templateName === '') {
                        templateName = 'index';
                    }
                    var templateFile = '/' + unit + '/' + templateName + '.html';
                    var view = {
                        controller: viewConf.controller || controllerName,
                        templateProvider: ['$q', function($q) {
                            console.debug('calling templateProvider for ' + unit + '.' + templateName);
                            if (!deferred[templateFile]) {
                                console.debug('creating deferred for', templateFile);
                                deferred[templateFile] = $q.defer();
                            }
                            return deferred[templateFile].promise.then(function(html) {
                                console.debug('got ' + templateFile);
                                return html;
                            });
                        }],
                    };
                    views[viewName] = view;
                    baseTemplates.push({name: templateName, file: templateFile});
                });
                baseRoute.views = views;
            } else {
                var templateName = config.template ? config.template.replace(REPLACE_EXT_REGEXP, '') : 'index';
                var templateFile = '/' + unit + '/' + templateName + '.html';

                if (config.simpleTemplate === true) {
                    baseRoute.templateProvider = ['$templateCache', function($templateCache) {
                        return $templateCache.get(templateFile);
                    }];
                } else {
                    baseTemplates = [{name: templateName, file: templateFile}];
                    baseRoute.templateProvider = ['$q', function($q) {
                        console.debug('calling templateProvider for ' + unit + '.' + templateName);
                        if (!deferred[templateFile]) {
                            deferred[templateFile] = $q.defer();
                        }
                        return deferred[templateFile].promise.then(function(html) {
                            console.debug('got ' + templateFile);
                            console.debug(arguments);
                            return html;
                        });
                    }];
                }
            }

            this.state(baseRoute);
            var children = {};
            angular.forEach(config.children, function(childConf, child) {
                var routeName = unit + '.' + child;
                var templateName = childConf.template ? childConf.template.replace(REPLACE_EXT_REGEXP, '') : child;
                var templateFile = '/' + unit + '/' + templateName + '.html';
                var route = {
                    url: childConf.url,
                    name: routeName,
                    parent: baseRoute,
                    templateProvider: ['$location', '$q', function($location, $q) {
                        console.debug('calling templateProvider for ' + routeName);
                        if (!deferred[$location.path()]) {
                            deferred[$location.path()] = $q.defer();
                        }
                        return deferred[$location.path()].promise.then(function(html) {
                            console.debug("got " + routeName + " html");
                            return html;
                        });
                    }],
                    resolve: {
                        load: ['module', 'templates', '$location', function(module, templates, $location) {
                            console.debug(routeName + ' resolved');
                            return deferred[$location.path()].resolve(templates(templateFile));
                        }],
                    }
                };
                children[child] = route;
                this.state(route);
            }, this);

            return {
                base: baseRoute,
                children: children
            };
        };

        BCRouteProvider.prototype.$get = angular.noop;

        module.provider('BCRoute', ['$stateProvider', BCRouteProvider]);

        return module;
    });
})(window.define);
