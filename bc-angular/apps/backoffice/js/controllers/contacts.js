(function(angular, Application) {
    'use strict';

    var ContactsController = function($scope, $routeParams, Promotion, Config) {
        $scope.promoList = Promotion.get(function() {
            $scope.promotions = $scope.promoList.result;
            $scope.promoMap = {};
            $scope.promotions.forEach(function(promo) {
                $scope.promoMap[promo._id] = promo.name;
            });
        });

        Config.query({search: 'vipLevels'}, function(data) {
            $scope.vipLevels = data[0].value;
        });
        if ($routeParams.listId) {
            $scope.templateUrl = 'tpl/contacts/detail.html';
        } else {
            $scope.templateUrl = 'tpl/contacts/list.html';
        }

    };

    var ListController = function($scope, ContactList) {
        $scope.lists = ContactList.query();

        $scope.newList = new ContactList({
            currency: 'bitcoin'
        });

        $scope.pendingPromos= [];
        $scope.selectedPromo = null;
        $scope.addPromo = function() {
            var index = parseInt($scope.selectedPromo, 10);
            if ($scope.selectedPromo !== null) {
                $scope.pendingPromos.push($scope.promotions.splice(index, 1)[0]);
            }
            $scope.selectedPromo = null;
        };

        $scope.saveNewList = function(newList) {
            newList.promos = $scope.pendingPromos.map(function(promo) {
                return promo._id;
            });
            newList.$save(function(newList) {
                $scope.lists.unshift(newList);
                $scope.pendingPromos = [];
                $scope.newList = new ContactList();
            });
        };

        $scope.deleteList = function(index, list) {
            index = parseInt(index, 10);
            list.$delete(function() {
                $scope.lists.splice(index, 1);
            });
        };
    };

    var ContactListController = function($scope, $routeParams, ContactList) {
        var listId = $scope.listId = $routeParams.listId;
        $scope.list = ContactList.get({listId: listId}, function() {
            // sort users by deposited btc descending
            $scope.list.contacts(function(a, b) {
                return b.deposited.bitcoin - a.deposited.bitcoin;
            });
        });
    };

    Application.Controllers.controller('ContactsController', [
        '$scope',
        '$routeParams',
        'Promotion',
        'Config',
        ContactsController
    ]);

    Application.Controllers.controller('ContactListListController', [
        '$scope',
        'ContactList',
        ListController
    ]);

    Application.Controllers.controller('ContactListController', [
        '$scope',
        '$routeParams',
        'ContactList',
        ContactListController
    ]);

})(window.angular, window.Application);
