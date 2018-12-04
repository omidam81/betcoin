/**
 * Created by mac on 3/20/14.
 */
var spriteFrameCache = cc.SpriteFrameCache.getInstance();

var MainPlay = cc.Layer.extend(
    {
    isMouseDown:false,
    size:null,
    showresult:false,

    indexWheel:0,
                               //Consts for spinning
                               totalnum:37,
                               speed_down_diff:0.05,
                               turn_min_num:3,
                               turn_max_num:6,
                               init_speed:1.5,
                               init_ballradius:200,

                               wiffletime:0,

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

            this.inner = cc.Sprite.create("res/inner.png");
            this.outer = cc.Sprite.create("res/outer.png");

            this.ball = cc.Sprite.create("res/b1.png");
            //this.ball2 = cc.Sprite.create("res/ball2.png");
            this.ball3 = cc.Sprite.create("res/ball.png");

            this.outer.setPosition(new cc.Point(this.size.width/2, this.size.height/2));
            this.inner.setPosition(new cc.Point(this.size.width/2-2, this.size.height/2+8));
            this.ball.setPosition(new cc.Point(this.size.width/2-2, this.size.height/2+8));
            //this.ball2.setPosition(new cc.Point(this.size.width/2-2, this.size.height/2+8));
            this.ball3.setPosition(new cc.Point(this.size.width/2-2, this.size.height/2+8));

            this.addChild(this.outer,1);
            this.addChild(this.inner,2);
            this.addChild(this.ball,3);


             this.boardalpha = 0;
             this.turnnum = 0;
             this.boardspeed = this.init_speed;
             this.spinstate = false;
             this.ballradius = this.init_ballradius;
             var numbers = [
               26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24, 5, 10, 23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32, 0
             ];
             this.angles = {};
             for(var i=0;i<numbers.length;i++) {
                this.angles[numbers[i]] = (1+i)*(360/37)%360;//When 0, angle is 360, so stopchance doesn't catch.
             }

            bRet = true;
            this.schedule(this.rollingWheel,0.025);

            window.animationInitialized = "done";

        }
        return bRet;
    },

    rollingWheel:function(){

      var stopchance = Math.abs(this.boardalpha%360-this.angles[this.resultnum]-(90-this.ballangle%360));
      if(this.showresult || (this.boardalpha > 320 && stopchance < 4)) {
        this.showresult = true;

        this.ballangle = 90-(360-this.angles[this.resultnum]+this.boardalpha+this.boardspeed);

        if(this.spinstate)
        {
            this.removeChild(this.ball);
            this.addChild(this.ball3,3);

            var wiggleAn = cc.Sequence.create(
                    cc.MoveBy.create(0.2, cc.p(5, 0)),
                    cc.MoveBy.create(0.2, cc.p(-5, 0)),
                    cc.MoveBy.create(0.2, cc.p(0, 5)),
                    cc.MoveBy.create(0.2, cc.p(0, -5))
                );

            this.ball3.runAction(wiggleAn);

            this.spinstate = false;
        }
        if(this.spinstate == false)
        {
            this.wiffletime += 0.025;
        }
        if(this.wiffletime > 0.6)
        {
            this.ball3.setPosition(new cc.Point(this.size.width/2-2, this.size.height/2+8));
        }
      }
      else if (this.boardalpha > 290 && stopchance < 60) {
        this.ballradius -= 2;
        this.ballangle += 3;
      } else if (this.boardalpha > 240) {
        this.ballradius -= 0.35;
        this.ballangle += 6;

      } else {
        this.ballangle += 8;
      }

      this.boardalpha += this.boardspeed;
      this.inner.setRotation(this.boardalpha);

      this.ball.setPosition(
                          this.size.width/2-2+ this.ballradius * Math.cos((this.ballangle)/180*Math.PI),
                          this.size.height/2+8+ this.ballradius * Math.sin((this.ballangle)/180*Math.PI));
      //this.ball2.setRotation(this.ballangle);
      this.ball3.setRotation(90-this.ballangle);

    },


    runWheel:function(num){
      this.removeChild(this.ball3);
      this.removeChild(this.ball2);
      this.removeChild(this.ball);
      this.addChild(this.ball,3);
      this.showresult = false;
      this.boardalpha = 0;

      this.turnnum = 2;
      this.resultnum = num;

      while(this.boardalpha % 360) {
      // wait
      }

      this.ballangle = 90;
      this.ballradius = this.init_ballradius;

      this.totalturnalpha = this.boardalpha + this.turnnum*360;
      this.wiffletime = 0;
      this.spinstate = true;

      // console.log(this.angles[this.resultnum]);
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
