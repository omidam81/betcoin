
'use strict';

var ErrorLocalesFactory = function ($http) {
    var localesFactory = {};
    $http({method: 'GET', url:'locales/app/locales.json'}).success(function(appLocales){
        localesFactory.appLocales = appLocales;
    });
    $http({method: 'GET', url:'locales/common/locales.json'}).success(function(commonLocales){
        // console.log(commonLocales);
        localesFactory.commonLocales = commonLocales;
    });
    localesFactory.getErrorLocale = function(errorCode) {
        if(localesFactory.appLocales.serverErrors && localesFactory.appLocales.serverErrors[errorCode] !== undefined){
            return localesFactory.appLocales.serverErrors[errorCode];
        }
        if(localesFactory.commonLocales.serverErrors && localesFactory.commonLocales.serverErrors[errorCode] !== undefined){
            return localesFactory.commonLocales.serverErrors[errorCode];
        }
    };
    return localesFactory;
};

Application.Services.factory('ErrorLocalesFactory', ['$http', ErrorLocalesFactory]);