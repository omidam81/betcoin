'use strict';

/* global BaseGameController, g_MainPlay */
var aryRan = new Array(136);
var aryReady_East = new Array(13);
var aryEast = new Array(14);
var disImage_Temp = [];
var tileNum = 13;
var disImage_Init = [200,200,200,200,200,200,200,200,200,200,200,200,200,200,
    200,200,200,200,200,200,200,200,200,200,200,200,200,200,
    200,200,200,200,200,200,200,200,200,200,200,200,200,200,
    200,200,200,200,200,200,200,200,200,200,200,200,200,200,
    200,200,200,200,200,200,200,200,200,200,200,200,200,200,
    200,200,200,200,200,200,200,200,200,200,200,200,200,200];
//var disImage = new Array(90);

var shuffle = function(o) { //v1.0
    var e = new Array(136);
    for(var i = 0; i <= 136; i++){

        var ranI = o.length;
        var ranAry = Math.floor(Math.random()*ranI);
        e[i] = ranAry;
        o.slice(ranAry,1);
    }
    return e;
};
var generate_img_name = function(b){
    var aryResult = new Array(14);
    for (var i = 0; i < b.length; i++) {
        var ind = Math.floor((b[i] / 4));
//        if (ind < 27 && ind % 9 === 4 && b[i] % 4 === 3){
//            aryResult[i] = (ind) + "_red.png";
//        }
//        else{
            aryResult[i] = ind + ".png";
//        }
    }
    return aryResult;
};
//
//var generate_dis_name = function(h){
//    var dis = Math.floor(h / 4);
//    var disResult = dis + ".png";
//
//    return disResult;
//};

var show = function(c, $scope){
//    c.sort(function(a, b){return (a-b);});
    $scope.nameImage = new Array(14);
//    var eastID = new Array(13);
    var aryTemp = new Array(14);
    aryTemp = generate_img_name(c);
    for (var k = 0; k < $scope.nameImage.length; k++){
          $scope.nameImage[k] = "./res/" + aryTemp[k];
    }
};

//a:ready, b:east
var showReady = function(a,b){
    a.sort(function(a, b){return (a-b);});
    for(var i = 0; i < 13; i++){
        b[i] = a[i];
    }
    b[13] = aryRan[tileNum];
};

//var disShow = function(i,$scope){
//    var disTemp = "./res/" + i;
//    $scope.disImage = disTemp;
//};

var discardTile = function(g,$scope){
    var temp = Math.floor(g / 4);
    var aryDisTemp = new Array(83);
    if(disImage_Temp.length === 0){
        disImage_Temp[0] = temp;
    }else{
        disImage_Temp.push(temp);

    }
    for(var i = 0; i < disImage_Temp.length; i++){
        aryDisTemp[i] = disImage_Temp[i];
    }
    for(var j = disImage_Temp.length; j < 83; j++){
        aryDisTemp[j] = 200;
    }
    $scope.disImage = aryDisTemp;
    console.log(g);
    console.log(temp);
    console.log(disImage_Temp);
    console.log($scope.disImage);

};



