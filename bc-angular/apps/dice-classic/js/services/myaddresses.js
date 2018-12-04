'use strict';

var MyAddresses = function($rootScope, $cookies) {
    var addresses;
    try {
        addresses = JSON.parse($cookies.addresses) || [];
    } catch (ex) {
        addresses = [];
    }
    var scope = $rootScope.$new();
    scope.saveAddresses = function() {
        scope.$broadcast('addressesChanged', addresses);
        document.cookie = "addresses="+JSON.stringify(addresses)+"; expires=Thu, 18 Dec 2025 12:00:00 GMT; path=/";
    };
    scope.addAddress = function(address) {
        addresses.push(address);
        this.saveAddresses();
        googleanalytics('send', 'event', 'dice', 'myaddresses', 'added');
        return addresses;
    };
    scope.removeAddress = function(address) {
        var index = addresses.indexOf(address);
        if (index >= 0) {
            addresses.splice(index, 1);
            this.saveAddresses();
        }
        googleanalytics('send', 'event', 'dice', 'myaddresses', 'removed');
        return addresses;
    };
    scope.getAddresses = function() {
        return addresses;
    };
    scope.isMine = function(address) {
        return addresses.indexOf(address) >= 0;
    };
    return scope;
};

Application.Services.factory('MyAddresses', ["$rootScope", "$cookies", MyAddresses]);
