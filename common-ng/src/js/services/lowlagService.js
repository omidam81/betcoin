'use strict';

/* global lowLag */

Application.Services.service('LowLagSounds', ['$rootScope', function($rootScope) {

    lowLag.init({
        debug : "none",
        urlPrefix: "sounds/"
    });

    // console.log($.ua.os.name);

    if ($.ua.os.name === 'iOS') {
        lowLag.load(['blank.m4a'], 'blankSound');
        lowLag.load(['intro.m4a'], 'introSound');
        lowLag.load(['spin.m4a'], 'spinSound');
        lowLag.load(['778183_SOUNDDOGS_ca.m4a'], 'winSound');
        lowLag.load(['770777_SOUNDDOGS_th.m4a'], 'bigWinSound');
        lowLag.load(['lose.m4a'], 'loseSound');
        lowLag.load(['770776_SOUNDDOGS_th.m4a'], 'hugeWinSound');
        lowLag.load(['770776_SOUNDDOGS_th.m4a'], 'hugeWinSound');
        lowLag.load(['778205_SOUNDDOGS_sl.m4a'], 'depositSound');
        lowLag.load(['279428_SOUNDDOGS_ca.m4a'], 'cashoutSound');
        lowLag.load(['dealcard.m4a'], 'dealCard');
    } else {
        lowLag.load(['blank.mp3','blank.ogg','blank.m4a'], 'blankSound');
        lowLag.load(['intro.mp3','intro.ogg','intro.m4a'], 'introSound');
        lowLag.load(['spin.mp3', 'spin.ogg', 'spin.m4a'], 'spinSound');
        lowLag.load(['778183_SOUNDDOGS_ca.mp3','778183_SOUNDDOGS_ca.ogg','778183_SOUNDDOGS_ca.m4a'], 'winSound');
        lowLag.load(['770777_SOUNDDOGS_th.mp3','770777_SOUNDDOGS_th.ogg','770777_SOUNDDOGS_th.m4a'], 'bigWinSound');
        lowLag.load(['lose.mp3','lose.ogg','lose.m4a'], 'loseSound');
        lowLag.load(['770776_SOUNDDOGS_th.mp3','770776_SOUNDDOGS_th.ogg','770776_SOUNDDOGS_th.m4a'], 'hugeWinSound');
        lowLag.load(['770776_SOUNDDOGS_th.mp3','770776_SOUNDDOGS_th.ogg','770776_SOUNDDOGS_th.m4a'], 'hugeWinSound');
        lowLag.load(['778205_SOUNDDOGS_sl.mp3','778205_SOUNDDOGS_sl.ogg','778205_SOUNDDOGS_sl.m4a'], 'depositSound');
        lowLag.load(['279428_SOUNDDOGS_ca.mp3','279428_SOUNDDOGS_ca.ogg','279428_SOUNDDOGS_ca.m4a'], 'cashoutSound');
        lowLag.load(['dealcard.mp3','dealcard.ogg','dealcard.m4a'], 'dealCard');
    }
   /* 
    lowLag.load(['intro.m4a','intro.mp3','intro.ogg'], 'blankSound');
    lowLag.load(['intro.m4a','intro.mp3','intro.ogg'], 'introSound');
    lowLag.load(['spin.m4a', 'spin.mp3', 'spin.ogg'], 'spinSound');
    lowLag.load(['778183_SOUNDDOGS_ca.m4a','778183_SOUNDDOGS_ca.mp3','778183_SOUNDDOGS_ca.ogg'], 'winSound');
    lowLag.load(['770777_SOUNDDOGS_th.m4a','770777_SOUNDDOGS_th.mp3','770777_SOUNDDOGS_th.ogg'], 'bigWinSound');
    lowLag.load(['lose.m4a','lose.mp3','lose.ogg'], 'loseSound');
    lowLag.load(['770776_SOUNDDOGS_th.m4a','770776_SOUNDDOGS_th.mp3','770776_SOUNDDOGS_th.ogg'], 'hugeWinSound');
    lowLag.load(['770776_SOUNDDOGS_th.m4a','770776_SOUNDDOGS_th.mp3','770776_SOUNDDOGS_th.ogg'], 'hugeWinSound');
    lowLag.load(['778205_SOUNDDOGS_sl.m4a','778205_SOUNDDOGS_sl.mp3','778205_SOUNDDOGS_sl.ogg'], 'depositSound');
    lowLag.load(['279428_SOUNDDOGS_ca.m4a','279428_SOUNDDOGS_ca.mp3','279428_SOUNDDOGS_ca.ogg'], 'cashoutSound');
    lowLag.load(['dealcard.m4a','dealcard.mp3','dealcard.ogg'], 'dealCard');
*/

    this.play = function(soundID) {
        if ($rootScope.mute) {
            return;
        }
        lowLag.play(soundID);
    };

    this.mute = function() {
        $rootScope.mute = true;
        lowLag.mute();
    };

    this.unmute = function() {
        $rootScope.mute = false;
        lowLag.unmute();
    };

}]);


