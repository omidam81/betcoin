'use strict';

var filterTable = function(PlayerStats, DataQuery) {
    return {
        restrict: 'E',
        scope: {
            data:'=',
            page:'=',
            total:'=',
            sort:'=',
            size:'@'
        },
        link: function(scope) {
            scope.initDatapoints = angular.copy(scope.data.datapoints);
            scope.data.size = parseInt(scope.size);
            scope.$parent.filter = function(page) {
                var query = DataQuery.generate(scope.data.datapoints, page, scope.sort, scope.data.size);
                scope.data.return = PlayerStats.genericFilter({
                    q: JSON.stringify(query)
                }, function(results) {
                    scope.total = results.total;
                });
            };
            scope.$parent.clearFilters = function(){
                scope.data.datapoints = angular.copy(scope.initDatapoints);
            };
            scope.$parent.selectPage = function(page) {
                scope.$parent.filter(page);
            };
            if(!scope.data.init){
                scope.$parent.filter();
                scope.data.init = true;
            }
        }
    };
};

Application.Directives.directive('filterTable', ['PlayerStats', 'DataQuery', filterTable]);