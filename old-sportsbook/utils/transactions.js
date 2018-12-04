module.exports.generateUtils = function(App) {
    var utils = {
        //@TODO write documentation on params
        addTransaction: function(txData, cb) { //@TODO
            if (txData.userId instanceof ObjectId) {
                txData.userId = txData.userId.toHexString();
            } else {
                try {
                    new ObjectId.createFromHexString(txData.userId);
                } catch (ex) {
                    return cb(new Error("Invalid userId"));
                }
            }
            // logger.log('info', JSON.stringify(txData, null, 2));
            doRequest('/txs', 'POST', txData, function(err, response) {
                if (err) return cb(err);
                cb(undefined, response.transactionId);
            });
        }
    };

    return utils;
}