module.exports.generateUtils = function(App) {
    var utils = {
        //@TODO write documentation on params
        success: function(data,callback) {
            callback({"status":"success", "data": data});
        },
        //@TODO write documentation on params
        error: function(data,callback) {
            callback({"status":"error", "data": data});
        }
    };

    return utils;
}