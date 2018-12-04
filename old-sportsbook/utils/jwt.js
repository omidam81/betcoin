var jwt = require("jsonwebtoken");

module.exports.generateUtils = function(App) {
    var secret = "secretstringhaha";
    var options = {
        algorithm: "HS512",
        expiresInMinutes: 60*60*2 //@TODO configurable
    };

    var utils = {
        //@TODO write documentation on params
        verify: function(authToken) {
            var result = false;

            jwt.verify(authToken, secret, options, function(err,decoded) {
                if(err === null)
                    result = decoded;
            });

            return result;
        },
        //@TODO write documentation on params
        sign: function(data) {
            //@TODO replace with RSA signing
            return jwt.sign(data, secret, options);
        }
    };

    return utils;
}