var GameController = function($rootScope, $scope, $filter, LowLagSounds, $cookies, $location, BCPlayer, VisibilityFactory, Game) {
//    var gameController = this;
    this.gameName = 'mahjong';
    this.Game = Game;

    GameController.super_.apply(this, arguments);

    //begin mahjong
    var aryStand = new Array(136);
    for (var i = 0; i < 136; i++){
        aryStand[i] = i;
    }
    //random array
    aryRan = shuffle(aryStand);

    //east 13array
    for(var j = 0; j < 13; j++){
        aryReady_East[j] = aryRan[j];
    }

    //sort and display east 13array
//    aryReady_East.sort(function(a, b){return (a-b);});
    showReady(aryReady_East, aryEast);
    show(aryEast, $scope);
    $scope.disImage = disImage_Init;

    //click east 13array
//    $scope.select = function(id){
//        var id_INT = parseInt(id);
//        var selectImage = document.getElementById(id_INT);
//        imageEffect = !imageEffect;
//        if(imageEffect){
//            selectImage.style.opacity = 0.7;
//        }else{
//            selectImage.style.opacity = 1;
//        }
//    };

    //double click 13array
    $scope.remove = function(id){
        var temp = new Array(13);
        var to_delete = parseInt(id);
        for (var i = 0; i < aryEast.length; i++){
            if (aryEast[i] !== aryEast[to_delete]){
                temp[i] = aryEast[i];
            }else{
                temp[i] = aryEast[13];
                aryEast[13] = aryRan[136-tileNum];
                tileNum++;
            }
        }
        aryReady_East = temp;
        showReady(aryReady_East, aryEast);
        show(aryEast,$scope);
        discardTile(to_delete, $scope);
    };


//    $scope.recentnumbers = [];
//    $scope.timer = 3000;
//
//    window.animationInitialized = false;
//
//    gameController.getNewGameParams = function() {
//        var params = GameController.super_.prototype.getNewGameParams.call(this);
//        params.game = $scope.gameData.game;
//        var wager_each = this.getWager();
//        var bets = {};
//        for(var i in $scope.bets) {
//            if($scope.bets.hasOwnProperty(i)) {
//                // console.log(i,$scope.bets[i],wager_each);
//                bets[i] = wager_each*$scope.bets[i];
//            }
//        }
//        params.bets = JSON.stringify(bets);
//        return params;
//    };
//
//    gameController.isExceedMaxWager = function() {
//        if ($scope.totalbet !== 0 && $scope.totalbet > $scope.player.balance.btc) {
//            $scope.maxBetErr = true;
//            return true;
//        }
//        return false;
//    };
//
//    gameController.newGame_OnSuccess = function(response) {
//        GameController.super_.prototype.newGame_OnSuccess.call(this, response);
//
//        $scope.clearWins();
//        $scope.playSound('spinSound');
//        $scope.animateWheel(response);
//    };
//
//    gameController.playWinSounds = function(multiplier) {
//        if (multiplier >= 2 && multiplier < 3) {
//            $scope.playSound('winSound');
//        } else if (multiplier >= 3 && multiplier <= 15) {
//            $scope.playSound('bigWinSound');
//        } else if (multiplier > 15) {
//            $scope.playSound('hugeWinSound');
//        }
//    };
//
//
//    $scope.$watch('btcWager', function() {
//        if(!$scope.player) { return; }
//        if($scope.getTotalBet() > $scope.player.balance.btc) {
//            var numtokens = 0;
//            for(var i in $scope.bets) {
//                if($scope.bets.hasOwnProperty(i)) {
//                    numtokens += $scope.bets[i];
//                }
//            }
//            var newvalue = Math.floor($scope.player.balance.btc / numtokens);
//            $scope.btcWager = newvalue;
//        }
//    });

//    $scope.initAnimation = function(){
//        var d = document;
//        var c = {
//            COCOS2D_DEBUG : 2,
//        box2d: false,
//        chipmunk:false,
//        showFPS:true,
//        frameRate:60,
//        loadExtension:true,
//        renderMode:1,
//        tag:'gameCanvas',
//        SingleEngineFile:'src/Cocos2d-html5-v2.2.3.min.js',
//        appFiles:[
//                  'src/MainPlay.js',
//                  'src/GameData.js'
//                  ]
//        };
//
//        if(!d.createElement('canvas').getContext){
//            var divel = d.createElement('div');
//            divel.innerHTML = '<h2>Your browser does not support HTML5 canvas!</h2>' +
//            '<p>Google Chrome is a browser that combines a minimal design with sophisticated technology to make the web faster, safer, and easier.Click the logo to download.</p>' +
//            '<a href="http://www.google.com/chrome" target="_blank"><img src="http://www.google.com/intl/zh-CN/chrome/assets/common/images/chrome_logo_2x.png" border="0"/></a>';
//            var p = d.getElementById(c.tag).parentNode;
//            p.style.background = 'none';
//            p.style.border = 'none';
//            p.insertBefore(divel);
//
//            d.body.style.background = '#ffffff';
//            return;
//        }
//
//        //first load engine file if specified
//        var s = d.createElement('script');
//        /*********Delete this section if you have packed all files into one*******/
//        if (c.SingleEngineFile && !c.engineDir) {
//            s.src = c.SingleEngineFile;
//        }
//        else if (c.engineDir && !c.SingleEngineFile) {
//            s.src = c.engineDir + 'jsloader.js';
//        }
//        else {
//            window.alert('You must specify either the single engine file OR the engine directory in "cocos2d.js"');
//        }
//
//        document.ccConfig = c;
//        s.id = 'cocos2d-html5';
//        d.body.appendChild(s);
//    };


//    $scope.animateWinCount = 0;
//
//    $scope.longPressTimeout = setTimeout(function() {
//                                         // nothing
//                                         }, 1);
//    $scope.clearOneBet = function(element) {
//        //scope.$apply(function() {
//        var chips = element.childNodes[0];
//        chips.style.display="none";
//        chips.innerHTML = "";
//        delete($scope.bets[element.getAttr('bet')]);
//        $scope.calculateTotalBet();
//        //});
//    };
//    $scope.betmap = {
//        "[0]":36,
//        "[1]":36,
//        "[2]":36,
//        "[3]":36,
//        "[4]":36,
//        "[5]":36,
//        "[6]":36,
//        "[7]":36,
//        "[8]":36,
//        "[9]":36,
//        "[10]":36,
//        "[11]":36,
//        "[12]":36,
//        "[13]":36,
//        "[14]":36,
//        "[15]":36,
//        "[16]":36,
//        "[17]":36,
//        "[18]":36,
//        "[19]":36,
//        "[20]":36,
//        "[21]":36,
//        "[22]":36,
//        "[23]":36,
//        "[24]":36,
//        "[25]":36,
//        "[26]":36,
//        "[27]":36,
//        "[28]":36,
//        "[29]":36,
//        "[30]":36,
//        "[31]":36,
//        "[32]":36,
//        "[33]":36,
//        "[34]":36,
//        "[35]":36,
//        "[36]":36,
//        "[0,1]":18,
//        "[0,2]":18,
//        "[0,3]":18,
//        "[1,2]":18,
//        "[2,3]":18,
//        "[4,5]":18,
//        "[5,6]":18,
//        "[7,8]":18,
//        "[8,9]":18,
//        "[10,11]":18,
//        "[11,12]":18,
//        "[13,14]":18,
//        "[14,15]":18,
//        "[16,17]":18,
//        "[17,18]":18,
//        "[19,20]":18,
//        "[20,21]":18,
//        "[22,23]":18,
//        "[23,24]":18,
//        "[25,26]":18,
//        "[26,27]":18,
//        "[28,29]":18,
//        "[29,30]":18,
//        "[31,32]":18,
//        "[32,33]":18,
//        "[34,35]":18,
//        "[35,36]":18,
//        "[1,4]":18,
//        "[2,5]":18,
//        "[3,6]":18,
//        "[4,7]":18,
//        "[5,8]":18,
//        "[6,9]":18,
//        "[7,10]":18,
//        "[8,11]":18,
//        "[9,12]":18,
//        "[10,13]":18,
//        "[11,14]":18,
//        "[12,15]":18,
//        "[13,16]":18,
//        "[14,17]":18,
//        "[15,18]":18,
//        "[16,19]":18,
//        "[17,20]":18,
//        "[18,21]":18,
//        "[19,22]":18,
//        "[20,23]":18,
//        "[21,24]":18,
//        "[22,25]":18,
//        "[23,26]":18,
//        "[24,27]":18,
//        "[25,28]":18,
//        "[26,29]":18,
//        "[27,30]":18,
//        "[28,31]":18,
//        "[29,32]":18,
//        "[30,33]":18,
//        "[31,34]":18,
//        "[32,35]":18,
//        "[33,36]":18,
//        "[0,1,2]":12,
//        "[0,2,3]":12,
//        "[1,2,3]":12,
//        "[4,5,6]":12,
//        "[7,8,9]":12,
//        "[10,11,12]":12,
//        "[13,14,15]":12,
//        "[16,17,18]":12,
//        "[19,20,21]":12,
//        "[22,23,24]":12,
//        "[25,26,27]":12,
//        "[28,29,30]":12,
//        "[31,32,33]":12,
//        "[34,35,36]":12,
//        "[1,2,4,5]":9,
//        "[2,3,5,6]":9,
//        "[4,5,7,8]":9,
//        "[5,6,8,9]":9,
//        "[7,8,10,11]":9,
//        "[8,9,11,12]":9,
//        "[10,11,13,14]":9,
//        "[11,12,14,15]":9,
//        "[13,14,16,17]":9,
//        "[14,15,17,18]":9,
//        "[16,17,19,20]":9,
//        "[17,18,20,21]":9,
//        "[19,20,22,23]":9,
//        "[20,21,23,24]":9,
//        "[22,23,25,26]":9,
//        "[23,24,26,27]":9,
//        "[25,26,28,29]":9,
//        "[26,27,29,30]":9,
//        "[28,29,31,32]":9,
//        "[29,30,32,33]":9,
//        "[31,32,34,35]":9,
//        "[32,33,35,36]":9,
//        "[0,1,2,3]":9,
//        "[1,2,3,4,5,6]":6,
//        "[4,5,6,7,8,9]":6,
//        "[7,8,9,10,11,12]":6,
//        "[10,11,12,13,14,15]":6,
//        "[13,14,15,16,17,18]":6,
//        "[16,17,18,19,20,21]":6,
//        "[19,20,21,22,23,24]":6,
//        "[22,23,24,25,26,27]":6,
//        "[25,26,27,28,29,30]":6,
//        "[28,29,30,31,32,33]":6,
//        "[31,32,33,34,35,36]":6,
//        "[1,4,7,10,13,16,19,22,25,28,31,34]":3,
//        "[2,5,8,11,14,17,20,23,26,29,32,35]":3,
//        "[3,6,9,12,15,18,21,24,27,30,33,36]":3,
//        "[1,2,3,4,5,6,7,8,9,10,11,12]":3,
//        "[13,14,15,16,17,18,19,20,21,22,23,24]":3,
//        "[25,26,27,28,29,30,31,32,33,34,35,36]":3,
//        "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]":2,
//        "[2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36]":2,
//        "[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]":2,
//        "[2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]":2,
//        "[1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35]":2,
//        "[19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36]":2
//    };
//    $scope.bets = {};
//
//    $scope.play = function() {
//        gameController.startGame();
//    };
//
//    BCPlayer.$on("user update", function() {
//        if(!window.animationInitialized){$scope.initAnimation();}
//    });
//
//    $scope.getColor = function(result) {
//        var red = JSON.parse("[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]");
//        var black = JSON.parse("[2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]");
//        if(result === 0) {
//            return "green";
//        }
//        for(var r in red) {
//            if(red[r] === result) {
//                return "red";
//            }
//        }
//        for(var b in black) {
//            if(black[b] === result) {
//                return "black";
//            }
//        }
//    };
//    $scope.$watch('btcWager', function() {
//                  $scope.calculateTotalBet();
//                  });
//
//    $scope.getTotalBet = function() {
//        var totalbet = 0;
//        for(var i in $scope.bets) {
//            if($scope.bets.hasOwnProperty(i)) {
//                totalbet += $scope.btcWager * $scope.bets[i];
//            }
//        }
//        return totalbet;
//    };
//    $scope.calculateTotalBet = function() {
//
//        $scope.totalbet = $scope.getTotalBet();
//    };
//    $scope.clearWins = function() {
//        var elem = document.querySelectorAll( '.chips' );
//        for(var x=0;x< elem.length;x++) {
//            elem[x].classList.remove("won"); //chips element
//            elem[x].classList.remove("lost"); //chips element
//        }
//        var numberels = document.querySelectorAll( '[id^="num-"]' );
//        for(var n=0;n< numberels.length;n++) {
//            numberels[n].classList.remove("winner"); //chips element
//        }
//    };
//    $scope.clearBets = function() {
//        if(gameController.isGameInProgress()) { return false; }
//        $scope.bets = {};
//        $scope.calculateTotalBet();
//        var elem = document.querySelectorAll( '.chips' );
//        for(var x=0;x< elem.length;x++) {
//            elem[x].style.display="none"; //chips element
//        }
//    };
//    $scope.gameCompleted = function() {
//        gameController.finishGame(true);
//
//        while($scope.recentnumbers.length > 50) {
//            $scope.recentnumbers.pop();
//        }
//        $scope.recentnumbers.unshift({color:$scope.getColor($scope.lastResult.result),number:$scope.lastResult.result});
//
//    };
//
//    $scope.showWins = function() {
//        document.getElementById('num-'+$scope.lastResult.result).classList.add("winner");
//
//        var elem = document.querySelectorAll( '[id^="bet-"]' );
//        for(var x=0;x< elem.length;x++) {
//            var numbers = elem[x].getAttribute("data-bet");
//            numbers = JSON.parse(numbers.toString());
//
//            var won = false;
//            var chipel = elem[x].childNodes[0];
//            for(var i=0;i<numbers.length;i++) {
//                if($scope.lastResult.result === numbers[i] && chipel.style.display === "block") {
//                    won = true;
//                    showMultiplier(numbers, chipel);
//                    chipel.classList.add("won"); //chips element
//                    break;
//                }
//            }
//            if(!won && chipel.style.display === "block") {
//                chipel.classList.add("lost"); //chips element
//            }
//        }
//    };
//    var showMultiplier = function(bet, chipel){
//        var multiplier = $scope.betmap[JSON.stringify(bet)];
//        var betAmount = chipel.innerHTML;
//        chipel.innerHTML = multiplier + document.getElementById('localization-x').innerHTML;
//        setTimeout(function(){
//            chipel.innerHTML = betAmount;
//        }, 5000);
//    };
//    $scope.animateWinNumber = function() {
//        $scope.animateWinCount++;
//        var animateWinCount = 2;
//        var elname = "#num-"+$scope.lastResult.result;
//        $(elname).animate({
//                          opacity: 0.1,
//                          }, 400, function() {
//                          $(elname).animate({
//                                            opacity: 1,
//                                            }, 400, function() {
//                                            if ($scope.animateWinCount > animateWinCount) {
//                                            $scope.animateWinCount = 0;
//                                            } else {
//                                            $scope.animateWinNumber();
//                                            }
//                                            });
//                          });
//    };

    $scope.animateWheel = function(res) {

        setTimeout(function() {
           $scope.$apply(function() {
                         $scope.gameCompleted();
                         $scope.showWins();
                         // $scope.animateWinNumber();
                         $(".mahjongCanvasContainer").animate({opacity:"0"},400, function() {

                            $(".mahjongCanvasContainer").css({zIndex:"-2"});
                        });
                         $("#wheel_placeholder").animate({opacity:"1",top:"0px",left:"0px",width:"150px",height:"150px"},400);

            });
           },$scope.gameTime);
        $("#wheel_placeholder").animate({opacity:"0",left:"-200px",top:"-100px",width:"300",height:"300"},600);
        $(".mahjongCanvasContainer").css({zIndex:"2"},400);
        $(".mahjongCanvasContainer").animate({opacity:"1"},400);


        g_MainPlay.runWheel(parseInt(res.result,10));
    };
};

angular.inherits(GameController, BaseGameController);
Application.Controllers.controller('GameController', ['$rootScope', '$scope', '$filter', 'LowLagSounds', '$cookies', '$location', 'BCPlayer', 'VisibilityFactory', 'Game', GameController]);
