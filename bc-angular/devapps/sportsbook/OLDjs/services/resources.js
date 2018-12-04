'use strict';

/* global io */

var address = "<%= api.protocol %>://<%= api.host %>:<%= api.port %>";


Application.Services.factory("BackendSocket", ["socketFactory", function (socketFactory) {
    var socket = socketFactory({
        ioSocket: io.connect(address),
        prefix: "backend"
    });

    return socket;
}]);

Application.Services.factory("AuthService", ["BackendSocket", "$cookieStore", function (BackendSocket, $cookieStore) {
    //@TODO write a wrapper function for authorized functions

    var authTokenKey = "bc-auth-token";

    var setToken = function (token) {
        $cookieStore.put(authTokenKey, token);
    };
    var getToken = function () {
        return $cookieStore.get(authTokenKey);
    };
    var unsetToken = function () {
        $cookieStore.remove(authTokenKey);
    };

    var api = {
        isAuthenticated: function () {
            return typeof getToken() !== "undefined";
        },
        signup: function (args, callback) {
            BackendSocket.emit("player-server/signup", args, callback);
        },
        login: function (args, callback) {
            BackendSocket.emit("player-server/login", args, function (obj) {
                if (obj.status === "success") {
                    setToken(obj.data.authToken);
                    //@TODO fetch and store data
                }

                callback(obj);
            });
        },
        logout: function (args, callback) {
            args.authToken = getToken();
            BackendSocket.emit("player-server/logout", args, function (obj) {
                if (obj.status === "success") {
                    unsetToken();
                    //@TODO consider refreshing the page
                }

                callback(obj);
            });
        },
        getChallengeSignature: function (args, callback) {
            args.authToken = getToken();
            BackendSocket.emit("player-server/getChallengeSignature", args, callback);
        },
        getUserInfo: function (args, callback) {
            args.authToken = getToken();
            BackendSocket.emit("player-server/getUserInfo", args, callback);
        },
        setUserAlias: function (args, callback) {
            args.authToken = getToken();
            BackendSocket.emit("player-server/setUserAlias", args, callback);
        },
        setUserPassword: function (args, callback) {
            args.authToken = getToken();
            BackendSocket.emit("player-server/setUserPassword", args, callback);
        },
        setUserAddress: function (args, callback) {
            args.authToken = getToken();
            BackendSocket.emit("player-server/setUserAddress", args, callback);
        },
        withdraw: function (args, callback) {
            args.authToken = getToken();
            BackendSocket.emit("player-server/withdraw", args, callback);
        },
        checkFaucet: function (args, callback) {
            args.authToken = getToken();
            BackendSocket.emit("player-server/checkFaucet", args, callback);
        }
    };

    return api;
}]);


Application.Services.factory("GameService", ["BackendSocket", "AuthService", function (BackendSocket/*, AuthService*/) {
    //@TODO implement caching and expiring and only send ones that do not exist in cache
    var api = {
        doQuery: function (args, callback) {
            BackendSocket.emit("olympia/doQuery", args, callback);
        }
    };

    return api;
}]);