'use strict';

var api = "<%= api.protocol %>://<%= api.host %>\\:<%= api.port %>/<%= api.base %>";
var circleApi = "<%= circleApi.protocol %>://<%= circleApi.host %>:<%= circleApi.port %>";
var reelsApi = "<%= reelsApi.protocol %>://<%= reelsApi.host %>:<%= reelsApi.port %>";
var httpUrl = "<%= api.protocol %>://<%= api.host %>:<%= api.port %>";

var getToday = function() {
    var now = new Date();
    now.setUTCHours(0);
    now.setUTCMinutes(0);
    now.setUTCSeconds(0);
    now.setUTCMilliseconds(0);
    return now.toISOString();
};

var getNow = function() {
    return new Date().toISOString();
};

var getYesterday = function() {
    var now = new Date();
    now.setUTCDate(now.getUTCDate() - 1);
    now.setUTCHours(0);
    now.setUTCMinutes(0);
    now.setUTCSeconds(0);
    now.setUTCMilliseconds(0);
    return now.toISOString();
};

var get7Days = function() {
    var now = new Date();
    return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
};

Application.Services.factory('Auth', ['$http', '$base64', function($http, $base64) {
    return function(username, password) {
        return $http.get(httpUrl + '/auth', {
            headers: {
                Authorization: "Basic " + $base64.encode(username + ":" + password)
            }
        });
    };
}]);

Application.Services.factory('GameTotals', ['$resource', function($resource) {
    return $resource(api + '/:game/totals', {
        unit: 'satoshi'
    }, {
        today: {
            method: 'GET',
            params: {
                date: getToday
            }
        },
        yesterday: {
            method: 'GET',
            params: {
                date: getYesterday
            }
        },
        past7: {
            method: 'GET',
            params: {
                since: get7Days,
                until: getNow
            }
        }
    });
}]);

Application.Services.factory('PlayerInfo', ['$resource', function($resource) {
    return $resource(api + '/circle/player/:id/:command', {
        unit: 'satoshi',
        type: 'human'
    }, {
        timeline: {
            method: 'GET',
            params: {
                command: 'timeline'
            },
            isArray: true
        }
    });
}]);

Application.Services.factory('PlayerStats', ['$resource', function($resource) {
    return $resource(api + '/account/:command/:target/:query', {}, {
        getRegisteredPlayers: {
            method: 'GET',
            params: {
                command: 'list',
                target: 'registered'
            },
        },
        getAnonymousPlayers: {
            method: 'GET',
            params: {
                command: 'list',
                target: 'anonymous'
            },
        },
        getNotVerifiedPlayers: {
            method: 'GET',
            params: {
                command: 'list',
                target: 'notverified'
            },
        },
        getPlayer: {
            method: 'GET',
            params: {
                target: '@playerId'
            }
        },
        getTransactions: {
            method: 'GET',
            params: {
                command: '@playerId',
                target: 'transactions'
            }
        },
        getGameHistory: {
            method: 'GET',
            params: {
                command: '@playerId',
                target: 'gamehistory'
            },
        },
        getMessages: {
            method: 'GET',
            params: {
                command: '@playerId',
                target: 'messages'
            },
            isArray: true
        },
        getTotal: {
            method: 'GET',
            params: {
                command: 'totals',
                target: '@type'
            }
        },
        searchTransactions: {
            method: 'GET',
            params: {
                command: 'search',
                target: 'transaction'
            }
        },
        searchUsers: {
            method: 'GET',
            params: {
                command: 'search',
                query: '@query'
            }
        },
        getMonthlyBetsWins: {
            method: 'GET',
            params: {
                command: 'game',
                target: 'btc',
                query: 'month'
            },
            isArray: true
        },
        getDailyBetsWins: {
            method: 'GET',
            params: {
                command: 'game',
                target: 'btc',
                query: 'day'
            },
            isArray: true
        },
        getMonthlyCashings: {
            method: 'GET',
            params: {
                command: 'cashing',
                target: 'btc',
                query: 'month'
            },
            isArray: true
        },
        getDailyCashings: {
            method: 'GET',
            params: {
                command: 'cashing',
                target: 'btc',
                query: 'day'
            },
            isArray: true
        },
        genericFilter: {
            method: 'GET',
            params: {
                command: 'search'
            }
        },
        getPlayerGameStats: {
            method: 'GET',
            params: {
                command: '@playerId',
                target: '@game',
                query: 'stats'
            },
            isArray:true
        },
        getCSV: {
            method: 'POST',
            params: {
                command: 'export'
            }
        },
        getAffiliateTotals: {
            method: 'GET',
            params: {
                target: 'affiliates',
                query: 'totals'
            },
            isArray:true
        },
        getAssociatesTotals: {
            method: 'GET',
            params: {
                command: 'affiliate',
                target: '@affiliateId',
                query: 'associates'
            },
            isArray:true
        },
        getTotalsInDateRange: {
            params: {
                target: 'daterange',
                query: 'totals'
            },
            isArray: true
        },
        getIPHistory: {
            params: {
                query: 'ips'
            }
        },
        getUsersByIP: {
            params: {
                query: 'users'
            }
        }
    });
}]);

