'use strict';

var timestamps = require('modella-timestamps');

module.exports = function(BaseModel, userModelStore, CURRENCY_REGEXP, logger, HTTPError) {
    var AffiliateRecord = BaseModel('affiliate_record')
        .attr('affiliateId', {type: userModelStore.ObjectId})
        .attr('associateId', {type: userModelStore.ObjectId})
        .attr('currency', {format: CURRENCY_REGEXP})
        .attr('total', {type: 'number', defaultValue: 0});

    AffiliateRecord.use(userModelStore);
    AffiliateRecord.use(timestamps);

    AffiliateRecord.prototype.credit = function(amount, cb) {
        this.total(this.total() + amount);
        var now = new Date();
        this.updatedAt(now);
        logger.verbose("crediting affiliate %s %d %s from associate %s",
                       this.affiliateId(),
                       amount.toBitcoin(),
                       this.currency(),
                       this.associateId());
        AffiliateRecord.db.update({
            _id: this.primary()
        }, {
            $inc: {total: amount},
            $set: {updatedAt: now}
        }, function(err) {
            if (err) return cb(new HTTPError(err.code, err.message));
            return cb(undefined, this);
        });
    };

    return AffiliateRecord;

};
