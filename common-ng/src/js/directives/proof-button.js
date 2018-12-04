'use strict';
Application.Directives.directive('proofButton', [

   function() {
       return {
           replace: true,
           restrict: 'E',
           templateUrl: 'tpl/directives/proof-button.html',
           link: function(scope)
           {
               var popOverInit = false;
               var currentNext;
               var elem = $('#proof');
               scope.showPopover = function(header) {
                   if (scope.nextGameId === currentNext) {
                       return;
                   }
                   currentNext = scope.nextGameId;
                   var popoverString = '<span style="text-align:center;word-wrap:break-word"><span>' + header + '</span><br>' +
                                                   '<span class="small">' + scope.nextGameId + '</span><br>' +
                                                   '<span>SHA256:</span><br>' +
                                                   '<span class="small">' + scope.sha256 + '</span></span>';
                   elem.popover('destroy');
                   elem.popover({trigger: 'click',
                                 html: true,
                                 content: popoverString,
                                 placement: 'top'
                               });
                   if (!popOverInit) {
                       elem.popover('toggle');
                       popOverInit = true;
                   }
               };
               scope.$watch('isGameInProgress', function(val){
                   if(val === true){
                        if (popOverInit) {
                           elem.popover('toggle');
                       }
                   }
               });
           }
       };
    }
]);
