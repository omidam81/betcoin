function MainPlay(kcConfig) {
    this.config = kcConfig;
    this.running = true;
    this.result = 0;


}
MainPlay.prototype.init = function() {
    var self = this;
    var stage = new Kinetic.Stage(this.config);
    self.layer = new Kinetic.Layer();
    window.animationInitialized = "start";

    var imagesToLoad = [
        {name:'outer', url: 'res/outer.png'},
        {name: 'inner', url: 'res/inner.png'},
        {name: 'ball', url: 'res/b1.png'},
        {name: 'ball3', url: 'res/ball.png'}
    ];
    self.imageObjs = {};
    var loadedImages = 0;
    self.offsetX = -2;
    self.offsetY = -9;

    for (var i = 0; i < imagesToLoad.length; i++) {
        var image = new Image();
        image.onload = function() {
            loadedImages++;
            var imageInfo = imagesToLoad[this.imgIndex];

            var imageObj = new Kinetic.Image({
                x: (imageInfo.name !== 'outer')? self.config.width / 2 + self.offsetX: self.config.width / 2,
                y: (imageInfo.name !== 'outer')? self.config.height / 2 + self.offsetY: self.config.height / 2,
                image: this,
                width: this.width,
                height: this.height,
                offset: {
                    x: this.width / 2,
                    y: this.height / 2
                }
            });
            self.imageObjs[imageInfo.name] = imageObj;
            self.layer.add(imageObj);
            stage.add(self.layer);

            if (loadedImages === imagesToLoad.length) {
                self.imageObjs['inner'].setZIndex(1);
                self.imageObjs['outer'].setZIndex(2);
                self.layer.draw();
                self.running = false;
                window.animationInitialized = "done";

                var numbers = [
                    26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14, 20, 1, 33, 16, 24, 5, 10, 23, 8, 30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32, 0
                ];
                self.angles = {};
                for(var i=0;i<numbers.length;i++) {
                    self.angles[numbers[i]] = (1+i)*(360/37)%360;//When 0, angle is 360, so stopchance doesn't catch.
                }
            }
        };
        image.imgIndex = i;
        image.src = imagesToLoad[i].url;
    }

    self.animation = new Kinetic.Animation(function(frame) {
        var stopchance = Math.abs(self.boardAlpha % 360 - self.angles[self.result] - (90 - self.ballAngle % 360));
        if(self.showResult || (self.boardAlpha > 320 && stopchance < 4)) {
            self.ballAngle = 90 - (360 - self.angles[self.result] + self.boardAlpha + self.boardSpeed);

            if(!self.showResult)
            {
                self.wiffle = true;
                self.imageObjs['ball'].setZIndex(0);
                self.imageObjs['ball3'].setZIndex(3);
                var x = self.imageObjs['ball3'].getX();
                var y = self.imageObjs['ball3'].getY();

                var tween = new Kinetic.Tween({
                    node:self.imageObjs['ball3'],
                    duration: 0.2,
                    x: x + 5,
                    y: y,
                    onFinish: function() {
                        var tween1 = new Kinetic.Tween({
                            node: self.imageObjs['ball3'],
                            duration: 0.2,
                            x: x - 5,
                            y: y,
                            onFinish: function() {
                                var tween2 = new Kinetic.Tween({
                                    node: self.imageObjs['ball3'],
                                    duration: 0.2,
                                    x: x,
                                    y: y + 5,
                                    onFinish: function() {
                                        var tween3 = new Kinetic.Tween({
                                            node: self.imageObjs['ball3'],
                                            duration: 0.2,
                                            x: x,
                                            y: y - 5,
                                            onFinish: function() {
                                                var tween4 = new Kinetic.Tween({
                                                    node: self.imageObjs['ball3'],
                                                    duration: 1,
                                                    x: x,
                                                    y: y
                                                });
                                                tween4.play();
                                            }
                                        });
                                        tween3.play();
                                    }
                                });
                                tween2.play();
                            }
                        });
                        tween1.play();
                    }
                });
                tween.play();
            }
            self.showResult = true;
        }
        else if (self.boardAlpha > 290 && stopchance < 60) {
            self.ballRadius -= 2;
            self.ballAngle += 2;
        } else if (self.boardAlpha > 290) {
            self.ballRadius -= 0.35;
            self.ballAngle += 4;

        } else {
            self.ballAngle += 6;
        }

        self.boardAlpha += self.boardSpeed;
        self.imageObjs['inner'].rotate(self.boardSpeed);

        if (self.imageObjs['ball'].getZIndex() !== 0) {
            self.imageObjs['ball'].setPosition({
                x: self.config.width / 2 + self.offsetX + self.ballRadius * Math.cos(self.ballAngle / 180 * Math.PI),
                y: self.config.height / 2 + self.offsetY - self.ballRadius * Math.sin(self.ballAngle / 180 * Math.PI)
            });
        }

        if (self.imageObjs['ball3'].getZIndex() !== 0) {
            self.imageObjs['ball3'].setRotation(90 - self.ballAngle);
        }
    }, self.layer);
}
MainPlay.prototype.runWheel = function(g_number) {
    var self = this;
    if (self.running) {
        return;
    }
    self.running = true;
    self.result = g_number;

    self.showResult = false;
    self.boardAlpha = 0;

    self.ballAngle = 90;
    self.boardSpeed = self.config.initSpeed || 1.5;
    self.ballRadius = self.config.initBallRadius || 200;
    self.imageObjs['inner'].setRotation(0);
    self.imageObjs['ball3'].setZIndex(0);
    self.imageObjs['ball'].setZIndex(4);

    self.animation.start();

    setTimeout(function() {
        self.animation.stop();
        self.running = false;
    }, self.config.spinTime);
};
var g_MainPlay = new MainPlay(document.kcConfig);
g_MainPlay.init();