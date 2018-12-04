(function(define) {
    'use strict';

    define(['angular', 'ngResource', 'ipCookie'], function(angular) {
        var module = angular.module('bc.session', [
            'ng',
            'ngResource',
            'ivpusic.cookie',
            'bc.globals',
            'bc.server',
            'bc.user'
        ]);

        var COOKIE_OPTS = {
            path: '/'
        };
        var TOKEN_REGEXP = /[a-f0-9]{32}/i;
        var TOKEN_COOKIE = 'bc-auth-token';
        var CURRENCY_COOKIE = 'bc-currency';
        var LOCALE_COOKIE = 'bc-locale';
        var FIAT_COOKIE = 'bc-fiat';

        var NULL_TOKEN; // = undefined

        /**
         * BCSession
         *
         * A class with read only properties about the current user
         * session. Used as a module service constructor
         *
         * Parameters are injected by angular
         *
         * @param {} $window
         * @param {} ipCookie
         */
        var BCSession = function($window, $q, ipCookie, CURRENCIES, FIAT_CURRENCIES) {
            this.cookie = ipCookie;
            this.CURRENCIES = CURRENCIES;
            this.FIAT_CURRENCIES = FIAT_CURRENCIES;
            this.location = angular.copy($window.location);
            this.defer = function() {
                return $q.defer.apply($q, arguments);
            };
            this.NULL_TOKEN = NULL_TOKEN;
            // set token to a null token when we instatioate. the
            // getter will try to get it from the cookie when it is
            // first needed
            this._token = NULL_TOKEN;

            // we store a login promise here so it can be used by
            // multiple gentleman callers
            this._loginQ = undefined;
        };

        BCSession._fiatGetter = function() {
            if (this._fiat) {
                return this._fiat;
            }
            var fiat = this.cookie(FIAT_COOKIE);
            if (!fiat || this.FIAT_CURRENCIES.indexOf(fiat) < 0) {
                fiat = (this.locale === 'en_US') ? 'USD' : 'CNY';
                // set the cookie for next time
                this.cookie(FIAT_COOKIE, fiat);
            }
            this._fiat = fiat;
            return fiat;
        };

        BCSession._localeGetter = function() {
            if (this._locale) {
                return this._locale;
            }
            var locale = this.cookie(LOCALE_COOKIE);
            if (!locale) {
                locale = 'en_US';
                if (this.location.origin === 'https://caishentang.com') {
                    locale = 'zh_CN';
                }
                // set the cookie for next time
                this.cookie(LOCALE_COOKIE, locale);
            }
            this._locale = locale;
            return locale;
        };

        BCSession._currencySetter = function(currency) {
            currency = currency.toString().toLowerCase();
            if (this.CURRENCIES.indexOf(currency) < 0) {
                throw new Error('Invalid currency set: ' + currency);
            }
            this._currency = currency;
            this.cookie(CURRENCY_COOKIE, currency);
        };

        BCSession._currencyGetter = function() {
            if (this._currency) {
                return this._currency;
            }
            var currency = this.cookie(CURRENCY_COOKIE);
            if (!currency || this.CURRENCIES.indexOf(currency) < 0) {
                currency = 'bitcoin';
                this.cookie(CURRENCY_COOKIE, currency);
            }
            this._currency = currency;
            return currency;
        };

        BCSession._tokenSetter = function(token) {
            if (token === NULL_TOKEN) {
                this.cookie.remove(TOKEN_COOKIE, COOKIE_OPTS);
            } else {
                if ('string' !== typeof token || !TOKEN_REGEXP.test(token)) {
                    throw new Error("Invalid token set: " + token);
                }
                token = token.toString().toLowerCase();
            }
            this._token = token;
            this.cookie(TOKEN_COOKIE, token, COOKIE_OPTS);
        };

        BCSession._tokenGetter = function() {
            if (this._token !== NULL_TOKEN) {
                return this._token;
            }
            var token = this.cookie(TOKEN_COOKIE);
            this._token = token;
            return token;
        };

        Object.defineProperty(BCSession.prototype, 'fiat', {get: BCSession._fiatGetter});
        // alias locale and lang values
        Object.defineProperty(BCSession.prototype, 'locale', {get: BCSession._localeGetter});
        Object.defineProperty(BCSession.prototype, 'lang', {get: BCSession._localeGetter});
        Object.defineProperty(BCSession.prototype, 'currency', {
            get: BCSession._currencyGetter,
            set: BCSession._currencySetter
        });
        Object.defineProperty(BCSession.prototype, 'token', {
            get: BCSession._tokenGetter,
            set: BCSession._tokenSetter
        });

        Object.defineProperty(BCSession.prototype, 'authenticated', {
            get: function() { if (this._token && this.user) { return true; } }
        });

        BCSession.prototype.login = function(username, password, otp) {
            console.debug("BCSession.login()");
            if (this._loginQ !== undefined) {
                console.debug("we are already logging in, returning the existing promise");
                return this._loginQ.promise;
            }
            var $injector = angular.injector(['ng', 'bc.session']);
            var self = this;
            this._loginQ = this.defer();
            this._loginQ.promise.finally(function() {
                console.debug("session loginQ is finished");
                self._loginQ = undefined;
            });
            // we have to do this to prevent circular dependencies,
            // load the BCAuth service when this function is called
            // versus when we instantiate BCSession
            $injector.invoke(['User', 'Wallets', function(User, Wallets) {
                var httpPromise;
                if (self.token) {
                    console.debug('attempting to log in with token');
                    httpPromise = User.token().catch(function(error) {
                        self.token = NULL_TOKEN;
                        throw error;
                    });
                } else if (username && password){
                    console.debug('attempting to log in with username and password');
                    httpPromise = User.login(username, password, otp);
                } else {
                    self._loginQ.reject(new Error("No token"));
                }
                httpPromise.then(function(response) {
                    self.user = response.user;
                    self.token = self.user.token;
                    Wallets.get({
                        userId: self.user._id
                    }, function(wallets) {
                        self.wallets = wallets;
                        self._loginQ.resolve(self.user);
                    });
                }, function(error) {
                    self._loginQ.reject(error);
                });
            }]);
            return this._loginQ.promise;
        };

        BCSession.prototype.logout = function() {
            var self = this;
            var logoutFinish = function() {
                console.debug("removing token", self.token);
                self.token = NULL_TOKEN;
                delete self.user;
                console.log("logged out", self.token, self.user, arguments);
            };
            return this.user.logout().then(logoutFinish).finally(logoutFinish);
        };

        module.service('BCSession', [
            '$window',
            '$q',
            'ipCookie',
            'CURRENCIES',
            'FIAT_CURRENCIES',
            BCSession
        ]);

        module.config(['$httpProvider', function($httpProvider) {
            var interceptor = function($q, ipCookie, BCSession) {
                return {
                    'request': function(config) {
                        config.headers['X-Lang'] = BCSession.lang;
                        if (!config.headers['X-Currency']) {
                            config.headers['X-Currency'] = BCSession.currency;
                        }
                        if (BCSession.token !== NULL_TOKEN && config.headers.Authorization === undefined) {
                            config.headers.Authorization = "Bearer " + BCSession.token;
                        }
                        return config || $q.when(config);
                    },
                    'response': function(response) {
                        var token = response.headers('api-token');
                        if (token) {
                            BCSession.token = token;
                            ipCookie(TOKEN_COOKIE, token, COOKIE_OPTS);
                        }
                        return response || $q.when(response);
                    },
                    'responseError': function(rejection) {
                        return $q.reject(rejection);
                    }
                };
            };
            $httpProvider.interceptors.push([
                '$q',
                'ipCookie',
                'BCSession',
                interceptor
            ]);
        }]);

        return module;
    });

})(window.define);
