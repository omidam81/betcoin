/**
 * Created by mac on 3/20/14.
 */
var spriteFrameCache = cc.SpriteFrameCache.getInstance();
//var resultSprite = ["res/result/r19.png",
//    "res/result/r39.png",
//    "res/result/r59.png",
//    "res/result/r79.png",
//    "res/result/r99.png"
//
//];
var MainPlay = cc.Layer.extend({
    isMouseDown:false,
    size:null,
    dice1:null,
    dice2:null,
    dice3:null,
    indexDice:[],
    animatetype:[1,1],//1: 1->0, 2: 0->1, 3: 1->1, 4: 0->0
    g_num:1,

    ctor:function () {
        this._super();
        this.init();
    },
    init:function () {
        //////////////////////////////
        // 1. super init first
        var bRet = false;
        if (this._super()) {
            // init space of chipmunk

            window.animationInitialized = "start";

            this.size = cc.Director.getInstance().getWinSize();
            spriteFrameCache.addSpriteFrames(g_flip1Plist);
            spriteFrameCache.addSpriteFrames(g_flip2Plist);
            spriteFrameCache.addSpriteFrames(g_flip3Plist);
            spriteFrameCache.addSpriteFrames(g_flip4Plist);
            this.dice1 = cc.Sprite.createWithSpriteFrame(spriteFrameCache.getSpriteFrame("004_0001.png"));
            this.dice2 = cc.Sprite.createWithSpriteFrame(spriteFrameCache.getSpriteFrame("004_0001.png"));
            this.dice3 = cc.Sprite.createWithSpriteFrame(spriteFrameCache.getSpriteFrame("004_0001.png"));
            this.addDice(this.dice1,1);

            this.setTouchEnabled(true);
            window.animationInitialized = "done";

            bRet = true;
                               
           //this.schedule(this.rollingDice1, 4.0);
        }
        return bRet;
    },


    addDice:function(sprite, index) {
        if(index == 1) {
            sprite.setPosition(this.size.width/2, this.size.height/2);
        }
        else if(index == 2) {
            sprite.setPosition(this.size.width/2-200, this.size.height/2);
        }
        else if(index == 3) {
            sprite.setPosition(this.size.width/2+200, this.size.height/2);
        }
        this.addChild(sprite, 2);
    },

    removeDice:function(sprite) {
        sprite.removeFromParent();
    },
                               
    compareArray:function(array1, array2) {
        if(array1.length === array2.length) {
            for(var i=0;i<array1.length;i++) {
                if(array1[i]!==array2[i]) {
                    return false;
                }
            }
        }
        else {
            return false;
        }
        return true;
    },

    runDice1:function(prevres, curres){
        var i=0;

        if(prevres[i] === curres[i]) {
            if(curres[i] === "0") {
                this.animatetype[i] = 4;
            }
            else {
                this.animatetype[i] = 3;
            }
        }
        else {
            if(prevres[i] === "0" && curres[i] === "1") {
                this.animatetype[i] = 2;
            }
            else if(prevres[i] === "1" && curres[i] === "0") {
                this.animatetype[i] = 1;
            }
        }
        
        this.schedule(this.rollingDice1, 0);
    },
    runDice2:function(prevres, curres){
        for(var i=0;i<2;i++) {
            if(prevres[i] === curres[i]) {
                if(curres[i] === "0") {
                    this.animatetype[i] = 4;
                }
                else {
                    this.animatetype[i] = 3;
                }
            }
            else {
                if(prevres[i] === "0" && curres[i] === "1") {
                    this.animatetype[i] = 2;
                }
                else if(prevres[i] === "1" && curres[i] === "0") {
                    this.animatetype[i] = 1;
                }
            }
        }
        this.schedule(this.rollingDice2, 0);
    },

    rollingDice:function(dt) {
        /*this.removeDice(this.dice1);
        this.addDice(this.dice1,1);

        this.initDice(this.dice1,1,9,0.02);
        this.unschedule(this.rollingDice);
        this.g_num = 1;*/
    },

    rollingDice1:function(dt) {
        this.removeDice(this.dice1);
        this.removeDice(this.dice2);
        this.removeDice(this.dice3);
        this.addDice(this.dice1,1);
        this.fastDice(this.dice1,this.animatetype[0],0.05);
        this.unschedule(this.rollingDice1);
    },
                               
    rollingDice2:function(dt) {
        this.removeDice(this.dice1);
        this.removeDice(this.dice2);
        this.removeDice(this.dice3);
        this.addDice(this.dice2,2);
        this.addDice(this.dice3,3);
        this.fastDice(this.dice2,this.animatetype[0],0.05);
        this.fastDice(this.dice3,this.animatetype[1],0.05);
        this.unschedule(this.rollingDice2);
    },

    fastDice:function(sprite,index, ft) {
        var animFrames = [];
        var str = "";
        for(var j = 1; j <= 9; j ++) {
            str = "00"+index+"_000" + j + ".png";
            var frame = spriteFrameCache.getSpriteFrame(str);
            animFrames.push(frame);
        }
        for(var k = 10; k <= 99; k++){
            str = "00"+index+"_00" + k + ".png";
            var frame = spriteFrameCache.getSpriteFrame(str);
            animFrames.push(frame);
        }
        for(var l = 100; l <= 110; l++){
           str = "00"+index+"_0" + l + ".png";
           var frame = spriteFrameCache.getSpriteFrame(str);
           animFrames.push(frame);
        }
        var animation = cc.Animation.create(animFrames, ft);
        sprite.runAction(cc.Repeat.create(cc.Animate.create(animation),1));
    },

    initDice:function(coins) {
        this.removeDice(this.dice1);
        this.removeDice(this.dice2);
        this.removeDice(this.dice3);
        /*this.dice1 = cc.Sprite.createWithSpriteFrame(spriteFrameCache.getSpriteFrame("004_0001.png"));
        this.dice2 = cc.Sprite.createWithSpriteFrame(spriteFrameCache.getSpriteFrame("004_0001.png"));
        this.dice3 = cc.Sprite.createWithSpriteFrame(spriteFrameCache.getSpriteFrame("004_0001.png"));*/
        if(coins === 1){
            this.addDice(this.dice1,1);
        } else if(coins === 2){
            this.addDice(this.dice2,2);
            this.addDice(this.dice3,3);
        }
        /*var animFrames = [];
        var str = "";
        for(var j = first; j <= last; j ++){
            str = "sc_001_000" + j + ".png";
            var frame = spriteFrameCache.getSpriteFrame(str);
            animFrames.push(frame);
        }

        var animation = cc.Animation.create(animFrames, ft);
        sprite.runAction(cc.RepeatForever.create(cc.Animate.create(animation)));*/
    },

    onEnter:function() {
        this._super();
    },

    onExit:function() {
        this._super();
    },

    onTouchesBegan:function (touches, event) {
        this.isMouseDown = true;
    },

    onTouchesMoved:function (touches, event) {
        if (this.isMouseDown) {
            if (touches) {
            }
        }
    },
    onTouchesEnded:function (touches, event) {
        this.isMouseDown = false;
    },
    onTouchesCancelled:function (touches, event) {
        console.log("onTouchesCancelled");
    }
});

MainPlay.create = function () {
    var sg = new MainPlay();
    if (sg) {
        return sg;
    }
    return null;
};

var g_MainPlay = null;
MainPlay.ShareInstance = function() {
        if (!g_MainPlay)
        {
            g_MainPlay = MainPlay.create();
        }
        return g_MainPlay;

    return g_MainPlay;
};

MainPlay.deleteInstance = function() {
    g_MainPlay = null;
};

var g_MainPlayScene = null;
MainPlay.scene = function(){
        if(!g_MainPlayScene) {
            g_MainPlayScene= cc.Scene.create();
            g_MainPlayScene.addChild(MainPlay.ShareInstance());
        }
        return g_MainPlayScene;

    return g_MainPlayScene;
};
