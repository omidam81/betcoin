'use strict';

var BankrollController = function($scope, AddressBalance, PlayerStats, HouseBalance) {
    $scope.addresses = {
        'dice': [
            {address: "1BCDice2HFUg2Ra61CidQtvd1tUAnLbyr4", balance: 0}
        ],
        'circle': [
            {address: "1CfsAiYaVfk12dnZpZALcRSP9jjWDk26FX", balance: 0},
            {address: "1BTPSjiSC1s3A5cqJrbDRi2LAHx3U88mKR", balance: 0}
        ],
        'prize': [
            {address: "1FARgDea1EhyZsCe56ibpkQK4jRuiyb8io", balance: 0}
        ]
    };

    angular.forEach($scope.addresses, function(addrGroup, name) {
        addrGroup.forEach(function(addrObj, index) {
            AddressBalance.get({address: addrObj.address}, function(data) {
                $scope.addresses[name][index].balance = data.final_balance;
                if(name === 'dice'){
                    $scope.diceTotalAmount = data.final_balance;
                }
                if(name === 'prize'){
                    $scope.prizeTotalAmount = data.final_balance;
                }
            });
        });
    });

    $scope.totalAmount = PlayerStats.getTotal({}, {type:'amount'});
    $scope.houseBalance = HouseBalance.get();
    $scope.totalOnline = PlayerStats.getTotal({}, {
        type: 'online'
    });
};

Application.Controllers.controller('BankrollController', [
    '$scope',
    'AddressBalance',
    'PlayerStats',
    'HouseBalance',
    BankrollController
]);
