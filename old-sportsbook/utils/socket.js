module.exports.generateUtils = function(App) {
    var utils = {
        //@TODO write documentation on params
        requireAuthenticated: function(data,callback) {
            if(App.Utils.JWT.verify(data.authToken)) {
                App.Utils.Message.error(data, callback);
                return false;
            }

            return true;
        },
        //@TODO write documentation on params
        setAuthentication: function(data) {
            return App.Utils.JWT.sign(data);
        }
    };

    return utils;
}