'use strict';

var timestamps = require('modella-timestamps');

var TYPE_WITHDRAW = 'withdraw';
var TYPE_DEPOSIT = 'deposit';
var TYPE_BONUS = 'bonus';
var TYPE_CASHBACK = "cashback";
var TYPE_AFFILIATE = 'affiliate';
var TYPE_JACKPOT = 'jackpot';

module.exports = function(BaseModel, userModelStore, CURRENCY_REGEXP, Autobet) {
    var Transaction = BaseModel('transaction')
        .attr('refId', {unique: true})
        .attr('userId', {type: userModelStore.ObjectId})
        .attr('currency', {format: CURRENCY_REGEXP})
        .attr('credit', {type: 'number', defaultValue: 0})
        .attr('debit', {type: 'number', defaultValue: 0})
        .attr('type', {type: 'string', required: true})
    // the user's balance after the transaction, for auditing
        .attr('balance', {type: 'number'})
    // the user's available balance after the transaction, for auditing
        .attr('availableBalance', {type: 'number'})
        .attr('meta', {defaultValue: {}})
        .attr('autobet', {type: 'boolean', filtered: true});

    Transaction.use(userModelStore);
    Transaction.use(timestamps);

    Transaction.validate(function(transaction) {
        // make sure credit and debit numbers are right
        if (transaction.credit() < 0) transaction.error('credit', 'cannot be < 0, use a debit');
        if (transaction.debit() < 0) transaction.error('debit', 'cannot be < 0, use a credit');
        // some types need certain meta data
        var type = transaction.type();
        var meta = transaction.meta();
        // deposit transactions must have the associated *coind txid
        // and vout info attached to them
        if (type === TYPE_DEPOSIT) {
            if (!meta.txid)
                transaction.error('meta', 'must have property txid for a ' + type + ' type');
            if (isNaN(meta.vout))
                transaction.error('meta', 'must have property vout for a ' + type + ' type');
        }
        // a withdraw tx must have info abou the outgoing *coind
        // transaction as well as the user's new balance
        if (type === TYPE_WITHDRAW) {
            if (!meta.txid)
                transaction.error('meta', 'must have property txid for a ' + type + ' type');
            if (isNaN(meta.balance))
                transaction.error('meta', 'must have property balance for a withdraw type');
        }
        // bonus transactions are the only transactions that do
        // not have to include info about the balances for the
        // wallet after the transaction is finished
        if (type !== TYPE_BONUS && !Transaction.TYPE_REGEXP_BONUS_ADJUST.test(type)) {
            if (!transaction.has('balance')) {
                transaction.error('balance', 'must be defined on any non bonus transactions');
            }
            if (!transaction.has('availableBalance')) {
                transaction.error('availableBalance', 'must be defined on any non bonus transactions');
            }
        }
        // affiliate related transactions must have the associate
        // ObjectId on them
        if (type === TYPE_AFFILIATE) {
            if (!meta.associate || !meta.associate instanceof Transaction.db.id) {
                transaction.error('meta', 'must have property "associate" for affiliate transactions');
            }
        }
    });

    var saveTmp = Transaction.prototype.save;
    Transaction.prototype.save = function(cb) {
        var self = this;
        var robotIds = {};
        if(this.userId() && this.autobet() === undefined){
            var player_id = this.userId().toHexString();
            Autobet.all(function(err, autobets){
                if(err) return saveTmp.call(self, cb);
                autobets.forEach(function(autobet){
                    var games = autobet.games()||[];
                    games.forEach(function(gameConfig){
                        robotIds[gameConfig.player_id] = true;
                    });
                });
                if(robotIds[player_id]){
                    self.autobet(true);
                }else{
                    self.autobet(false);
                }
                saveTmp.call(self, cb);
            });
        }else{
            saveTmp.call(self, cb);
        }
    };

    // make some static types
    Transaction.TYPE_WITHDRAW = TYPE_WITHDRAW;
    Transaction.TYPE_DEPOSIT = TYPE_DEPOSIT;
    Transaction.TYPE_BONUS = TYPE_BONUS;
    Transaction.TYPE_CASHBACK = TYPE_CASHBACK;
    Transaction.TYPE_AFFILIATE = TYPE_AFFILIATE;
    Transaction.TYPE_JACKPOT = TYPE_JACKPOT;
    // some regexp testers for types
    Transaction.TYPE_REGEXP_WAGER = /:wager/;
    Transaction.TYPE_REGEXP_WINNINGS = /:winnings/;
    Transaction.TYPE_REGEXP_BONUS_ADJUST = /:bonus-adjust/;
    // and some type generators
    Transaction.wagerType = function(game) { return game + ':wager'; };
    Transaction.winningsType = function(game) { return game + ':winnings'; };

    return Transaction;

};
