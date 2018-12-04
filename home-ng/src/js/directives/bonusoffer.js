'use strict';

Application.Directives.directive('bonusoffer', ['BCPlayer', function(BCPlayer) {
    return {
        restrict:'E',
        scope: {
            unlockMultiplier: "@",
            type:"@",
            max:"@",
            id:"@"
        },
        templateUrl: 'tpl/directives/bonusoffer.html',
        link: function(scope) { //scope,element,attrs


          scope.acceptBonus = function (){
              scope.error = null;
              BCPlayer.User.acceptBonus({range: scope.id}, function(){
                window.location.reload();
              }, function(err){
                  scope.error = err.data;
              });
          };
          scope.rejectBonus = function (){
              scope.error = null;
              BCPlayer.User.rejectBonus({range: scope.id}, function(){
                window.location.reload();
              }, function(err){
                  scope.error = err.data;
              });
          };
        }
    };
}]);
