'use strict';

var bonusinfo = function() {
    return {
        restrict:'E',
        scope: {
            bonus: "=",
            activateMsg: "@"
        },
        templateUrl: 'tpl/directives/bonusinfo.html',
        link: function() { //scope,element,attrs
        }
    };
};
Application.Directives.directive('bonusinfo', [bonusinfo]);
