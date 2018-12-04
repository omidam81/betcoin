(function(window, angular) {
    'use strict';

    if (window.io === undefined) {
        throw "No socket.io found!";
    }

    var bcPlayer = angular.module('bcPlayer', ['ng', 'ivpusic.cookie', 'ngResource', 'base64']);

    var cookieOptions = {
        path: '/'
    };

    bcPlayer.value('BCSession', {
        token: null,
        user: null,
        cookieName: 'player-api-token'
    });



    bcPlayer.provider('BCPlayer', function() {
        var hostname = "localhost";
        var port = 443;
        var scheme = "https";
        var base = "";
        var socketHostname = "localhost";
        var socketPort = 8443;
        var socketScheme = "https";
        var socketBase = "account";
        var cookieName = 'player-api-token';
        var publicPaths = [];
        var privatePaths = [];
        var creditDelay = false;


        var constructResourceUrl = function() {
            var urlString = constructHttpUrl();
            return urlString.replace(/([a-z]):([0-9])/, "$1\\:$2");
        };

        var constructHttpUrl = function() {
            var urlString = scheme + "://" + hostname + ":" + port;
            if (base.length) {
                urlString += "/" + base.replace((/^\//), "");
            }
            return urlString;
        };

        var constructSocketUrl = function() {
            var urlString = socketScheme + "://" + socketHostname + ":" + socketPort;
            if (socketBase.length) {
                urlString += "/" + socketBase.replace((/^\//), "");
            }
            return urlString;
        };

        this.serverConfig = function(conf) {
            hostname = conf.hostname || hostname;
            port = conf.port || port;
            scheme = conf.scheme || scheme;
            base = conf.base || base;
        };

        this.socketConfig = function(conf) {
            socketHostname = conf.hostname || socketHostname;
            socketPort = conf.port || socketPort;
            socketScheme = conf.scheme || socketScheme;
            socketBase = conf.base || socketBase;
        };

        this.cookieName = function(newName) {
            cookieName = newName;
        };

        this.publicPaths = function(paths) {
            publicPaths = paths;
        };

        this.privatePaths = function(paths) {
            privatePaths = paths;
        };

        this.setCreditDelay = function(delay) {
            delay = parseInt(delay, 10);
            if (isNaN(delay)) {
                throw "delay must be an integer";
            }
            creditDelay = delay;
        };

        var BCPlayer = function($rootScope, $http, $resource, $base64, $location, ipCookie, $q, BCSession, Socket) {
            var $scope = $rootScope.$new();
            BCSession.cookieName = cookieName;

            var url = constructHttpUrl();

            var resourceUrl = constructResourceUrl();

            var getUserId = function() {
                if (BCSession.user && BCSession.user._id) {
                    return BCSession.user._id;
                } else {
                    return undefined;
                }
            };

            var affTokenRegexp = /^[a-f0-9]+$/;

            var getAffiliateToken = function() {
                var token = $scope.getCookie('aff-token');
                if (!token || !affTokenRegexp.test(token)) {
                    token = $location.search().r;
                }
                return token;
            };

            var socketUrl = constructSocketUrl();
            console.log(socketUrl);
            var socket = Socket.getConnection(socketUrl);

            $scope.setCreditDelay = function(delay) {
                delay = parseInt(delay, 10);
                if (isNaN(delay)) {
                    throw "delay must be an integer";
                }
                creditDelay = delay;
            };
            $rootScope.removeLoading = false;

            $scope.$on('user update', function() {
                // timeout should allow loading time for assets but no matter the
                // delay value screen seems to take 30 seconds or more after
                // removeLoading is set to actually hide the loading div
                //
                //setTimeout(function() {
                    $rootScope.removeLoading = true;
                //}, 200);
            });

            $scope.$on('login error', function() {
                $rootScope.removeLoading = true;
            });

            socket.on('deposit', function(refId, amount, user) {
                $scope.$apply(function() {
                    BCSession.user = user;
                    $scope.$emit('deposit', refId, amount, user);
                    $scope.$emit('user update', user);
                });
                googleanalytics('send', 'event', 'account', 'balance', 'deposit', amount.toBitcoin());
            });

            socket.on('withdraw', function(user, transaction) {
                $scope.$apply(function() {
                    BCSession.user = user;
                    $scope.$emit('withdraw', user, transaction);
                    $scope.$emit('user update', user);
                });
                googleanalytics('send', 'event', 'account', 'balance', 'withdraw', transaction.amtOut.toBitcoin());
            });

            socket.on('debit', function(user, transaction) {
                BCSession.user = user;
                $scope.$emit('debit', user, transaction);
                $scope.$emit('user update', user);
            });

            socket.on('credit', function(user, transaction) {
                if (creditDelay) {
                    setTimeout(function(user, transaction) {
                        BCSession.user = user;
                        $scope.$emit('credit', user, transaction);
                        $scope.$emit('user update', user);
                    }, creditDelay, user, transaction);
                } else {
                    BCSession.user = user;
                    $scope.$emit('credit', user, transaction);
                    $scope.$emit('user update', user);
                }
            });

            socket.on('subscribe error', function(err) {
                $scope.error = err;
                BCPlayer.user = null;
                BCSession.token = null;
                ipCookie.remove(BCSession.cookieName);
                $scope.$emit('user update', null);
            });

            $scope.url = url;
            $scope.resourceUrl = resourceUrl;
            $scope.publicPaths = publicPaths;
            $scope.privatePaths = privatePaths;

            $scope.login = function(identity, password, method, oneTimePass) {
                var deferred = $q.defer();
                var self = this;
                var headers = {};
                if (identity && password) {
                    headers = {
                        Authorization: 'Basic ' + $base64.encode(identity + ":" + password)
                    };
                } else if (!BCSession.token) {
                    return $scope.$emit("login error", {error: "Bad Request", message: "No credentials found", errCode: "059", status: 400});
                }
                var loginUrl = url + "/auth?";
                if(method){
                    loginUrl += 'method=' + method +'&';
                }
                if(oneTimePass){
                    loginUrl += 'one_time_pass=' + oneTimePass;
                }
                $http.get(loginUrl, {
                    headers: headers
                }).success(function(user) {
                    BCSession.user = user;
                    ipCookie('userId', user._id, cookieOptions);
                    if(method === undefined){
                        ipCookie('lastAlias', identity, cookieOptions);
                    }
                    if(method === 'address'){
                        ipCookie('lastAddress', identity, cookieOptions);
                    }
                    self.socket.emit('subscribe', user._id);
                    $scope.$emit('user update', user);
                    $scope.$emit('login', user);
                    googleanalytics('send', 'event', 'account', 'auth', 'login');
                    deferred.resolve(user);
                }).error(function(error, status) {
                    error.status = status;
                    BCSession.user = null;
                    BCSession.token = null;
                    ipCookie.remove(BCSession.cookieName);
                    console.error('login error', error);
                    $scope.$emit('login error', error);
                    googleanalytics('send', 'event', 'account', 'auth', 'login error');
                    deferred.reject(error);
                });
                return deferred.promise;
            };
            $scope.registerAnonymous = function(address, currency) {
                var deferred = $q.defer();
                var self = this;
                var data = {
                    withdrawAddress: address,
                    currency: currency,
                    anonymous: true
                };
                $http.post(url + '/user', data).success(function(user) {
                    BCSession.user = user;
                    ipCookie('userId', user._id, cookieOptions);
                    ipCookie('lastAnon', address, cookieOptions);
                    self.socket.emit('subscribe', user._id);
                    $scope.$emit('user update', user);
                    $scope.$emit('login', user);
                    googleanalytics('send', 'event', 'account', 'auth', 'anonymous login');
                    deferred.resolve(user);
                }).error(function(error) {
                    BCSession.user = null;
                    BCSession.token = null;
                    googleanalytics('send', 'event', 'account', 'auth', 'anonymous login error');
                    ipCookie.remove(BCSession.cookieName);
                    console.error('login error', ipCookie(BCSession.cookieName), BCSession.cookieName);
                    deferred.reject(error);
                });
                return deferred.promise;
            };
            $scope.logout = function() {
                var deferred = $q.defer();
                $scope.User.delete({_id: BCSession.user._id}, function() {
                    BCSession.user = null;
                    BCSession.token = null;
                    ipCookie.remove(BCSession.cookieName);
                    $scope.$emit('user update', null);
                    $scope.$emit('logout');
                    googleanalytics('send', 'event', 'account', 'auth', 'logout');
                    deferred.resolve();
                    window.location.reload();
                });
                return deferred.promise;
            };
            $scope.auth = this.login;
            $scope.getToken = function() {
                return ipCookie(BCSession.cookieName);
            };
            $scope.Ticket = $resource(resourceUrl + '/ticket/:id/:action/:actionParam', {id: '@_id'}, {
                listStatus: {
                    method: 'GET',
                    params: {
                        id: 'status'
                    }
                },
                comment: {
                    method: 'POST',
                    params: {
                        action: 'comment'
                    }
                }
            });
            $scope.Affiliate = $resource(resourceUrl + "/affiliate/:affiliateId/:target/:targetId", {
                affiliateId: getUserId
            }, {
                stats: {
                    method: 'GET',
                    params: {
                        start: new Date(new Date() - (7 * 24 * 60 * 60 * 1000)).toISOString(),
                        end: new Date().toISOString()
                    }
                },
                mark: {
                    method: 'POST',
                    params: {
                        affiliateId: getAffiliateToken
                    }
                },
                getAssociateTransactions: {
                    method: 'GET',
                    params: {
                        affiliateId: getUserId,
                        target: 'associate'
                    }
                },
                getAssociatesTotals: {
                    method: 'GET',
                    params: {
                        affiliateId: getUserId,
                        target: 'associates'
                    },
                    isArray: true
                }
            });
            $scope.User = $resource(resourceUrl + "/user/:id/:target/:targetId/:action/:currency/:range", {
                id: getUserId
            }, {
                update: {
                    method: 'PUT',
                    interceptor: {
                        response: function(response) {
                            googleanalytics('send', 'event', 'account', 'edit');
                            return response || $q.when(response);
                        }
                    }
                },
                getChallenge: {
                    method: 'GET',
                    params: {
                        action: 'challenge',
                        id: getUserId
                    }
                },
                getTotpSecret: {
                    method: 'POST',
                    params: {
                        id: getUserId,
                        target: 'totp'
                    }
                },
                activateTotp: {
                    method: 'PUT',
                    params: {
                        id: getUserId,
                        target: 'totp',
                        action: 'activate',
                        range: '@oneTimePass'
                    }
                },
                deactivateTotp: {
                    method: 'PUT',
                    params: {
                        id: getUserId,
                        target: 'totp',
                        action: 'deactivate'
                    }
                },
                withdraw: {
                    method: 'GET',
                    params: {
                        action: 'withdraw',
                        id: getUserId
                    },
                    interceptor: {
                        responseError: function(response) {
                            googleanalytics('send', 'event', 'account', 'balance', 'withdraw error: ' + response.data);
                            return $q.reject(response);
                        }
                    }
                },
                acceptBonus: {
                    method: 'GET',
                    params: {
                        target: 'bonus',
                        action: 'accept',
                        currency: 'btc'
                    }
                },
                rejectBonus: {
                    method: 'GET',
                    params: {
                        target: 'bonus',
                        action: 'reject',
                        currency: 'btc'
                    }
                },
                addWithdrawAddress: {
                    method: 'PUT',
                    params: {
                        target: 'address',
                        action: 'withdraw',
                        currency: 'btc',
                        id: getUserId
                    }
                },
                newTicket: {
                    method: 'POST',
                    params: {
                        id: getUserId,
                        target: 'ticket'
                    }
                },
                commentTicket: {
                    method: 'POST',
                    params: {
                        id: getUserId,
                        target: 'ticket',
                        targetId: '@_id',
                        action: 'comment'
                    }
                },
                updateTicket: {
                    method: 'PUT',
                    params: {
                        id: getUserId,
                        target: 'ticket',
                        targetId: '@_id',
                        action: 'status',
                        currency: '@newStatus'
                    }
                },
                markMessageRead: {
                    method: 'PUT',
                    params: {
                        target: 'notification',
                        targetId: '@notificationId',
                        action: 'read'
                    }
                },
                dismissMessage: {
                    method: 'DELETE',
                    params: {
                        target: 'notification'
                    },
                    interceptor: {
                        response: function(response) {
                            googleanalytics('send', 'event', 'account', 'notifications', 'dismiss');
                            return response || $q.when(response);
                        }
                    }
                },
                sendSupportEmail: {
                    method: 'POST',
                    params: {
                        target: 'message',
                        action: 'send',
                        id: getUserId
                    }
                },
                getNotifications: {
                    method: 'GET',
                    isArray: true,
                    params: {
                        target: 'notification',
                        id: getUserId
                    },
                    interceptor: {
                        response: function(response) {
                            googleanalytics('send', 'event', 'account', 'notifications', 'retrieve');
                            return response || $q.when(response);
                        }
                    }
                },
                getTransactions: {
                    method: 'GET',
                    params: {
                        id: getUserId,
                        target: 'transaction',
                        currency: 'btc',
                        range: '2012-01-01'
                    },
                    interceptor: {
                        response: function(response) {
                            googleanalytics('send', 'event', 'account', 'history', 'retrieve');
                            return response || $q.when(response);
                        }
                    }
                },
                getCashbacks: {
                    method: 'GET',
                    isArray: true,
                    params: {
                        id: getUserId,
                        target: 'cashbackhistory',
                        currency: 'btc'
                    },
                    interceptor: {
                        response: function(response) {
                            googleanalytics('send', 'event', 'account', 'cashbackhistory', 'retrieve');
                            return response || $q.when(response);
                        }
                    }
                },
                getTransactionTotals: {
                    method: 'GET',
                    params: {
                        id: getUserId,
                        target: 'transactions',
                        action: 'totals',
                        currency: 'btc',
                    }
                }
            });
            $scope.verifyAlias = function (alias){
                var deferred = $q.defer();
                $http.get(url + '/verify/alias/' + alias)
                    .success(function(data){
                        return deferred.resolve(data);
                    })
                    .error(function(err, status) {
                        err.status = status;
                        return deferred.reject(err);
                    });
                return deferred.promise;
            };
            $scope.verifyAddress = function (withdrawAddress){
                var deferred = $q.defer();
                $http.get(url + '/verify/withdrawAddress/' + withdrawAddress)
                    .success(function(data){
                        return deferred.resolve(data);
                    })
                    .error(function(err, status) {
                        err.status = status;
                        return deferred.reject(err);
                    });
                return deferred.promise;
            };
            $scope.socket = socket;
            // $scope.socketSubscribe = function() {
            //     socket.emit('subscribe', BCSession.token);
            // };
            $scope.onMessage = function(cb) {
                return socket.on('notification', cb);
            };
            $scope.onMessageUnreadCount = function(cb) {
                socket.on('notification unread', cb);
            };
            $scope.isPublic = function(path) {
                path = '/' + path.split('/')[1];
                if (this.privatePaths.indexOf(path) >= 0) { // respect prohibited paths fist
                    return false;
                } else if (this.publicPaths.indexOf(path) >= 0) { // allow explicitly
                    return true;
                } else if (this.publicPaths.length === 0) { // if not prohibited and nothing is explicitly public, allow
                    return true;
                } else { // default deny access
                    return false;
                }
            };
            $scope.clearUserCache = function() {
                ipCookie.remove('userId');
            };
            $scope.saveUserIdCache = function(userId) {
                ipCookie('userId', userId, cookieOptions);
            };
            $scope.saveCookie = function(key, val) {
                ipCookie(key, val, cookieOptions);
            };
            $scope.getCookie = function(key) {
                return ipCookie(key);
            };
            $scope.removeCookie = function(key) {
                ipCookie.remove(key, cookieOptions);
            };
            $scope.markAffiliate = function() {
                var token = getAffiliateToken();
                if(token) {
                    $scope.Affiliate.mark(function() {
                        $scope.saveCookie('aff-token',token);
                    }, function() {
                        $scope.saveCookie('aff-token',token);
                    });
                }
            };
            return $scope;
        };

        this.$get = [
            '$rootScope',
            '$http',
            '$resource',
            '$base64',
            '$location',
            'ipCookie',
            '$q',
            'BCSession',
            'Socket',
            BCPlayer
        ];
    });

    bcPlayer.run(['$rootScope', 'ipCookie', 'BCSession', 'BCPlayer', function($rootScope, ipCookie, BCSession, BCPlayer) {
        // if a token exists when this is run, tru subscribing to the socket viw token
        BCSession.token = ipCookie(BCSession.cookieName);



        BCPlayer.login();

        BCPlayer.markAffiliate();

        $rootScope.BCSession = BCSession;
    }]);

    bcPlayer.config(['$httpProvider', function($httpProvider) {
        var interceptor = function($q, $rootScope, ipCookie, BCSession, PlayerApi) {
            BCSession.token = ipCookie(BCSession.cookieName);
            return {
                'request': function(config) {
                    if (BCSession.token && config.headers.Authorization === undefined) {
                        config.headers.Authorization = "Bearer " + BCSession.token;
                    }
                    return config || $q.when(config);
                },
                'response': function(response) {
                    var token = response.headers('api-token');
                    if (token) {
                        BCSession.token = token;
                        ipCookie(BCSession.cookieName, token, cookieOptions);
                    }
                    return response || $q.when(response);
                },
                'responseError': function(rejection) {
                    if (rejection.status === 401 || rejection.status === 403) {
                        BCSession.token = null;
                        ipCookie.remove(BCSession.cookieName);
                    }
                    if (rejection.status === 404 && rejection.data === '' && rejection.config.url.indexOf(PlayerApi.hostname+':'+PlayerApi.port) !== -1){
                        setTimeout(function() {
                                $rootScope.$broadcast('new notification', {type: 'server_unreachable'});
                        },5000);
                    }
                    return $q.reject(rejection);
                }
            };
        };
        $httpProvider.interceptors.push(['$q', '$rootScope', 'ipCookie', 'BCSession', 'PlayerApi', interceptor]);
    }]);
})(window, window.angular);
