/**
 * Created by mac on 3/20/14.
 */
var spriteFrameCache = cc.SpriteFrameCache.getInstance();

var MainPlay = cc.Layer.extend(
    {

    size:null,
    m_bgSprite:null,
    m_xOffset:null,
    result:[1,1,1],
    
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

            this.size = cc.Director.getInstance().getWinSize();
                               
            this.m_Dice = [cc.Sprite.create("res/dice5.png"),
                           cc.Sprite.create("res/dice5.png"),
                           cc.Sprite.create("res/dice5.png")];
                               
            this.m_xOffset = 100;
            this.m_Dice[0].setPosition(this.size.width/2-this.m_xOffset, this.size.height/2);
            this.m_Dice[1].setPosition(this.size.width/2, this.size.height/2);
            this.m_Dice[2].setPosition(this.size.width/2+this.m_xOffset, this.size.height/2);
            this.addChild(this.m_Dice[0],200);
            this.addChild(this.m_Dice[1],200);
            this.addChild(this.m_Dice[2],200);
            bRet = true;
            
        }
        return bRet;
    },

    onEnter:function() {

        this._super();
    },

    initRolling:function() {

        this.m_Dice_index = [
                    (0 | (Math.random() * 10000))%9,
                    (0 | (Math.random() * 10000))%9,
                    (0 | (Math.random() * 10000))%9];
                               
        //this._super();

        this.schedule(this.rollingDice1, 0.02);
        this.schedule(this.rollingDice2, 0.02);
        this.schedule(this.rollingDice3, 0.02);
        this.unschedule(this.initRolling);
    },

    rollingDice1:function() {
        this.m_Dice[0].removeFromParent();
        this.m_Dice_index[0] += 1;
        if (this.m_Dice_index[0]>9)
        this.m_Dice_index[0] = 1;
                               
        this.m_Dice[0] = cc.Sprite.create("res/dice"+this.m_Dice_index[0]+".png");
        this.m_Dice[0].setPosition(this.size.width/2-this.m_xOffset, this.size.height/2);
        this.addChild(this.m_Dice[0],200);

        
    },

    rollingDice2:function(dt) {

        this.m_Dice[1].removeFromParent();
        this.m_Dice_index[1] += 1;
        if (this.m_Dice_index[1]>9)
            this.m_Dice_index[1] = 1;

        this.m_Dice[1] = cc.Sprite.create("res/dice"+this.m_Dice_index[1]+".png");
        this.m_Dice[1].setPosition(this.size.width/2, this.size.height/2);
        this.addChild(this.m_Dice[1],200);
    },

    rollingDice3:function(dt) {

        this.m_Dice[2].removeFromParent();
        this.m_Dice_index[2] += 1;
        if (this.m_Dice_index[2]>9)
            this.m_Dice_index[2] = 1;

        this.m_Dice[2] = cc.Sprite.create("res/dice"+this.m_Dice_index[2]+".png");
        this.m_Dice[2].setPosition(this.size.width/2+this.m_xOffset, this.size.height/2);
        this.addChild(this.m_Dice[2],200);
    },

    stopDice:function() {
        this.unschedule(this.rollingDice1);
        this.unschedule(this.rollingDice2);
        this.unschedule(this.rollingDice3);
        this.m_Dice[0].removeFromParent();
        this.m_Dice[1].removeFromParent();
        this.m_Dice[2].removeFromParent();
                               
        this.m_Dice[0] = cc.Sprite.create("res/dice_num"+this.result[0]+".png");
        this.m_Dice[0].setPosition(this.size.width/2-this.m_xOffset, this.size.height/2);
                               
        this.m_Dice[1] = cc.Sprite.create("res/dice_num"+this.result[1]+".png");
        this.m_Dice[1].setPosition(this.size.width/2, this.size.height/2);
                               
        this.m_Dice[2] = cc.Sprite.create("res/dice_num"+this.result[2]+".png");
        this.m_Dice[2].setPosition(this.size.width/2+this.m_xOffset, this.size.height/2);
                               
        this.addChild(this.m_Dice[1],200);
        this.addChild(this.m_Dice[0],200);
        this.addChild(this.m_Dice[2],200);
        this.unschedule(this.stopDice);
    },
                               
    runDice:function(g_Dices){
        this.result = g_Dices;

        this.schedule(this.initRolling, 0);
        this.schedule(this.stopDice, 4);
    },

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
};
