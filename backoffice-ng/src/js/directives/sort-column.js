'use strict';

var sortColumn = function() {
    return {
        restrict: 'A',
        scope: {
            sortField: '@',
            sortObj: '=',
            sortFunc: '&sortFunc'
        },
        link: function(scope, element) {
            scope.sortObj = scope.sortObj || {};
            scope.$watch('sortObj', function(newVal){
                if(newVal && newVal.datapoint === scope.sortField){
                    $(element).addClass('glyphicon');
                }else {
                    $(element).removeClass(('glyphicon glyphicon-chevron-down glyphicon-chevron-up'));
                    return;
                }
                if(newVal.order === 1){
                    $(element).addClass('glyphicon-chevron-up');
                    $(element).removeClass('glyphicon-chevron-down');
                }else{
                    $(element).addClass('glyphicon-chevron-down');
                    $(element).removeClass('glyphicon-chevron-up');
                }
            }, true);
            $(element).click(function(){
                if(scope.sortObj.datapoint === scope.sortField){
                    scope.sortObj.order = - scope.sortObj.order;
                }else{
                    scope.sortObj.order = -1;
                    scope.sortObj.datapoint = scope.sortField;
                }
                
                scope.sortFunc();
            });
        }
    };
};
Application.Directives.directive('sortColumn', [sortColumn]);
