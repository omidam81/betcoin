'use strict';
/* global g_MainPlay */
var DiceController = function($scope, $rootScope, $window, MyAddresses, $cookies, Sounds, CacheServer) {


    $scope.newAddress = '';
    $scope.CacheServer = CacheServer;
    $scope.status = 'idle';
    $scope.stack = [];
    $scope.addresses = MyAddresses.getAddresses();
    if($cookies.muted){
        $scope.muted = true;
        $scope.soundIcon = 'img/sound-mute.png';
        Sounds.mute();
    } else {
        $scope.muted = false;
        $scope.soundIcon = 'img/sound.png';
    }

    /**
     * Animation part begins
     */
    $scope.animationsLoading = true;
    $scope.initAnimation = function(){
        var d = document;
        var c = {
            container:'gameCanvas',
            width: 650,
            height: 140,
            diceCount: 5,
            spinTime: 7200,
            SingleEngineFile:'src/kinetic-v5.0.2.min.js',
            MainPlayFile:'src/MainPlay.js'
        };
        document.kcConfig = c; //Kinetic config

        if(!d.createElement('canvas').getContext){
            var divel = d.createElement('div');
            divel.innerHTML = '<h2>Your browser does not support HTML5 canvas!</h2>' +
                '<p>Google Chrome is a browser that combines a minimal design with sophisticated technology to make the web faster, safer, and easier.Click the logo to download.</p>' +
                '<a href="http://www.google.com/chrome" target="_blank"><img src="http://www.google.com/intl/zh-CN/chrome/assets/common/images/chrome_logo_2x.png" border="0"/></a>';
            var p = d.getElementById(c.tag).parentNode;
            p.style.background = 'none';
            p.style.border = 'none';
            p.insertBefore(divel);

            d.body.style.background = '#ffffff';
            return;
        }

        var s = d.createElement('script');
        s.src = c.SingleEngineFile;
        s.id = 'kinetic-html5';
        d.body.appendChild(s);
        s.onload = function() {
            var m = d.createElement('script');
            m.src = c.MainPlayFile;
            m.id = 'mainplay';
            m.setAttribute('defer', 'defer');
            d.body.appendChild(m);

            var digestInterval = setInterval(function() {
                if ($scope.animationsLoading) {
                    $scope.$digest();
                }
            }, 500);

            $scope.$watch(
                function() {
                    return $window.animationInitialized;
                }, function(n) {
                    // animations loaded now
                    if (n === "done") {
                        $scope.animationsLoading = false;
                        clearInterval(digestInterval);
                    }
                }
            );
        };
    };

    $scope.initAnimation();
    /** Animation part ends */

    $scope.soundToggle = function() {
        if ($scope.muted === true) {
            Sounds.unmute();
            $scope.muted = false;
            $scope.soundIcon = 'img/sound.png';
            $cookies.muted = "";
        } else {
            Sounds.mute();
            $scope.muted = true;
            $scope.soundIcon = 'img/sound-mute.png';
            $cookies.muted = "1";
        }
    };

    $scope.simulateWin = function() {

        $scope.pushQ({
            game: 64000,
            player_id: "foobar",
            result: 62890,
            winnings: 8675309
        });


    };
    $scope.showWin = function() {
        if($scope.animating) {
            return;
        }
        // get the latest from the stack, if empty, just stop
        var dice = $scope.stack.shift();
        if (dice === undefined) { return; }

        $scope.status = 'rolling';
        Sounds.spinSound.play();
        $scope.gameinfo = dice;
        // set animation to true
        $scope.animating = true;

        // set a timeout to reveal a win message
        setTimeout(function() {
            $scope.status = 'revealed';
            if ($scope.gameinfo.result < $scope.gameinfo.game) {
                Sounds.winSound.play();
            } else {
                $scope.status = 'idle';
            }
            $scope.animating = false;
            $rootScope.$emit('diceAnimated', dice);

        }, 7200);

        setTimeout(function() {
            $scope.$apply(function() {
                $scope.status = 'idle';
                if($scope.stack.length > 0) { $scope.showWin(); }
            });

        },10000);

        g_MainPlay.runDice(dice.numbers);
    };
    $scope.simulateLoss = function() {

        $scope.pushQ({
            game: 1,
            player_id: "foobar",
            result: 12345,
            winnings: 0
        });
    };


    $scope.pushQ = function(dice) {
        var number = dice.result;
        var nString = number.toString();
        while (nString.length < 5) {
            nString = '0' + nString;
        }
        var numbers = [];
        nString.split('').forEach(function(number) {
            numbers.push(parseInt(number, 10));
        });

        dice.numbers = numbers;
        $scope.stack.push(dice);
        $scope.showWin();
    };
    $scope.$on('onDiceAdded', function(event, diceArray) {
        $scope.$apply(function() {
            diceArray.forEach(function(dice) {

                if (dice.confirmed) {
                    return false;
                }
                if ($scope.addresses.length) {
                    if ($scope.addresses.indexOf(dice.player_id) >= 0) {
                        $scope.pushQ(dice);
                    }
                } else {
                    $scope.pushQ(dice);
                }
            });
        });
    });

};

Application.Controllers.controller('DiceController', ['$scope', '$rootScope', '$window', 'MyAddresses', '$cookies', 'Sounds', 'CacheServer', DiceController]);
