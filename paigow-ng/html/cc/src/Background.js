/*global cc,res*/'use strict';
var background = cc.Layer.extend({
    init:function () {
        var bRet = true;
        if (this._super()) {
            var bgimage = cc.Sprite.create(res.backGround_png);
            bgimage.setAnchorPoint(0,0);
            this.addChild(bgimage, 0, 1);
        }

        return bRet;
    },
});

//background image create
background.create = function () {
    var backgroundImage = new background();

 	if (backgroundImage && backgroundImage.init()) {
       		return backgroundImage;
	}
    return null;
};



