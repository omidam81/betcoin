'use strict';

Application.Directives.directive('blockchainInfo', [
    function() {
        return {
            scope: true,
            replace: true,
            template: "<a href=\"http://blockchain.info/search/{{searchTerm}}\" target=\"_blank\">{{displayString}}</a>",
            link: function(scope, element, attrs) {
                attrs.$observe('blockchainInfo', function(searchTerm) {
                    scope.searchTerm = searchTerm;
                    if (attrs.chars) {
                        scope.displayString = searchTerm.substring(0, attrs.chars) + "...";
                    } else {
                        scope.displayString = searchTerm;
                    }

                });
            }
        };
    }
]);