Application.Services.factory('PlayerModifier', ['$resource', function($resource) {
    return $resource(api + '/account/:playerId/:command', {}, {
        lockUser: {
            method: 'PUT',
            params: {
                playerId: '@playerId',
                command: 'lock'
            }
        },
        unlockUser: {
            method: 'PUT',
            params: {
                playerId: '@playerId',
                command: 'unlock'
            }
        },
        omitUser: {
            method: 'PUT',
            params: {
                playerId: '@playerId',
                command: 'omit'
            }
        },
        unomitUser: {
            method: 'PUT',
            params: {
                playerId: '@playerId',
                command: 'unomit'
            }
        },
        trustUser: {
            method: 'PUT',
            params: {
                playerId: '@playerId',
                command: 'trust'
            }
        },
        untrustUser: {
            method: 'PUT',
            params: {
                playerId: '@playerId',
                command: 'untrust'
            }
        }
    });
}]);

Application.Services.factory('SupportApi', ['$resource', function($resource) {
    return $resource(api + '/ticket/:command/:target', {}, {
        getOpenTickets: {
            method: 'GET',
            params: {
                command: 'status',
                target: 1
            }
        },
        getClosedTickets: {
            method: 'GET',
            params: {
                command: 'status',
                target: 2
            }
        },
        getPendingTickets: {
            method: 'GET',
            params: {
                command: 'status',
                target: 3
            }
        },
        getFlaggedTickets: {
            method: 'GET',
            params: {
                command: 'status',
                target: 4
            }
        },
        getTicketDetails: {
            method: 'GET',
            params: {
                target: '@id'
            }
        },
        changeTicketStatus: {
            method: 'PUT',
            params: {
                target: '@id'
            }
        },
        commentTicket: {
            method: 'PUT',
            params: {
                command: 'comment',
                target: '@id'
            }
        }
    });
}]);


Application.Services.factory('Games', ['$resource', function($resource) {
    return $resource(api + '/games/:game/:type/:target', {}, {
        getUnplayedGamePlayers: {
            method: 'GET',
            params: {
                type: 'unplayed',
                target: 'players'
            },
            isArray: true
        },
        getUnplayedGames: {
            method: 'GET',
            params: {
                type: 'unplayed'
            }
        }
    });
}]);

Application.Services.factory('Bonus', ['$http', function($http) {
    return {
        give: function(bonusData, success, failure) {
            if (failure === undefined) {
                failure = function(data, status) {
                    console.error("error giving bonus", status, data);
                };
            }
            $http({
                method: 'POST',
                url: httpUrl + '/account/bonus',
                data: bonusData
            }).success(function(data) {
                return success(data);
            }).error(function(data, status) {
                return failure(data, status);
            });
        }
    };
}]);

Application.Services.factory('UserNotification', ['$resource', function($resource) {
    return $resource(api + '/account/notification');
}]);

Application.Services.factory('BTCExchangeRate', ['$resource', function($resource) {
    return $resource(api + '/exchangerate');
}]);

Application.Services.factory('AddressBalance', ['$resource', function($resource) {
    return $resource(api + '/balance/:address');
}]);

Application.Services.factory('HouseBalance', ['$resource', function($resource) {
    return $resource(api + '/house/balance');
}]);

Application.Services.factory('CircleApi', ['$resource', function($resource) {
    return $resource(circleApi + '/circle/:id');
}]);

Application.Services.factory('ReelsApi', ['$resource', function($resource) {
    return $resource(reelsApi + '/reel/:id');
}]);

Application.Services.constant('Api', {
    url: api,
    scheme: "<%= api.protocol %>",
    hostname: "<%= api.host %>",
    port: "<%= api.port %>",
    base: "<%= api.base %>"
});
