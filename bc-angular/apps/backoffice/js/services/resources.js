'use strict';

var api = "https://<%= hostname_office %>\\:443/backoffice";
// var circleApi = "https://<%= hostname %>:443";
// var reelsApi = "https://<%= hostname %>:443";
var httpUrl = "https://<%= hostname_office %>:443/backoffice";

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

Application.Services.factory('ActiveUsers', ['$http', function($http) {
    return {
        get: function() {
            return $http.get(httpUrl + '/active-users');
        }
    };
}]);

Application.Services.factory('ColdStorage', ['$resource', function($resource) {
    return $resource(api + '/coldstorage/:action', {
        action: 'transactions'
    });
}]);

Application.Services.factory('GameTotals', ['$resource', function($resource) {
    return $resource(api + '/totals/:game', {
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
    return $resource(api + '/support/:target/:ticketId', {target: 'ticket'}, {
        comment: {
            method: 'PUT'
        }
    });
}]);

Application.Services.factory('Cashout', ['$resource', function($resource) {
    return $resource(api + '/cashout/:txid/:action', {
        txid: '@_id'
    }, {
        send: {
            method: 'GET',
            params: {
                action: 'send'
            }
        },
        seize: {
            method: 'GET',
            params: {
                action: 'seize'
            }
        },
        cancel: {
            method: 'GET',
            params: {
                action: 'cancel'
            }
        }
    });
}]);

Application.Services.factory('Config', ['$resource', function($resource) {
    return $resource(api + '/config/:confId', {
        confId: '@_id'
    });
}]);

Application.Services.factory('BTCExchangeRate', ['$resource', function($resource) {
    return $resource(api + '/exchangerate');
}]);

Application.Services.factory('WelcomePack', function($resource) {
    var WelcomePack = $resource(api + '/welcomepack/:_id');
    return WelcomePack;
});

Application.Services.factory('Agent', ['$resource', function($resource) {
    var Agent = $resource(api + '/agent/:_id');
    return Agent;
}]);

Application.Services.factory('Rep', ['$resource', function($resource) {
    var Rep = $resource(api + '/rep/:_id');
    return Rep;
}]);

Application.Services.factory('Promotion', ['$resource', function($resource) {
    var Promotion = $resource(api + '/promotion/:promoId', {
        promoId: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
    return Promotion;
}]);

Application.Services.factory('ContactList', ['$resource', function($resource) {
    var ContactList = $resource(api + '/contact-list/:listId', {
        listId: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
    return ContactList;
}]);

Application.Services.factory('Alert', ['$resource', function($resource) {
    var Alert = $resource(api + '/save/alert/:alertId', {
        alertId: '@_id'
    }, {
        update: {
            method: 'PUT'
        }
    });
    return Alert;
}]);

Application.Services.constant('Api', {
    url: api,
    httpUrl: httpUrl,
    scheme: "https",
    hostname: "<%= hostname_office %>",
    port: 443,
    base: "backoffice"
});
