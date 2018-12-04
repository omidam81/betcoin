function MainPlay(kcConfig) {
    this.config = kcConfig;
    this.blobs = [];
    this.running = true;
    this.getDiceSprite = function(i, front) {
        if (front === undefined) {
            front = false;
        }
        if (front) {
            return [
                (i - 1) * 61,
                82,
                61,
                73
            ];
        }

        return [
            i * 69, //x
            0, //y
            69, //width
            81 //height
        ];
    };
}
MainPlay.prototype.init = function() {
    var self = this;
    var stage = new Kinetic.Stage(this.config);
    var layer = new Kinetic.Layer();
    window.animationInitialized = "start";

    var imageObj = new Image();
    imageObj.onload = function() {
        var dice5 = self.getDiceSprite(5, true);
        for(var i = 0; i < self.config.diceCount; i++) {
            var blob = new Kinetic.Sprite({
                x: 0 + i * 80,
                y: 0,
                image: imageObj,
                animation: 'idle',
                animations: {
                    idle: dice5
                },
                frameRate: 20,
                frameIndex: 0
            });

            blob.on('frameIndexChange', function(evt) {
                if (this.animation() === 'idle' && this.frameIndex() === 0) {
                    this.stop();
                }
                if (this.animation() === 'result' && this.frameIndex() === 0) {
                    this.stop();
                }
            });

            self.blobs.push(blob);
            layer.add(blob);
        }
        stage.add(layer);
        self.running = false;
        window.animationInitialized = "done";
    };
    imageObj.src = 'res/dice_sprite.png';
}
MainPlay.prototype.runDice = function(g_Dices) {
    var self = this;
    if (self.running) {
        return;
    }
    self.running = true;

    var result = [];
    var spin = [];

    var m_Dice_index = 0 | (Math.random() * 10000) %9;
    for(var i = 0; i < this.config.diceCount; i++) {
        spin[i] = [];
        result[i] = [];
        for(var j = 0; j < 9; j++) {
            var dice = this.getDiceSprite((m_Dice_index + j) % 9);
            spin[i].push(dice[0]);
            spin[i].push(dice[1]);
            spin[i].push(dice[2]);
            spin[i].push(dice[3]);
        }
        dice = this.getDiceSprite(g_Dices[i], true);
        result[i].push(dice[0]);
        result[i].push(dice[1]);
        result[i].push(dice[2]);
        result[i].push(dice[3]);
        m_Dice_index += 3;
    }

    for(var i = 0; i < this.blobs.length; i++) {
        var animations = this.blobs[i].animations();
        animations.result = result[i].slice();
        animations.spin = spin[i].slice();
        this.blobs[i].animations(animations);
        this.blobs[i].animation('spin');
        this.blobs[i].start();
    }

    setTimeout(function() {
        for(var k = 0; k < self.blobs.length; k++) {
            self.blobs[k].animation('result');
            self.blobs[k].start();
            self.running = false;
        }
    }, self.config.spinTime);
};
var g_MainPlay = new MainPlay(document.kcConfig);
g_MainPlay.init();