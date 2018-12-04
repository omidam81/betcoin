var validator = require("validator");

module.exports.generateSockets = function(App) {
    var jwtUtils = App.Utils.JWT;
    var messageUtils = App.Utils.Message;
    var socketUtils = App.Utils.Socket;

    var sockets = {
        // AZ: tried to see if I can abstract the common code in these functions into a function, but couldn't manage it
        signup: function(data, callback) {
            //@TODO write function that checks if fields are defined (is it required?)
            try {
                App.Services.PlayerServer.signup({
                    alias: validator.toString(data.alias),
                    password: validator.toString(data.password)
                },function(data) {
                    messageUtils.success(data, callback);
                }, function(data) {
                    //@TODO improve error handling
                    messageUtils.error({message: data.message},callback);
                });
            }
            catch(e) {
                messageUtils.error({message: e.message}, callback);
            }
        },
        login: function(data, callback) {
            try {
                App.Services.PlayerServer.login({
                    alias: validator.toString(data.alias),
                    password: validator.toString(data.password)
                },function(data) {
                    //@TODO session zz
                    messageUtils.success(data, callback);
                }, function(data) {
                    messageUtils.error({message: data.message},callback);
                });
            }
            catch(e) {
                messageUtils.error({message: e.message}, callback);
            }
        },
        logout: function(data, callback) {
            try  {
                if(!socketUtils.requireAuthenticated(data,callback))
                    return;

                App.Services.PlayerServer.logout({
                    alias: validator.toString(data.alias),
                    key: validator.toString(data.key)
                },function(data) {
                    messageUtils.success(data, callback);
                }, function(data) {
                    messageUtils.error({message: data.message},callback);
                });
            }
            catch(e) {
                messageUtils.error({message: e.message}, callback);
            }
        },
        getChallengeSignature: function(data, callback) {
            try {
                if(!socketUtils.requireAuthenticated(data,callback))
                    return;

                App.Services.PlayerServer.getChallengeSignature({
                    key: validator.toString(data.key)
                },function(data) {
                    messageUtils.success(data, callback);
                }, function(data) {
                    messageUtils.error({message: data.message},callback);
                });
            }
            catch(e) {
                messageUtils.error({message: e.message}, callback);
            }
        },
        getUserInfo: function(data, callback) {
            try {
                if(!socketUtils.requireAuthenticated(data,callback))
                    return;

                App.Services.PlayerServer.getUserInfo({

                    key: validator.toString(data.key)

                },function(data) {
                    messageUtils.success(data, callback);
                }, function(data) {
                    messageUtils.error({message: data.message},callback);
                });
            }
            catch(e) {
                messageUtils.error({message: e.message}, callback);
            }
        },
        setUserAlias: function(data, callback) {
            try {
                if(!socketUtils.requireAuthenticated(data,callback))
                    return;

                App.Services.PlayerServer.setUserAlias({
                    key: validator.toString(data.key),
                    alias: validator.toString(data.alias),
                    password: validator.toString(data.password),
                    sig: validator.toString(data.sig)
                },function(data) {
                    messageUtils.success(data, callback);
                }, function(data) {
                    messageUtils.error({message: data.message},callback);
                });
            }
            catch(e) {
                messageUtils.error({message: e.message}, callback);
            }
        },
        setUserPassword: function(data, callback) {
            try {
                if(!socketUtils.requireAuthenticated(data,callback))
                    return;

                App.Services.PlayerServer.setUserPassword({
                    key: validator.toString(data.key),
                    newPass: validator.toString(data.newPass),
                    password: validator.toString(data.password),
                    sig: validator.toString(data.sig)
                },function(data) {
                    messageUtils.success(data, callback);
                }, function(data) {
                    messageUtils.error({message: data.message},callback);
                });
            }
            catch(e) {
                messageUtils.error({message: e.message}, callback);
            }
        },
        setUserAddress: function(data, callback) {
            try {
                if(!socketUtils.requireAuthenticated(data,callback))
                    return;

                App.Services.PlayerServer.setUserAddress({
                    key: validator.toString(data.key),
                    address: validator.toString(data.address),
                    password: validator.toString(data.password),
                    currency: validator.toString(data.currency),
                    sig: validator.toString(data.sig)
                },function(data) {
                    messageUtils.success(data, callback);
                }, function(data) {
                    messageUtils.error({message: data.message},callback);
                });
            }
            catch(e) {
                messageUtils.error({message: e.message}, callback);
            }
        },
        withdraw: function(data, callback) {
            try {
                if(!socketUtils.requireAuthenticated(data,callback))
                    return;

                App.Services.PlayerServer.withdraw({
                    key: validator.toString(data.key),
                    currency: validator.toString(data.currency)
                },function(data) {
                    messageUtils.success(data, callback);
                }, function(data) {
                    messageUtils.error({message: data.message},callback);
                });
            }
            catch(e) {
                messageUtils.error({message: e.message}, callback);
            }
        },
        checkFaucet: function(data, callback) {
            try {
                if(!socketUtils.requireAuthenticated(data,callback))
                    return;

                App.Services.PlayerServer.checkFaucet({
                    key: validator.toString(data.key)
                },function(data) {
                    messageUtils.success(data, callback);
                }, function(data) {
                    messageUtils.error({message: data.message},callback);
                });
            }
            catch(e) {
                messageUtils.error({message: e.message}, callback);
            }
        }
    };

    return sockets;
}