'use strict';

var TransactionController = function($scope, $location, PlayerStats) {
    var initDatapoints = function(){
        return {
            transaction_meta: {},
            transaction_userid: {},
            transaction_amount: {
                lookup: {
                    operator: 'any'
                }
            },
            transaction_type: {
                lookup: {
                    value: 'any'
                },
                lookupTransform: function(datapoint){
                    if(datapoint.lookup && datapoint.lookup.value === 'any'){
                        datapoint.lookup = {operator:'in',value: ['withdraw', 'deposit']};
                        return datapoint;
                    }
                    if(datapoint.lookup && datapoint.lookup.value !== 'any'){
                        datapoint.lookup = {operator:'eq',value: datapoint.lookup.value};
                        return datapoint;
                    }
                }
            },
            transaction_date: {}
        };
    };

    $scope.data = {
        datapoints: initDatapoints()
    };
    $scope.sort = {datapoint: 'transaction_date', order:-1};

    var stripTime = function(date) {
        var newDate = new Date();
        newDate.setUTCDate(date.getDate());
        newDate.setUTCMonth(date.getMonth());
        newDate.setUTCFullYear(date.getFullYear());
        newDate.setUTCHours(0);
        newDate.setUTCMinutes(0);
        newDate.setUTCSeconds(0);
        newDate.setUTCMilliseconds(0);
        return newDate;
    };
    $scope.getMonthlyReports = function(){
        $scope.type = 'monthly';
        $scope.monthlyBetsWins = PlayerStats.getMonthlyBetsWins();
        $scope.monthlyCashings = PlayerStats.getMonthlyCashings();

        var now = new Date();
        var since = stripTime(new Date(now - (2 * 24 * 60 * 60 * 1000))).toISOString();
        $scope.dailyCashings = PlayerStats.getDailyCashings({since:since});
    };

    $scope.showCashflowView = function(){
        $scope.type = 'cashflow';
    };

    $scope.getPlayerStats = function(playerId) {
        $scope.loading = true;
        $scope.playerStats = PlayerStats.getPlayer({}, {playerId: playerId}, function(){
            $scope.loading = false;
        });
    };

    $scope.showUserTransactionHistory = function(){
        var self = this;
        setTimeout(function(){
            $scope.$apply(function(){
                $location.path('/history/'+self.playerStats._id);
            });
        }, 500);
    };

    $scope.showAffiliateView = function(range){
        $scope.type = 'affiliates';
        if(range){
            $scope.range = range;
        }else{
            $scope.range = {
                start: new Date(),
                end: new Date()
            };
        }
        $scope.affiliates = PlayerStats.getAffiliateTotals({
            since:$scope.range.start.toISOString(),
            until:$scope.range.end.toISOString()
        });
    };

    $scope.showAssociatesView = function(affiliateId){
        $scope.type = 'associates';
        $scope.associates = PlayerStats.getAssociatesTotals({}, {affiliateId: affiliateId});
    };

    $scope.getMonthlyReports();
};

Application.Controllers.controller('TransactionController', [
    '$scope',
    '$location',
    'PlayerStats',
    TransactionController
]);
