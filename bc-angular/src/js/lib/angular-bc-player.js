(function(window, angular, async) {
    'use strict';

    if (window.io === undefined) {
        throw "No socket.io found!";
    }

    var bcPlayer = angular.module('bcPlayer', ['ng', 'ivpusic.cookie', 'ngResource', 'base64']);

    var cookieOptions = {
        path: '/'
    };

    var BCSession = function() {

    };

    bcPlayer.service('BCSession', [BCSession]);

    bcPlayer.provider('BCPlayer', function() {
        var hostname = "localhost";
        var port = 443;
        var scheme = "https";
        var base = "user";
        var socketHostname = "localhost";
        var socketPort = 443;
        var socketScheme = "https";
        var socketBase = "";
        var cookieName = 'player-api-token';
        var publicPaths = [];
        var privatePaths = [];
        var creditDelay = false;


        var constructResourceUrl = function() {
            var urlString = constructHttpUrl();
            return urlString.replace(/([a-z]):([0-9])/, "$1\\:$2");
        };

        var constructHttpHostUrl = function() {
            var urlString = scheme + "://" + hostname + ":" + port;
            return urlString;
        };

        var constructHttpUrl = function() {
            var urlString = constructHttpHostUrl();
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

        var isBackoffice = false;
        this.isBackoffice = function(val) {
            if (val === undefined) {
                return isBackoffice;
            }
            isBackoffice = val;
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

            if(!ipCookie('currency')){
                ipCookie('currency', 'bitcoin', cookieOptions);
            }
            BCSession.token = null;
            BCSession.user = null;
            BCSession.currency = ipCookie('currency');
            $rootScope.$on('currencyChange', function(event, currency){
                ipCookie('currency', currency, cookieOptions);
                BCSession.currency = currency;
            });

            $scope.isBackoffice = isBackoffice;
            BCSession.isBackoffice = isBackoffice;

            var urlRoot = constructHttpHostUrl();
            $scope.urlRoot = urlRoot;

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
            var socket = Socket.getConnection(socketUrl);
            $scope.socket = socket;

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
                // $rootScope.removeLoading = true;
                //}, 200);
            });

            $scope.$on('login error', function() {
                $rootScope.removeLoading = true;
            });
            $scope.$on('valid wallet', function() {
                $rootScope.removeLoading = true;
            });
            $scope.$on('invalid wallet', function() {
                $rootScope.removeLoading = true;
            });

            socket.on('error', function(err) {
                console.error("socket error! : ", err);
            });

            socket.on('deposit', function(transaction, wallet) {
                $scope.$apply(function() {
                    if (wallet) {
                        BCSession.user.wallets[wallet.currency].balance = wallet.balance;
                        BCSession.user.wallets[wallet.currency].availableBalance = wallet.availableBalance;
                        $scope.$emit('deposit', transaction, wallet);
                        $scope.Bonus.query(function(bonuses){
                            bonuses.forEach(function(bonus) {
                                if (bonus.meta && bonus.meta.ftd === true) {
                                    if (bonus.activatedAt && parseInt(bonus.wagered,10) === 0) {
                                        $scope.showmodal("ftdDoneModal");
                                    }
                                }
                            });
                        });
                    }
                });
            });

            socket.on('balance update', function(update) {
                console.debug("balance update", update, BCSession.user.wallets);
                if (BCSession.user.wallets && BCSession.user.wallets[update.currency]) {
                    BCSession.user.wallets[update.currency].balance = update.balance;
                    BCSession.user.wallets[update.currency].availableBalance = update.availableBalance;
                }
            });

            socket.on('withdraw', function(user, transaction) {
                $scope.$apply(function() {
                    BCSession.user = user;
                    $scope.$emit('withdraw', user, transaction);
                    $scope.$emit('user update', user);
                });
            });

            socket.on('user update', function(user) {
                user.wallets = BCSession.user.wallets;
                user.bonuses = BCSession.user.bonuses;
                BCSession.user = user;
                $scope.$emit('user update', user);
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
            $scope.showmodal = function(modalId) {
                $.each($(".modal"), function(index, modal){ if($(modal).attr("id") && $(modal).attr("id") !==  modalId) { $(modal).modal('hide'); }  });
                $("#"+modalId).modal("show");
            };
            $scope.url = url;
            $scope.resourceUrl = resourceUrl;
            $scope.publicPaths = publicPaths;
            $scope.privatePaths = privatePaths;
            var makeGaTracker = function(user) {
                googleanalytics('set', {
                    userId: user._id
                });
            };
            $scope.login = function(identity, password, method, oneTimePass, urlPath) {
                    if (urlPath === undefined) {
                        urlPath = '/user/auth';
                    }
                    if (urlPath[0] !== '/') {
                        urlPath = '/' + urlPath;
                    }
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
                    var loginUrl = urlRoot + urlPath;
                    if(oneTimePass){
                        loginUrl += '?one_time_pass=' + oneTimePass;
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
                        console.log('logged in');
                        makeGaTracker(user);
                        googleanalytics('send', 'event', 'user', 'login', {sessionControl: 'start'});
                        $scope.loadAssets(deferred);
                    }).error(function(error) {
                        BCSession.user = null;
                        BCSession.token = null;
                        ipCookie.remove(BCSession.cookieName);
                        console.error('login error', error);
                        $scope.$emit('login error', error);
                        deferred.reject(error);
                    });
                return deferred.promise;
            };
            $scope.showFTDModal = function() {
                $scope.Bonus.query(function(bonuses){
                    bonuses.forEach(function(bonus) {
                        if (bonus.meta && bonus.meta.ftd === true && BCSession && BCSession.user && BCSession.user.wallets && BCSession.user.wallets.bitcoin.balance < (2).toSatoshi()) {
                            if (!bonus.activatedAt) {
                                $scope.showmodal("ftdModal");
                            }
                        }
                    });
                });
            };
            $scope.verifyToken = function(urlPath) {
                if (urlPath === undefined) {
                    urlPath = '/user/auth';
                }
                if (urlPath[0] !== '/') {
                    urlPath = '/' + urlPath;
                }
                var deferred = $q.defer();
                if (/backoffice/.test($location.absUrl())) {
                    console.warn("bypassing token check from bc user");
                    setTimeout(function(q) { return q.resolve(); }, 1, deferred);
                    $rootScope.removeLoading = true;
                    return deferred.promise;
                }
                var self = this;
                var headers = {};
                var loginUrl = urlRoot + urlPath;
                $http.get(loginUrl, {
                    headers: headers
                }).success(function(user) {
                    if(!BCSession.user){
                        BCSession.user = user;
                    }
                    $scope.$emit('user update', user);
                    self.socket.emit('subscribe', BCSession.user._id);
                    makeGaTracker(user);
                    googleanalytics('send', 'event', 'user', 'token');
                    $scope.loadAssets(deferred);
                }).error(function(error) {
                    BCSession.user = null;
                    BCSession.token = null;
                    ipCookie.remove(BCSession.cookieName);
                    console.error('login error', error);
                    $scope.$emit('login error', error);
                    deferred.reject(error);
                });
                return deferred.promise;
            };
            $scope.refreshWallet = function(deferred) {
                var currencies = [
                    'bitcoin',
                    'dogecoin',
                    'litecoin',
                    'ppcoin',
                    'namecoin'
                ];
                $scope.Wallet.getWallets(function(wallets){
                    var hasWallet = false;
                    BCSession.user.wallets = wallets;
                    Object.keys(BCSession.user.wallets).forEach(function(key){
                        if(currencies.indexOf(key) !== -1){
                            hasWallet = true;
                        }
                    });
                    if(!hasWallet){
                        $scope.$emit('invalid wallet', BCSession.user);
                    }else{
                        $scope.$emit('valid wallet', BCSession.user);
                    }
                    deferred.resolve(BCSession.user);
                }, function(error){
                    $scope.$emit('invalid wallet', BCSession.user);
                    console.error('invalid wallet', error);
                    deferred.reject(error);
                });
                return deferred.promise;
            };
            $scope.loadAssets = function(deferred) {
                async.series([function(done){
                    $scope.Bonus.query(function(data){
                        BCSession.user.bonuses = data;
                        $scope.$emit('bonus update', BCSession.user);
                        done();
                    }, function(){
                        done();
                    });
                }, function(done){
                    $scope.refreshWallet(deferred).then(function(){
                        done();
                    }).catch(function(err){
                        done(err);
                    });
                }], function(err){
                    $scope.showFTDModal();
                    if(err){
                        console.error(err);
                        return deferred.reject(err);
                    }
                    return deferred.resolve(BCSession.user);
                });
            };
            $scope.registerAnonymous = function(address) {
                var deferred = $q.defer();
                var self = this;
                var currency = 'bitcoin';
                if(address[0] === 'L'){
                    currency = 'litecoin';
                }
                if(address[0] === 'D'){
                    currency = 'dogecoin';
                }
                BCSession.currency = currency;
                ipCookie('currency', currency, cookieOptions);
                var data = {
                    address: address,
                    currency: currency,
                    anonymous: true
                };
                $http.post(url, data).success(function(user) {
                    BCSession.user = user;
                    ipCookie('userId', user._id, cookieOptions);
                    ipCookie('lastAnon', address, cookieOptions);
                    self.socket.emit('subscribe', user._id);
                    $scope.$emit('user update', user);
                    $scope.$emit('login', user);
                    $scope.loadAssets(deferred);
                    // deferred.resolve(user);
                }).error(function(error) {
                    BCSession.user = null;
                    BCSession.token = null;
                    ipCookie.remove(BCSession.cookieName);
                    console.error('login error', ipCookie(BCSession.cookieName), BCSession.cookieName);
                    deferred.reject(error);
                });
                return deferred.promise;
            };
            $scope.logout = function() {
                var deferred = $q.defer();
                if (BCSession.user) {
                    $scope.User.delete({target: BCSession.user._id}, function() {
                        BCSession.user = null;
                        BCSession.token = null;
                        ipCookie.remove(BCSession.cookieName);
                        $scope.$emit('user update', null);
                        googleanalytics('send', 'event', 'user', 'logout', {sessionControl: 'end'});
                        $scope.$emit('logout');
                        deferred.resolve();
                    }, function() {
                        BCSession.user = null;
                        BCSession.token = null;
                        ipCookie.remove(BCSession.cookieName);
                        $scope.$emit('user update', null);
                        $scope.$emit('logout');
                        deferred.resolve();
                    });
                } else {
                    BCSession.user = null;
                    BCSession.token = null;
                    ipCookie.remove(BCSession.cookieName);
                    $scope.$emit('user update', null);
                    $scope.$emit('logout');
                    setTimeout(function() {
                        deferred.resolve();
                    }, 10);
                }

                window.localStorage.setItem("betcoin_session_value", "logout");
                return deferred.promise;
            };
            $scope.auth = this.login;
            $scope.getToken = function() {
                return ipCookie(BCSession.cookieName);
            };
            $scope.Ticket = $resource(urlRoot + '/ticket/:id', {}, {
                listStatus: {
                    method: 'GET',
                    isArray: true
                },
                comment: {
                    method: 'POST',
                    params: {
                        action: 'comment'
                    }
                },
                newTicket: {
                    method: 'POST'
                },
                commentTicket: {
                    method: 'PUT'
                }
            });
            $scope.Affiliate = $resource(resourceUrl + "/:assOrAff/:target", {
                assOrAff: 'affiliate'
            }, {
                earnings: {
                    method: 'GET',
                    params: {
                        assOrAff: 'affiliate',
                        target: 'earnings'
                    }
                },
                transactions: {
                    method: 'GET',
                    params: {
                        assOrAff: 'affiliate',
                        target: 'transactions',
                        since: new Date(new Date() - (7*24*60*60*1000)),
                        until: new Date()
                    }
                },
                associates: {
                    method: 'GET',
                    params: {
                        assOrAff: 'associates'
                    }
                }
            });
            $scope.Wallet = $resource(urlRoot + "/wallet/:target", {
                target: '@userId'
            }, {
                getChallenge: {
                    method: 'GET',
                    params: {
                        target: 'challenge'
                    }
                },
                addWithdrawAddress: {
                    method: 'POST',
                    params: {
                        target: getUserId
                    }
                },
                getWallets : {
                    method: 'GET',
                    params: {
                        target: getUserId
                    }
                },
                updateWallets : {
                    method: 'PUT',
                    params: {
                        target: getUserId
                    }
                }
            });
            $scope.Wallet.withdraw = function(params, cb, errcb) {
                var amount = params.amount;
                $http.delete(urlRoot + '/wallet/' + getUserId(), {
                    params: {amount: amount},
                    headers: {
                        'X-Currency': params.currency
                    }
                }).success(cb).error(errcb);
            };
            $scope.Agent = $resource(urlRoot + "/agent");
            $scope.Bonus = $resource(urlRoot + "/bonus/:bonusId", {
                bonusId: '@_id'
            }, {
                accept: {
                    method: 'PUT'
                },
                cancel: {
                    method: 'DELETE',
                    params: {
                        cancel: 't'
                    }
                }
            });
            $scope.Bonus.request = function(currency, type, cb, errcb) {
                $http.get(urlRoot + '/bonus/request/' + type, {
                    headers: {
                        'X-Currency': currency
                    }
                }).success(cb).error(errcb);
            };
            $scope.Bonus.getLevel = function(currency, cb, errcb) {
                $http.get(urlRoot + '/bonus/level/', {
                    headers: {
                        'X-Currency': currency
                    }
                }).success(cb).error(errcb);
            };
            $scope.Notification = $resource(urlRoot + "/notification/:id", {}, {
                getNotifications: {
                    method: 'GET',
                    isArray: true,
                    interceptor: {
                        response: function(response) {
                            return response || $q.when(response);
                        }
                    }
                },
                markMessageRead: {
                    method: 'PUT',
                    params:{
                        id: '@noteId'
                    }
                }
            });
            $scope.User = $resource(resourceUrl + "/:id/:target/:targetId/:action/:range", {}, {
                update: {
                    method: 'PUT',
                    params: {
                        id: getUserId
                    },
                    interceptor: {
                        response: function(response) {
                            return response || $q.when(response);
                        }
                    }
                },
                getTotpSecret: {
                    method: 'GET',
                    params: {
                        id: getUserId,
                        target: 'totp'
                    }
                },
                activateTotp: {
                    method: 'PUT',
                    params: {
                        id: getUserId,
                        target: 'totp'
                    }
                },
                deactivateTotp: {
                    method: 'DELETE',
                    params: {
                        id: getUserId,
                        target: 'totp'
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
                getTransactions: {
                    method: 'GET',
                    params: {
                        id: 'history',
                        target: 'transaction',
                        currency: 'all'
                    },
                    interceptor: {
                        response: function(response) {
                            return response || $q.when(response);
                        }
                    }
                },
                getCashbacks: {
                    method: 'GET',
                    params: {
                        id: 'history',
                        target: 'cashback',
                        currency: 'all'
                    },
                    interceptor: {
                        response: function(response) {
                            return response || $q.when(response);
                        }
                    }
                },
                getTransactionTotals: {
                    method: 'GET',
                    params: {
                        id: 'history',
                        target: 'wagered'
                    }
                },
                resendEmail: {
                    method: 'GET',
                    params: {
                        id: 'resend-email'
                    },
                    interceptor: {
                        response: function(response) {
                            return response || $q.when(response);
                        }
                    }
                }
            });

            $scope.verifyAlias = function (alias){
                var deferred = $q.defer();
                $http.get(urlRoot + '/verify/username/' + alias)
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
                $http.get(urlRoot + '/verify/withdraw/' + withdrawAddress)
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
                $scope.saveCookie('aff-token',token);
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

    bcPlayer.run([
        '$rootScope',
        '$location',
        'ipCookie',
        'BCSession',
        'BCPlayer',
        function($rootScope, $location, ipCookie, BCSession, BCPlayer) {
            // if a token exists when this is run, tru subscribing to the socket viw token
            BCSession.token = ipCookie(BCSession.cookieName);
            var currentPath = $location.absUrl();
            console.debug(currentPath);
            var urlPath = 'user';
            if (currentPath.indexOf('/agents') >= 0)  {
                urlPath = 'agent';
            } else if (currentPath.indexOf('/reps') >= 0)  {
                urlPath = 'rep';
            }

            BCPlayer.verifyToken(urlPath + '/token');

            BCPlayer.markAffiliate();

            $rootScope.BCSession = BCSession;
        }
    ]);

    bcPlayer.config(['$httpProvider', function($httpProvider) {
        var interceptor = function($q, $rootScope, $location, ipCookie, BCSession, PlayerApi) {
            BCSession.token = ipCookie(BCSession.cookieName);
            return {
                'request': function(config) {
                    config.headers['X-Lang'] = PlayerApi.lang;
                    if (!config.headers['X-Currency']) {
                        config.headers['X-Currency'] = ipCookie('currency');
                    }
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
                    if((response.config.method === 'POST' || response.config.method === 'PUT') && response.data.balance >= 0){
                        $rootScope.$broadcast('balance update', {balance: response.data.balance, currency: response.data.currency});
                    }
                    return response || $q.when(response);
                },
                'responseError': function(rejection) {
                    // if (rejection.status === 401 || rejection.status === 403) {
                    //     if (!BCSession.isBackoffice) {
                    //         window.location.reload();
                    //     }
                    // } else
                    if (rejection.status === 404 && rejection.data === '' && rejection.config.url.indexOf(PlayerApi.hostname+':'+PlayerApi.port) !== -1){
                        setTimeout(function() {
                            $rootScope.$broadcast('new notification', {type: 'server_unreachable'});
                        },5000);
                    } else if (rejection.status === 503) {
                        $rootScope.maintenanceError = rejection;
                    }
                    return $q.reject(rejection);
                }
            };
        };
        $httpProvider.interceptors.push([
            '$q',
            '$rootScope',
            '$location',
            'ipCookie',
            'BCSession',
            'PlayerApi',
            interceptor
        ]);
    }]);
})(window, window.angular, window.async);
