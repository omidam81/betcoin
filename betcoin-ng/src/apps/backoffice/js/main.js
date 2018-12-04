(function(require) {
    'use strict';

    var VENDOR_DIR = 'vendor';

    require.config({
        // packages we are pulling in from common
        packages: [
            'units/currency',
            'units/bc-route',
            'units/bc-socket',
            'units/bc-globals'
        ],
        paths: {
            angular: VENDOR_DIR + '/angular',
            uiRouter: VENDOR_DIR + '/angular-ui-router',
            uiBootstrap: VENDOR_DIR + '/angular-ui-bootstrap',
            ngResource: VENDOR_DIR + '/angular-resource',
            ipCookie: VENDOR_DIR + '/angular-cookie',
            base64: VENDOR_DIR + '/angular-base64',
            ocLazyLoad: VENDOR_DIR + '/ocLazyLoad',
            numberPrototypes: VENDOR_DIR + '/number-prototypes',
            'socket.io': VENDOR_DIR + '/socket.io'
        },
        shim: {
            angular: {exports: 'angular'},
            'socket.io': {exports: 'io'},
            ocLazyLoad: ['angular'],
            uiRouter: ['angular'],
            uiBootstrap: ['angular'],
            ngResource: ['angular'],
            ipCookie: ['angular'],
            base64: ['angular'],
            app: ['angular'],
            routes: ['angular'],
            modules: ['angular']
        }
    });

    require(['angular', 'numberPrototypes', 'modules/app-routes', 'routes', 'app'], function(angular) {
        console.debug('deps loaded, bootstrapping angular');
        angular.bootstrap(document, ['app']);
    });

})(window.require);
