'use strict';

var HttpError = require('./httperror');

module.exports = function () {
    this.setContainer = function (container){
        this.container = container;
    };

    this.getContainer = function (){
        return this.container;
    };

    this.checkAddress = function(address, cb) {
        this.getContainer().get('bitcoind').validateAddress(address, function(err, checkObj) {
            if (err) {
                return cb(new HttpError(400, 'Invalid Address', '055'));
            }
            //if (checkObj.ismine === true) {
            //    cb(new Error("You cannot use a deposit address as a withdraw address"));
            //} else 
            if (checkObj.isvalid === true) {
                cb(undefined, checkObj);
            } else {
                cb(new HttpError(400, 'Invalid Address', '055'));
            }
        });
    };

    this.checkSignature = function(address, signature, message, cb) {
        this.getContainer().get('bitcoind').verifyMessage(address, signature, message, function(err, sigIsGood) {
            if (err || !sigIsGood) {
                return cb(new HttpError(400, 'Invalid Signature', '056'));
            }
            cb(undefined, sigIsGood);
        });
    };
};
