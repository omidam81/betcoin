'use strict';

var DataDefinitions = function() {
    this.CollectionDefinitions = [
        {
            name: 'user',
            datapoints: [{
                name: 'userid',
                type: 'objectid',
                format: '$_id'
            }, {
                name: 'username',
                field: 'username',
                format: '$username'
            }, {
                name: 'email',
                field: 'email',
                format: '$email'
            }, {
                name: 'balance_btc',
                field: 'balance.btc',
                type: 'btc',
                format: '$balance.btc'
            }, {
                name: 'deposit_address',
                field: 'deposit.btc.address',
                format: '$deposit.btc.address'
            }, {
                name: 'withdraw_address',
                field: 'withdraw.btc.address',
                format: '$withdraw.btc.address'
            }, {
                name: 'last_activity_time',
                field: 'updated',
                type: 'date',
                format: '$updated'
            }, {
                name: 'signin_num',
                field: 'signinNum',
                type: 'number',
                format: '$signinNum'
            }, {
                name: 'email_verified',
                type: 'boolean',
                format: {
                    $cond: [{
                        $and: [{
                            $ne: [{
                                $ifNull: ['$email', false]
                            },
                                  false
                                 ]
                        }, {
                            $eq: [{
                                $ifNull: ['$emailToken', false]
                            },
                                  false
                                 ]
                        }]
                    },
                            true, false
                           ]
                }
            }, {
                name: 'is_online',
                type: 'boolean',
                format: {
                    $cond: [{
                        $ne: ['$socket', false]
                    },
                            true, false
                           ]
                }
            }, {
                name: 'user_created_datetime',
                type: 'date',
                format: '$_id',
                postProcess: function(val) {
                    return val.getTimestamp();
                }
            }, {
                name: 'anonymous_upgraded_datetime',
                type: 'date',
                format: '$anonymousUpgradedDate'
            }, {
                name: 'user_status',
                type: 'boolean',
                format: {
                    $cond: [{
                        $and: [{
                            $ne: [{
                                $ifNull: ['$email', false]
                            },
                                  false
                                 ]
                        }, {
                            $ne: [{
                                $ifNull: ['$withdraw.btc.address', false]
                            },
                                  false
                                 ]
                        }]
                    }, 'verified', {
                        $cond: [{
                            $and: [{
                                $ne: [{
                                    $ifNull: ['$email', false]
                                },
                                      false
                                     ]
                            }, {
                                $eq: [{
                                    $ifNull: ['$withdraw.btc.address', false]
                                },
                                      false
                                     ]
                            }]
                        },
                                'partial_verified',
                                'anonymous'
                               ]
                    }]
                }
            }, {
                name: 'is_omitted',
                type: 'boolean',
                format: {
                    $cond: [{
                        $ne: ['$omitted', true]
                    },
                            false, true
                           ]
                }
            }]
        },
        {
            name: 'transaction',
            datapoints: [{
                name: 'last_deposited',
                groupBy: 'userId',
                field: 'date',
                format: {$max: '$date'}
            }, {
                name: 'transaction_meta',
                field: 'meta',
                format: '$meta'
            }, {
                name: 'transaction_userid',
                field: 'userId',
                type: 'objectid',
                format: '$userId'
            }, {
                name: 'transaction_type',
                field: 'type',
                format: '$type'
            }, {
                name: 'transaction_game_type',
                field: 'type',
                format: '$type',
                postProcess: function(val) {
                    if (!val || val.split(':').length !== 2)
                        return val;
                    return val.split(':')[0];
                }
            }, {
                name: 'transaction_game_action',
                field: 'type',
                format: '$type',
                postProcess: function(val) {
                    if (!val || val.split(':').length !== 2)
                        return val;
                    return val.split(':')[1];
                }
            }, {
                name: 'transaction_amount',
                format: {
                    $cond: [{
                        $gt: ['$amtIn', 0]
                    }, '$amtIn', '$amtOut']
                },
                type: 'btc'
            }, {
                name: 'transaction_date',
                type: 'date',
                field: 'date',
                format: '$date'
            }, {
                name: 'transaction_week',
                format: {
                    $week: [ "$date" ]
                }
            }, {
                name: 'transaction_refId',
                format: '$refId'
            }, {
                name: 'transaction_is_game',
                type: 'boolean',
                format: {
                    $cond: [{
                        $and: [{
                            $ne: ['$type',
                                  'deposit'
                                 ]
                        }, {
                            $ne: ['$type',
                                  'withdraw'
                                 ]
                        }]
                    },
                            true, false
                           ]
                }
            }, {
                name: 'transaction_deposited',
                type: 'btc',
                format: {
                    $cond:[{$eq: ['$type', 'deposit']}, '$amtIn', 0]
                }
            }, {
                name: 'transaction_withdrawn',
                type: 'btc',
                format: {
                    $cond:[{$eq: ['$type', 'withdraw']}, '$amtOut', 0]
                }
            }, {
                name: 'transaction_game_won',
                type: 'btc',
                format: {
                    $cond:[{$and: [{$ne:['$type','deposit']}, {$ne:['$type','withdraw']}, {$ne:['$type','match-bonus']}, {$ne:['$type','straight-bonus']}, {$ne:['$type','welcome-bonus']}]}, '$amtIn', 0]
                }
            }, {
                name: 'transaction_game_wager',
                type: 'btc',
                format: {
                    $cond:[{$and: [{$ne:['$type','deposit']}, {$ne:['$type','withdraw']}]}, '$amtOut', 0]
                }
            }, {
                name: 'transaction_bonus',
                type: 'btc',
                format: {
                    $cond:[{$or: [{$eq:['$type','match-bonus']}, {$eq:['$type','straight-bonus']}, {$eq:['$type','welcome-bonus']}]}, '$amtIn', 0]
                }
            }, {
                name: 'transaction_deposited_total',
                type: 'btc',
                groupBy: 'userId',
                field: 'transaction_deposited',
                format: {
                    $sum: '$transaction_deposited'
                }
            }, {
                name: 'transaction_withdrawn_total',
                type: 'btc',
                groupBy: 'userId',
                field: 'transaction_withdrawn',
                format: {
                    $sum: '$transaction_withdrawn'
                }
            }, {
                name: 'transaction_game_won_total',
                type: 'btc',
                groupBy: 'userId',
                field: 'transaction_game_won',
                format: {
                    $sum: '$transaction_game_won'
                }
            }, {
                name: 'transaction_game_wager_total',
                type: 'btc',
                groupBy: 'userId',
                field: 'transaction_game_wager',
                format: {
                    $sum: '$transaction_game_wager'
                }
            }, {
                name: 'transaction_deposited_total_weekly',
                type: 'btc',
                groupBy: 'transaction_week',
                field: 'transaction_deposited',
                format: {
                    $sum: '$transaction_deposited'
                }
            }, {
                name: 'transaction_withdrawn_total_weekly',
                type: 'btc',
                groupBy: 'transaction_week',
                field: 'transaction_withdrawn',
                format: {
                    $sum: '$transaction_withdrawn'
                }
            }, {
                name: 'transaction_game_won_total_weekly',
                type: 'btc',
                groupBy: 'transaction_week',
                field: 'transaction_game_won',
                format: {
                    $sum: '$transaction_game_won'
                }
            }, {
                name: 'transaction_game_wager_total_weekly',
                type: 'btc',
                groupBy: 'transaction_week',
                field: 'transaction_game_wager',
                format: {
                    $sum: '$transaction_game_wager'
                }
            }, {
                name: 'transaction_bonus_total',
                type: 'btc',
                groupBy: 'userId',
                field: 'transaction_bonus',
                format: {
                    $sum: '$transaction_bonus'
                }
            }, {
                name: 'NGR',
                type: 'btc',
                field: ['transaction_game_won_total', 'transaction_game_wager_total', 'transaction_bonus_total'],
                postProject: true,
                format: {
                    $subtract: [{$subtract:['$transaction_game_won_total', '$transaction_game_wager_total']}, '$transaction_bonus_total']
                }
            }, {
                name: 'GGR',
                type: 'btc',
                field: ['transaction_withdrawn_total', 'transaction_deposited_total', 'transaction_bonus_total'],
                postProject: true,
                format: {
                    $subtract: [{$subtract:['$transaction_withdrawn_total', '$transaction_deposited_total']}, '$transaction_bonus_total']
                }
            }]
        }
    ];
};


