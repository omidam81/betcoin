(function(define) {
    'use strict';

    define(['angular'], function(angular) {
        var module = angular.module('bc.server', ['ng']);

        // this string is fixed up by the gulp build system, using
        // the conf variable as it's value
        var Server = function() {
            this.urlString = 'https://<%- apiSubdomain %>.betcoin.tm';
            this.basePath = '/backoffice';
        };

        Server.prototype.toString = function() {
            return this.urlString;
        };

        Server.prototype.url = function(path) {
            if (path === undefined) {
                return this.urlString + this.basePath;
            }
            if (path[0] !== '/') {
                path = '/' + path;
            }
            return this.urlString + this.basePath + path;
        };

        Server.prototype.socketUrl = function() {
            return this.urlString;
        };

        Server.prototype.resourceUrl = function(path) {
            var url = (this.urlString + this.basePath).replace(/([a-z]):([0-9])/, "$1\\:$2");
            if (path === undefined) {
                return url;
            }
            if (path[0] !== '/') {
                path = '/' + path;
            }
            return url + path;
        };

        module.service('BCServer', [Server]);
    });

})(window.define);
