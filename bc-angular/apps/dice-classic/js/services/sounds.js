'use strict';

/* global soundManager */

Application.Services.service('Sounds', function() {
    var sounds = {};
    soundManager.setup({
        // where to find flash audio SWFs, as needed
        url: 'swf',
        // optional: prefer HTML5 over Flash for MP3/MP4
        preferFlash: true,
        onready: function() {
            sounds.spinSound = soundManager.createSound({
                url: ['sounds/spin.mp3','sounds/spin.ogg','sounds/spin.m4a'],
                autoLoad: true,
                autoPlay: false,
                onload: function() {
                    //console.info('The sound '+this.id+' loaded!');
                },
                volume: 30
            });

            sounds.winSound = soundManager.createSound({
                url: ['sounds/778183_SOUNDDOGS_ca.mp3','sounds/778183_SOUNDDOGS_ca.ogg','sounds/778183_SOUNDDOGS_ca.m4a'],
                autoLoad: true,
                autoPlay: false,
                onload: function() {
                    //console.info('The sound '+this.id+' loaded!');
                },
                volume: 30
            });
        }
    });

    sounds.mute = function () {
        soundManager.mute();
    };

    sounds.unmute = function () {
        soundManager.unmute();
    };

    return sounds;
});

