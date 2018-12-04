'use strict';

var VisibilityFactory = function ($rootScope){
    var VisibilityFactory = {};
    VisibilityFactory.isPageVisible = function () {
        function checkVisibility (){
            $rootScope.$broadcast('visibilityChanged', document.hidden || document.webkitHidden || document.mozHidden || document.msHidden);
        }
        document.addEventListener("visibilitychange", checkVisibility);
        document.addEventListener("webkitvisibilitychange", checkVisibility);
        document.addEventListener("msvisibilitychange", checkVisibility);
        document.addEventListener("mozvisibilitychange", checkVisibility);

    };
    return VisibilityFactory;
};

Application.Services.factory('VisibilityFactory', ['$rootScope', VisibilityFactory]);


