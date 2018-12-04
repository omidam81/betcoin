'use strict';

module.exports = function(mongo, logger, HTTPError, gameNames) {
    var config = mongo.getDb({dbname: 'userdb'}).collection('config');

    // a has map of defaults for when a value can;t be found in the
    // db, maily for allowing test builds to work without having to
    // set this up in the db

    // also provides sensable defaults for values until it is deemed
    // they need to be overwritten in the live database
    var DEFAULTS = {
        bitcoinCashoutLimits: {
            count: 10,
            total: (5).toSatoshi()
        },
        litecoinCashoutLimits: {
            count: 10,
            total: (50).toSatoshi()
        },
        dogecoinCashoutLimits: {
            count: 10,
            total: (1000).toSatoshi()
        },
        ppcoinCashoutLimits: {
            count: 10,
            total: (10).toSatoshi()
        },
        namecoinCashoutLimits: {
            count: 10,
            total: (100).toSatoshi()
        },
        bitcoinUserCashoutLimits: {
            count: 10,
            total: (5).toSatoshi()
        },
        litecoinUserCashoutLimits: {
            count: 10,
            total: (50).toSatoshi()
        },
        dogecoinUserCashoutLimits: {
            count: 10,
            total: (1000).toSatoshi()
        },
        ppcoinUserCashoutLimits: {
            count: 10,
            total: (10).toSatoshi()
        },
        namecoinUserCashoutLimits: {
            count: 10,
            total: (100).toSatoshi()
        },
        bitcoinAnonCashoutLimits: {
            count: 10,
            total: (5).toSatoshi()
        },
        litecoinAnonCashoutLimits: {
            count: 10,
            total: (50).toSatoshi()
        },
        dogecoinAnonCashoutLimits: {
            count: 10,
            total: (1000).toSatoshi()
        },
        ppcoinAnonCashoutLimits: {
            count: 10,
            total: (10).toSatoshi()
        },
        namecoinAnonCashoutLimits: {
            count: 10,
            total: (100).toSatoshi()
        },
        bitcoinConfirmations: {
            minfee: (0.0001).toSatoshi(),
            minconf: 1,
            coinbase: 100,
            lowfee: 6
        },
        litecoinConfirmations: {
            minfee: (0.0001).toSatoshi(),
            minconf: 4,
            coinbase: 100,
            lowfee: 20
        },
        dogecoinConfirmations: {
            minfee: (1).toSatoshi(),
            minconf: 6,
            coinbase: 100,
            lowfee: 30
        },
        ppcoinConfirmations: {
            minfee: (1).toSatoshi(),
            minconf: 6,
            coinbase: 100,
            lowfee: 30
        },
        namecoinConfirmations: {
            minfee: (1).toSatoshi(),
            minconf: 6,
            coinbase: 100,
            lowfee: 30
        },
        bitcoinMaxMatchBonus:  (888).toSatoshi(),
        litecoinMaxMatchBonus: (8888).toSatoshi(),
        dogecoinMaxMatchBonus: (888888).toSatoshi(),
        ppcoinMaxMatchBonus: (888888).toSatoshi(),
        namecoinMaxMatchBonus: (888888).toSatoshi(),
        vipLevels: {
            0: {
                _id: 'brass',
                label: {
                    en_US: 'Brass',
                    zh_CN: 'Brass'
                },
                wagered: 0,
            },
            1: {
                _id: 'bronze',
                label: {
                    en_US: 'Bronze',
                    zh_CN: 'Bronze'
                },
                wagered: (0.01).toSatoshi(),
                cashback: 0.0188,
            },
            2: {
                _id: 'silver',
                label: {
                    en_US: 'Silver',
                    zh_CN: 'Silver'
                },
                wagered: (0.1).toSatoshi(),
                cashback: 0.0388,
            },
            3: {
                _id: 'gold',
                label: {
                    en_US: 'Gold',
                    zh_CN: 'Gold'
                },
                wagered: (1).toSatoshi(),
                cashback: 0.0588,
                manual: true,
            },
            4: {
                _id: 'platinum',
                label: {
                    en_US: 'Platinum',
                    zh_CN: 'Platinum'
                },
                wagered: (10).toSatoshi(),
                cashback: 0.0788,
                manual: true,
            },
            5: {
                _id: 'diamond',
                label: {
                    en_US: 'Diamond',
                    zh_CN: 'Diamond'
                },
                wagered: (100).toSatoshi(),
                cashback: 0.0988,
                manual: true,
            },
            6: {
                _id: 'jade',
                label: {
                    en_US: 'Jade Emperor',
                    zh_CN: 'Jade Emperor'
                },
                wagered: Infinity,
                cashback: 0.1188,
            }
        },
        jackpots: {
            'vip': {
                label: {
                    en_US: 'VIP',
                    zh_CN: 'VIP大奖'
                },
                minLevel: 3,
                value: (888.8888).toSatoshi()
            },
            'jade': {
                label: {
                    en_US: 'Jade',
                    zh_CN: '玉帝会大奖'
                },
                minLevel: 6,
                value: (8888.8888).toSatoshi()
            }
        },
        bonusLevel0: {
            level: 0,
            match: {
                bitcoin: {
                    amount: (0.01).toSatoshi(),
                    rollover: 188,
                    currency: 'bitcoin'
                }
            },
            straight: {
                bitcoin: {
                    amount: (0.1).toSatoshi(),
                    rollover: 188,
                    currency: 'bitcoin'
                }
            }
        },
        bonusLevel1: {
            level: 1,
            match: {
                bitcoin: {
                    amount: (0.01).toSatoshi(),
                    rollover: 188,
                    currency: 'bitcoin'
                }
            },
            straight: {
                bitcoin: {
                    amount: (0.1).toSatoshi(),
                    rollover: 188,
                    currency: 'bitcoin'
                }
            }
        },
        bonusLevel2: {
            level: 2,
            match: {
                bitcoin: {
                    amount: (0.01).toSatoshi(),
                    rollover: 188,
                    currency: 'bitcoin'
                }
            },
            straight: {
                bitcoin: {
                    amount: (0.1).toSatoshi(),
                    rollover: 188,
                    currency: 'bitcoin'
                }
            }
        },
        bonusLevel3: {
            level: 3,
            match: {
                bitcoin: {
                    amount: (0.01).toSatoshi(),
                    rollover: 188,
                    currency: 'bitcoin'
                }
            },
            straight: {
                bitcoin: {
                    amount: (0.1).toSatoshi(),
                    rollover: 188,
                    currency: 'bitcoin'
                }
            }
        },
        bonusLevel4: {
            level: 4,
            match: {
                bitcoin: {
                    amount: (0.01).toSatoshi(),
                    rollover: 188,
                    currency: 'bitcoin'
                }
            },
            straight: {
                bitcoin: {
                    amount: (0.1).toSatoshi(),
                    rollover: 188,
                    currency: 'bitcoin'
                }
            }
        },
        bonusLevel5: {
            level: 5,
            match: {
                bitcoin: {
                    amount: (0.01).toSatoshi(),
                    rollover: 188,
                    currency: 'bitcoin'
                }
            },
            straight: {
                bitcoin: {
                    amount: (0.1).toSatoshi(),
                    rollover: 188,
                    currency: 'bitcoin'
                }
            }
        },
        welcomeBonus: {
            rollover: 888,
            amount: {
                USD: 5888,
                CNY: 58888
            },
            matchRollover: 388,
            matchMultipliers: [3],
            matchMax: (888).toSatoshi()
        },
        maintenanceApps: [],
        associateBonus: {
            startingVipLevel: 3,
            welcomeBonus: {
                USD: 11888,
                CNY: 118888
            },
            matchRollover: 388,
            matchMultipliers: [3.5, 2, 1.88],
            matchMax: (888).toSatoshi()
        },
        diceBetLimits: {
            1: {target: 1, max: (0.0558).toSatoshi()},
            4: {target: 4, max: (0.1088).toSatoshi()},
            8: {target: 8, max: (0.1288).toSatoshi()},
            16: {target: 16, max: (0.1588).toSatoshi()},
            32: {target: 32, max: (0.1888).toSatoshi()},
            64: {target: 64, max: (0.38).toSatoshi()},
            128: {target: 128, max: (0.88).toSatoshi()},
            256: {target: 256, max: (1.8).toSatoshi()},
            512: {target: 512, max: (3.88).toSatoshi()},
            1000: {target: 1000, max: (6).toSatoshi()},
            1500: {target: 1500, max: (8.8).toSatoshi()},
            2000: {target: 2000, max: (18).toSatoshi()},
            3000: {target: 3000, max: (38).toSatoshi()},
            4000: {target: 4000, max: (48).toSatoshi()},
            6000: {target: 6000, max: (58).toSatoshi()},
            8000: {target: 8000, max: (68).toSatoshi()},
            12000: {target: 12000, max: (88).toSatoshi()},
            16000: {target: 16000, max: (128).toSatoshi()},
            24000: {target: 24000, max: (138).toSatoshi()},
            32000: {target: 32000, max: (238).toSatoshi()},
            32768: {target: 32768, max: (288).toSatoshi()},
            48000: {target: 48000, max: (358).toSatoshi()},
            52000: {target: 52000, max: (388).toSatoshi()},
            56000: {target: 56000, max: (408).toSatoshi()},
            60000: {target: 60000, max: (488).toSatoshi()},
            63999: {target: 63999, max: (688).toSatoshi()},
            64000: {target: 64000, max: (888).toSatoshi()}
        }
    };

    var BET_LIMIT_KEY_REGEXP = /[a-z]+BetLimits/;

    var Config = {
        get: function(key, cb) {
            logger.silly("getting %s configuration", key);
            config.findOne({_id: key}, function(err, confItem) {
                if (err) return cb(new HTTPError(err.code, err.message));
                if (!confItem) {
                    if (DEFAULTS[key]) {
                        logger.silly("returning default config value for %s", key);
                        return cb(undefined, DEFAULTS[key], true);
                    } else if (BET_LIMIT_KEY_REGEXP.test(key)) {
                        // if we are looking for bet limits and they
                        // are not found, return some defaults
                        return cb(undefined, {
                            bitcoin: {
                                max: (5).toSatoshi(),
                                min: 100
                            },
                            litecoin: {
                                max: (50).toSatoshi(),
                                min: 100
                            },
                            dogecoin: {
                                max: (5000000).toSatoshi(),
                                min: 100
                            },
                            ppcoin: {
                                max: (50).toSatoshi(),
                                min: 100
                            },
                            namecoin: {
                                max: (50).toSatoshi(),
                                min: 100
                            }
                        }, true);
                    } else {
                        return cb(new HTTPError(404, "Config item " + key + " not found"));
                    }
                }
                return cb(undefined, confItem.value);
            });
        },
        set: function(key, value, cb) {
            this.get(key, function(err, data, isDefault) {
                if (err || isDefault) {
                    if (isDefault || err.code === 404) {
                        logger.verbose("creating congifuration for %s", key);
                        config.insert({_id: key, value: value}, function(err) {
                            if (err) return cb(new HTTPError(err.code, err.message));
                            return cb();
                        });
                    } else {
                        return cb(err);
                    }
                } else {
                    logger.verbose("updating configuration for %s", key);
                    config.update({_id: key}, {$set: {value: value}}, function(err) {
                        if (err) return cb(new HTTPError(err.code, err.message));
                        return cb();
                    });
                }
            });
        },
        search: function(wildcard, cb) {
            config.find({_id: {$regex: '.*' + wildcard + '.*'}}).toArray(function(err, configs) {
                if(err) return cb(err);
                cb(undefined, configs);
            });
        }
    };

    Object.keys(DEFAULTS).forEach(function(defaultKey) {
        Config.get(defaultKey, function(err, value, isDefault) {
            if (err || isDefault) {
                if (isDefault || err.code === 404) {
                    logger.verbose("creating congifuration for %s", defaultKey);
                    config.insert({_id: defaultKey, value: DEFAULTS[defaultKey]}, function(err) {
                        if (err) return logger.error(err.message);
                    });
                } else {
                    if (err) return logger.error(err.message);
                }
            }
        });
    });

    gameNames.forEach(function(game) {
        var key = game + 'BetLimits';
        if (game === 'dice') return; // we have special configs dor dice max bets
        Config.get(key, function(err, value, isDefault) {
            if (err || isDefault) {
                if (isDefault || err.code === 404) {
                    logger.verbose("creating congifuration for %s", key);
                    config.insert({
                        _id: key,
                        value: {
                            bitcoin: {
                                max: (5).toSatoshi(),
                                min: 100
                            },
                            litecoin: {
                                max: (50).toSatoshi(),
                                min: 100
                            },
                            dogecoin: {
                                max: (5000000).toSatoshi(),
                                min: 100
                            },
                            ppcoin: {
                                max: (50).toSatoshi(),
                                min: 100
                            },
                            namecoin: {
                                max: (50).toSatoshi(),
                                min: 100
                            }
                        }
                    }, function(err) {
                        if (err) return logger.error(err.message);
                    });
                } else {
                    if (err) return logger.error(err.message);
                }
            }
        });
    });

    return Config;
};
