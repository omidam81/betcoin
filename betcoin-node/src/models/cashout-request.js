'use strict';

var timestamps = require('modella-timestamps');

module.exports = function(BaseModel, logger, container, userModelStore, CURRENCY_REGEXP) {

    var STATUS_OPEN = 'open';
    var STATUS_CANCELLED = 'cancelled';
    var STATUS_SEIZED = 'seized';
    var STATUS_SENT = 'sent';

    var CashoutRequest = BaseModel('cashout_request')
        .attr('userId', {type: userModelStore.ObjectId})
        .attr('currency', {format: CURRENCY_REGEXP})
        .attr('amount', {type: 'number'})
        .attr('status', {type: 'string', defaultValue: STATUS_OPEN})
        .attr('locale', {type: 'string'});

    CashoutRequest.use(userModelStore);
    CashoutRequest.use(timestamps);

    CashoutRequest.STATUS_OPEN = STATUS_OPEN;
    CashoutRequest.STATUS_CANCELLED = STATUS_CANCELLED;
    CashoutRequest.STATUS_SEIZED = STATUS_SEIZED;
    CashoutRequest.STATUS_SENT = STATUS_SENT;

    CashoutRequest.prototype.cancel = function(cb) {
        var mailer = container.get('mailer');
        this.status(STATUS_CANCELLED);
        var self = this;
        this.save(function(err) {
            if (err) return cb(err);
            mailer.send(self.userId(), 'cashout_request_cancelled', {
                amount: self.amount().toBitcoin(),
                currency: self.currency()
            }, function(err) {
                if (err) logger.error("Error sending cashout cancelled email");
                return cb();
            });
        });
    };

    CashoutRequest.prototype.seize = function(cb) {
        this.status(STATUS_SEIZED);
        this.save(cb);
    };

    return CashoutRequest;

};
