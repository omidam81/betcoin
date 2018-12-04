'use strict';

// display a modal asking if the user wants to visit our site in their 
// own language. This is triggered by the reported browser language 
// not matching the main language of the site they are currently viewing.
//
// Note! Browser language reporting is a hit and miss process and varies 
// between browsers (as usual). IE will only report the language of the OS
// and not the language set under internet options.
//
// Once the user has made a choice from the dialog (even if that choice is
// to cancel the dialog and stay on the current site) a cookie is set so
// that we don't pester them again.

var bcLangCheckController = function($scope, $location, BCSession, ipCookie) {

    var LANG_COOKIE = 'bcLangCheck';

    // have we have already asked this user on this browsr? If so don't ask again
    if (ipCookie(LANG_COOKIE)) {
        return;
    }

    // if we are running on localhost just skip the check
    if (($location.host() === 'localhost') || ($location.host() === '127.0.0.1')){
        return;
    }

    // ok so now check if user is visiting uk site with browser lang set to zh 
    // or zh site with language set to en

    // for now assume site is https://www.caishentang.com if it is not
    // betcoin.tm (english)

    var ENGLISH_SITE = new RegExp('betcoin.tm$');

    var hostIsEnglish = ($location.host().match(ENGLISH_SITE));

    var defaultLanguage = 'en';
    var browserLanguage = (navigator.language ||
                            navigator.userLanguage ||
                            navigator.browserLanguage ||
                            navigator.systemLanguage ||
                            defaultLanguage).slice(0,2);
    var browserIsEnglish = (browserLanguage === 'en');

    // console.log('browserLanguage: ',browserLanguage);
    // console.log('hostIsEnglish: ',hostIsEnglish);

    if (hostIsEnglish && !browserIsEnglish) {
        // ask if they want to switch to the zh site

        // console.log('ASK SWITCH TO ZH');
        $scope.otherSiteURL="https://www.caishentang.com";

    } else if (!hostIsEnglish && browserIsEnglish) {
        // as if they want to switch to the en site

        // console.log('ASK SWITCH TO UK');
        $scope.otherSiteURL="https://betcoin.tm";
    } else {
        return;
    }

    $scope.siteSelectCanceled = function() {
        ipCookie(LANG_COOKIE, 'set');
        $('#modal-language-check').modal('hide');
    };

    $scope.siteSelected = function() {
        ipCookie(LANG_COOKIE, 'set');
        window.location = $scope.otherSiteURL;
    };

    $('#modal-language-check').modal('show');
};

Application.Controllers.controller('bcLangCheckController', [
    "$scope",
    "$location",
    "BCSession",
    "ipCookie",
    bcLangCheckController
]);