DataDefinitions.prototype.getAllDataDefinitions = function() {
    var self = this;
    var definitions = [],
    hashcheck = {};
    for (var i in self.CollectionDefinitions) {
        if (self.CollectionDefinitions.hasOwnProperty(i)) {
            for (var j in self.CollectionDefinitions[i].datapoints) {
                if (self.CollectionDefinitions[i].datapoints.hasOwnProperty(j)) {
                    var datapoint = self.CollectionDefinitions[i].datapoints[j];
                    datapoint.collection = self.CollectionDefinitions[i].name;
                    if (hashcheck[datapoint.name]) throw Error("The data definition name should be unique");
                    definitions.push(datapoint);
                    hashcheck[datapoint.name] = datapoint;
                }
            }
        }
    }
    return definitions;
};

DataDefinitions.prototype.getDataDefinition = function(name) {
    var self = this;
    for (var i in self.CollectionDefinitions) {
        if (self.CollectionDefinitions.hasOwnProperty(i)) {
            for (var j in self.CollectionDefinitions[i].datapoints) {
                if (self.CollectionDefinitions[i].datapoints.hasOwnProperty(j)) {
                    var datapoint = self.CollectionDefinitions[i].datapoints[j];
                    if (datapoint.name === name) {
                        datapoint.collection = self.CollectionDefinitions[i].name;
                        return datapoint;
                    }
                }
            }
        }
    }
};

DataDefinitions.prototype.getCollectionNames = function(datapoints) {
    var self = this;
    var collectionNames = {};
    datapoints.forEach(function(datapoint) {
        var DataDefinitions = self.getDataDefinition(datapoint.name);
        collectionNames[DataDefinitions.collection] = 1;
    });
    var nameList = [];
    for (var name in collectionNames) {
        if (collectionNames.hasOwnProperty(name)) {
            nameList.push(name);
        }
    }
    return nameList;
};

module.exports = DataDefinitions;
