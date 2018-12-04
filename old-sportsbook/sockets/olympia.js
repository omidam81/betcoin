var validator = require("validator");

module.exports.generateSockets = function(App) {
    var messageUtils = App.Utils.Message;
    var socketUtils = App.Utils.Socket;

    var sockets = {
        /*
         * data : array of { name: queryname, queryData: query params }
         * callback : socket.io callback
         */
        doQuery: function(data, callback) {
            try {
                App.Services.Queries.doQuery(data, function(err, results) {
                    if(err === null) {
                        messageUtils.success(results, callback);
                    } else {
                        console.log("ERROR: "+ err);
                        messageUtils.error({message: "An error occured"}, callback);
                    }
                });
            }
            catch(e) {
                console.log("ERROR: "+ e.message);

                messageUtils.error({message: "An error occured"}, callback);
            }
        },
        doAdminQuery: function(data, callback) {
            //check for admin and do admin query
        }
        //,
//        // write documentation on params
//        placeBet: function(data, callback) {
//            App.Services.Queries.placeBet(data,callback);
//        }
    };

    return sockets;
}