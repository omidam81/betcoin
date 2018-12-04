'use strict';

var moment = require('moment');
var async = require('async');

module.exports = function(Bonus, Config, logger, HTTPError) {

    var BonusController = function() {
    };

    var BONUS_REQUEST_PERIOD = BonusController.BONUS_REQUEST_PERIOD = 7; // days

    BonusController.prototype.read = function(req, res, next) {
        if (req.params.bonusId) {
            Bonus.get({_id: req.params.bonusId, userId: req.user.primary()}, function(err, bonus) {
                if (err) return next(new HTTPError(err.code, err.message));
                if (!bonus) return new HTTPError(404, "Bonus not found");
                return res.json(bonus.filter());
            });
        } else {
            var query = {
                userId: req.user.primary(),
                rejectedAt: {$exists: false},
                canceledAt: {$exists: false},
                exhaustedAt: {$exists: false},
                unlockedAt: {$exists: false}
            };
            ['rejected', 'canceled', 'exhausted', 'unlocked'].forEach(function(status) {
                if (req.query[status] !== undefined) {
                    delete query[status + 'At'];
                }
            });
            Bonus.all(query, {
                sort: {activatedAt: -1, acceptedAt: -1, offeredAt: -1}
            }, function(err, bonuses) {
                if (err) return next(new HTTPError(err.code, err.message));
                if (!bonuses.length) res.status(204);
                var returnArray = [];
                bonuses.forEach(function(bonus) {
                    returnArray.push(bonus.filter());
                });
                return res.json(returnArray);
            });
        }
    };

    BonusController.prototype.update = function(req, res, next) {
        logger.verbose("user %s accepting %s bonus %s", req.user.primary(), req.currency, req.params.bonusId);
        Bonus.get({_id: req.params.bonusId, userId: req.user.primary()}, function(err, bonus) {
            if (err) return next(new HTTPError(err.code, err.message));
            if (!bonus) return next(new HTTPError(404, "Bonus not found"));
            req.user.wallet(bonus.currency(), function(err, wallet) {
                if (err) {
                    if (err.code === 404) {
                        wallet = undefined;
                    } else return next(err);
                }
                bonus.accept(wallet, function(err) {
                    if (err) return next(err);
                    return res.status(202).json(bonus.filter());
                });
            });
        });
    };

    BonusController.prototype.delete = function(req, res, next) {
        Bonus.get({_id: req.params.bonusId, userId: req.user.primary()}, function(err, bonus) {
            if (err) return next(new HTTPError(err.code, err.message));
            if (!bonus) return next(new HTTPError(404, "Bonus not found"));
            if (bonus.has('rejectedAt')) return next(new HTTPError(405, "This bonus was already rejected"));
            // optionally cancel if the query flag is present
            if (req.query.cancel) {
                if (bonus.has('canceledAt')) return next(new HTTPError(405, "This bonus was already canceled"));
                req.user.wallet(bonus.currency(), function(err, wallet) {
                    if (err) return next(err);
                    bonus.cancel(wallet, function(err) {
                        if (err) return next(err);
                        return res.status(202).json(bonus.filter());
                    });
                });
            } else {
                if (bonus.has('acceptedAt')) return next(new HTTPError(405, "This bonus was already accepted"));
                bonus.rejected = true;
                bonus.save(function(err) {
                    if (err) return next(new HTTPError(err.code, err.message));
                    return res.status(202).json(bonus.filter());
                });
            }
        });
    };

    BonusController.prototype.create = function(req, res, next) {
        var maxValue, rollover, newBonus;
        var level = req.user.vipLevel() || 0;
        var bonusType = req.params.type;
        if (bonusType !== Bonus.TYPE_MATCH)
            return next(new HTTPError(418, "You cannot request that kind of bonus"));
        var currency = req.query.currency || 'bitcoin';
        async.series([
            function(done) {
                Config.get('bonusLevel' + level, function(err, config){
                    if(err) return done(new HTTPError(500, err.message));
                    config = config[bonusType][req.wallet.currency()];
                    maxValue = parseInt(config.amount);
                    rollover = parseInt(config.rollover);
                    done();
                });
            },
            function(done) {
                Bonus.all({userId: req.user.primary()}, function(err, bonuses) {
                    if (err) return next(new HTTPError(err.code, err.message));
                    bonuses.sort(function(a, b){
                        return a.offeredAt() > b.offeredAt();
                    });
                    var inactiveBonuses = [], activeBonuses = [];
                    bonuses.forEach(function(bonus){
                        if (!bonus.active) {
                            inactiveBonuses.push(bonus);
                        } else {
                            activeBonuses.push(bonus);
                        }
                    });
                    var lastBonus, lastBonusDays;
                    if (inactiveBonuses.length > 0) {
                        lastBonus = inactiveBonuses[inactiveBonuses.length - 1];
                        var now = moment();
                        lastBonusDays = now.diff(lastBonus.offeredAt(), 'days');
                    }
                    if (activeBonuses.length > 0) {
                        return done(new HTTPError(409, 'You already have an active bonus'));
                    }
                    if (lastBonusDays >= BONUS_REQUEST_PERIOD || lastBonusDays === undefined || process.env.DEV_BYPASS_BONUS) {
                        var bonus = new Bonus({
                            type: Bonus.TYPE_MATCH === bonusType? Bonus.TYPE_MATCH: Bonus.TYPE_STRAIGHT,
                            userId: req.user.primary(),
                            maxValue: maxValue,
                            rollover: rollover,
                            currency: currency,
                            offeredAt: new Date()
                        });
                        // they requested it, so they are accepting by default
                        bonus.accepted = true;
                        // a straight bonus gets a value added immediately
                        if (bonus.type() === Bonus.TYPE_STRAIGHT) {
                            bonus.initialValue(maxValue);
                            bonus.value(maxValue);
                            bonus.activated = true;
                        }
                        bonus.save(function(err) {
                            if (err) logger.error("error saving bonus", err.message);
                            newBonus = bonus;
                            if (bonus.type() === Bonus.TYPE_MATCH) return done();
                            // otherwise credit the user for the amount of the bonus
                            req.user.wallet(bonus.currency(), function(err, wallet) {
                                if (err) return next(err);
                                wallet.credit({
                                    amount: bonus.initialValue(),
                                    refId: 'bonus-accepted:' + req.user.primary() + ":" + new Date().getTime(),
                                    type: 'bonus',
                                    meta: bonus.toJSON()
                                }, done);
                            });
                        });
                    } else {
                        return done(new HTTPError(409, 'You have requested a bonus in the past %d days', BONUS_REQUEST_PERIOD));
                    }
                });
            }
        ], function(err){
            if(err) return next(err);
            res.status(201).json(newBonus.filter());
        });
    };

    BonusController.prototype.getBonusLevel = function (req, res, next) {
        var bonusLevel = req.user.vipLevel() || 0;
        Config.get('bonusLevel' + bonusLevel, function (err, config) {
            if (err) return next(err);
            config.level = bonusLevel;
            res.json(config);
        });
    };

    return BonusController;
};
