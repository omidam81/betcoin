'use strict';

var playerDetails = function($location, DataQuery, PlayerStats) {
    return {
        replace: true,
        restrict: 'E',
        scope: {
            playerStats: '=',
        },
        templateUrl: 'tpl/directives/player-details.html',
        link: function(scope) {
            scope.$watch('playerStats._id', function(val){
                if(val){
                    var datapoints = {
                        userid: {
                            lookup: {
                                operator: 'eq',
                                value: scope.playerStats._id
                            }
                        },
                        user_created_datetime: {}
                    };
                    var queries = DataQuery.generate(datapoints);
                    PlayerStats.genericFilter({q: JSON.stringify(queries)}, function(d){
                        scope.playerStats.user_created_datetime = d.results[0].user_created_datetime;
                    });
                }
            });
            scope.showUserDetails = function(){
                var self = this;
                setTimeout(function(){
                    scope.$apply(function(){
                        $location.path('/player/'+self.playerStats._id+'/history');
                    });
                }, 500);
            };

            scope.showUserTransactionHistory = function(){
                var self = this;
                setTimeout(function(){
                    scope.$apply(function(){
                        $location.path('/player/'+self.playerStats._id+'/history/transaction');
                    });
                }, 500);
            };
        }
    };
};
Application.Directives.directive('playerDetails', ['$location', 'DataQuery', 'PlayerStats', playerDetails]);
