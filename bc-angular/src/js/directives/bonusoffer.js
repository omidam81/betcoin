'use strict';

Application.Directives.directive('bonusoffer', ['BCPlayer', 'PlayerApi', 'exchangeRate', function(BCPlayer, PlayerApi, exchangeRate) {
    return {
        restrict:'E',
        scope: {
            bonuses:'=',
            user: '='
        },
        templateUrl: 'tpl/directives/bonusoffer.html',
        link: function(scope) {
            scope.$watchCollection('bonuses', function(newBonuses) {
                if (newBonuses) {
                    if(scope.bonuses.length === 1) {
                        if(scope.bonuses[0].activatedAt) {
                            scope.currentBonus = scope.bonuses[0];
                        } else {
                            scope.nextBonus = scope.bonuses[0];
                        }
                    } else if (scope.bonuses.length > 1) {
                        if(!scope.bonuses[0].activatedAt) {
                            scope.nextBonus = scope.bonuses[0];
                        } else {
                            scope.currentBonus = scope.bonuses[0];
                            scope.nextBonus = scope.bonuses[1];
                        }
                    }
                }
            });
            BCPlayer.$on('user update', scope.updateBonuses);
            scope.showmodal = function(modalId) {
                $.each($(".modal"), function(index, modal){ if($(modal).attr("id") && $(modal).attr("id") !==  modalId) { $(modal).modal('hide'); }  });
                $("#"+modalId).modal("show");
            };
            scope.lang = PlayerApi.lang;
            var fiat = (scope.lang === 'en_US') ? 'USD': 'CNY';
            scope.fiat = fiat;

            scope.getExchange = function(btcValue)  {
                
                var retval = exchangeRate.convert(btcValue, scope.fiat);
                return retval;

            };

            scope.updateBonuses = function() {

                scope.bonuses = BCPlayer.Bonus.query(function() {
                    console.log("bonuses gotten");
                });
            };

            scope.acceptBonus = function(bonus) {
                BCPlayer.Bonus.accept(bonus, function() {
                    scope.updateBonuses();
                });
            };

            scope.cancelBonus = function(bonus) {
                BCPlayer.Bonus.cancel({bonusId: bonus._id}, function() {
                    if (scope.nextBonus) {
                        scope.acceptBonus(scope.nextBonus);
                    }
                });
            };
        }
    };
}]);
