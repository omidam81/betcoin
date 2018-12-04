'use strict';

module.exports = function(logger, mongo, HTTPError, NotificationController, ListQuery, Transaction, CURRENCY_REGEXP, User, CURRENCY_ABBREVIATIONS) {

    var noteController = new NotificationController();

    var CashbackController = function() {
    };

    CashbackController.prototype.giveCashback = function(params, cb) {
        var amount = params.amount;
        var profit = params.profit;
        var start = params.start;
        var end = params.end;
        var currency = params.currency;
        var userId = mongo.ensureObjectId(params.userId);
        User.find(userId, function(err, user) {
            if (err) return cb(new HTTPError(err));
            if (!user) return cb(new HTTPError(404, "User %s not found", userId));
            if (user.anonymous()) return cb(new HTTPError(405, "an anonymous user cannot get cashback"));
            user.wallet(currency, function(err, wallet) {
                if (err) return cb(new HTTPError(err));
                if (!wallet) return cb(new HTTPError(404, "%s wallet for %s not found", currency, userId));
                wallet.credit({
                    amount: amount,
                    refId: 'cashback:' + currency + ':' + new Date().getTime() + ":" + user.primary(),
                    type: 'cashback',
                    meta: {
                        profit: profit,
                        start: start,
                        end: end
                    }
                }, function(err) {
                    if (err) return cb(err);
                    if (amount > 0) {
                        noteController.create(user.primary(), {
                            subject: 'Cashback reward',
                            message: "Congrats, you have been given a cashback bonus of " + amount.toBitcoin() + " " + currency,
                            sendEmail: 'cashback_granted',
                            emailOptions: {
                                user: user,
                                type: Transaction.TYPE_CASHBACK,
                                amount: amount.toBitcoinString(),
                                currency: CURRENCY_ABBREVIATIONS[currency]
                            }
                        }, function(err) {
                            if (err) logger.error(err.message);
                            cb(undefined, user);
                        });
                    } else {
                        cb(undefined, user);
                    }
                });
            });
        });
    };

    CashbackController.prototype.read = function(req, res, next) {
        var currency = req.query.currency || 'all';
        var listQuery = new ListQuery({
            collection: Transaction.db,
            model: Transaction,
            pageSize: req.query.pageSize,
            page: req.query.page,
            query: {
                type: Transaction.TYPE_CASHBACK,
                userId: req.user.primary(),
            },
            sort: [["createdAt", -1]]
        });
        if (currency !== 'all' && CURRENCY_REGEXP.test(currency)) {
            listQuery.query.currency = currency;
        }
        listQuery.getList(function(err) {
            if (err) return next(err);
            return res.json(listQuery);
        });
    };

    return CashbackController;

};
