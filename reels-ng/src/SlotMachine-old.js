/* ========== SlotMath ================================================================================= */

function SlotMath(){}
SlotMath.roundUp = function(number, multiple){
	if(multiple == 0){
		return number;
	}

	var remainder = number % multiple;
	if(remainder == 0){
		return number;
	}
	return number + multiple - remainder;
}
SlotMath.roundDown = function(number, multiple){
	return SlotMath.roundUp(number, multiple) - 1;
}
SlotMath.periodicAddition = function(a, b, period, startsAtZero){
	if(typeof startsAtZero == "undefined") startsAtZero = false;
	var s = a+b;
	while(s > period || (startsAtZero && s >= period)){
		s -= period;
	}
	return s;
}
SlotMath.periodicSubtraction = function(a, b, period){
	var s = a-b;
	while(s < 0){
		s += period;
	}
	return s;
}
SlotMath.existsDivisorBetween = function(n, a, b){
	var a = parseInt(a);
	var b = parseInt(b);
	var x = Math.min(a, b);
	var y = Math.max(a, b);
	for(var i=x; i<=y; i++){
		if(i%n == 0) return i;
	}
	return false;
}

/* ========== Exceptions =============================================================================== */

function IllegalArgumentException(message) {
	this.message = message;
	console.log(message);
}

/* ========== SlotMachine ============================================================================== */

function SlotMachine(settings) {
	var mandatorySettings = ['can', 'ctx', 'width', 'height', 'betinfoElems', 'sprites'];
	for(si in mandatorySettings){
		var setting = mandatorySettings[si];
		if(!(setting in settings)){
			throw new IllegalArgumentException("Please specify the following mandatory setting: "+setting);
		}
	}

	var self = this;

	this.can = settings.can;
	this.ctx = settings.ctx;

	this.size = {};
	this.size.width = settings.width;
	this.size.height = settings.height;

	this.betinfoElems = settings.betinfoElems;

	if('userIsAdmin' in settings){
		this.userIsAdmin = settings.userIsAdmin;
	}else{
		this.userIsAdmin = false;
	}

	if('audioEnabled' in settings){
		this.audioEnabled = settings.audioEnabled;
	}else{
		this.audioEnabled = true;
	}

	if('audioElems' in settings){
		this.audioElems = settings.audioElems;
	}else{
		this.audioElems = [];
	}

	if('errorElem' in settings){
		this.errorElem = settings.errorElem;
	}else{
		this.errorElem = false
	}

	if('debug' in settings){
		this.debug = settings.debug;
	}else{
		this.debug = false;
	}

	if('demo' in settings){
		this.demo = settings.demo;
	}else{
		this.demo = false;
	}

	if('spinFinishedCallback' in settings){
		this.spinFinishedCallback = settings.spinFinishedCallback;
	}else{
		this.spinFinishedCallback = function(){};
	}

	this.state = "rest";
	this.stopType = "normal";
	this.framesSinceReward = 0;
	this.secondsToDisplayRewardFor = 7;
	this.spun = false;

	this.row = {};
	this.row.count = 3;

	this.sprite = {}; this.sprite.size = {};
	this.sprite.img = new Image();
	this.sprite.img.src = settings.sprites;
	this.sprite.loaded = false;
	this.sprite.count = 8;
	this.sprite.size.width = 100;
	this.sprite.size.height = 100;

	this.spriteCodes = {};
	this.spriteCodes["0"] = 0;
	this.spriteCodes["1"] = 1;
	this.spriteCodes["2"] = 2;
	this.spriteCodes["3"] = 3;
	this.spriteCodes["4"] = 4;
	this.spriteCodes["5"] = 5;
	this.spriteCodes["6"] = 6;
	this.spriteCodes["7"] = 7;
/*
  this.spriteCodes['cherry'] = 0;
  this.spriteCodes['orange'] = 1;
  this.spriteCodes['plum'] = 2;
  this.spriteCodes['lemon'] = 3;
  this.spriteCodes['bar'] = 4;
  this.spriteCodes['melon'] = 5;
  this.spriteCodes['seven'] = 6;
  this.spriteCodes['ruby'] = 7;


    this.spriteCodes['dice'] = 0;
  this.spriteCodes['bell'] = 1;
  this.spriteCodes['clover'] = 2;
  this.spriteCodes['circle'] = 3;
  this.spriteCodes['bitcoin'] = 4;
  this.spriteCodes['cherry'] = 5;
  this.spriteCodes['cup'] = 6;
  this.spriteCodes['gem'] = 7;
*/
	this.reel = {};
	this.reel.count = 5;
	this.reel.positions = 32;

	this.cell = {}; this.cell.size = {};
	this.cell.size.width = Math.floor(this.size.width / this.reel.count);
	this.cell.size.height = Math.floor(this.size.height / this.row.count);
	this.cell.borderPadding = 5;
	this.cell.borderWidth = 5;

	this.reel.pixelLength = this.reel.positions * this.cell.size.height;

	this.animation = {};
	this.animation.FPS = 30;
	this.animation.maxReelSpeed = 30;
	// this.animation.maxReelSpeed = 186;
	this.animation.accelSpinup = 1;
	this.animation.accelSpindown = 1;

	this.balance = 0;
	this.bet = 0;
	this.maxBet = 5000;
	this.payout = 0;
	this.lines = 0;
	this.wins = [];
	this.scatters = [];

	this.possibleBets = [1,2,3,4,5,10];

	this.lineColors = [
		'#666666',
		'#E2D338',
		'#86247E',
		'#298842',
		'#C63427',
		'#2B469A'
	];
/*
	this.lineColors = [
		'#666666',
		'#86247E',
		'#2B469A',
		'#298842',
		'#E2D338',
		'#C63427'
	];
*/
	this.finalScreen = [];

	this.reels = new Array(this.reel.count);
	this.reels[0] = {}; this.reels[1] = {}; this.reels[2] = {}; this.reels[3] = {}; this.reels[4] = {};
	this.reels[0].sprites = new Array();
	this.reels[1].sprites = new Array();
	this.reels[2].sprites = new Array();
	this.reels[3].sprites = new Array();
	this.reels[4].sprites = new Array();

	for(var i=0; i<this.reel.count; i++){
		for(var j=0; j<this.reel.positions; j++){
			this.reels[i].sprites[j] = Math.floor(Math.random() * this.sprite.count);
		}
		this.reels[i].sprites[0] = 7;
		this.reels[i].sprites[1] = 6;
		this.reels[i].sprites[2] = 7;
		this.reels[i].position = 0;
		// speed is in pixels per frame
		this.reels[i].speed = 0;
		this.reels[i].isSlowing = false;
		this.reels[i].stoppingSpritesSet = false;
	}

	this.intervals = {};
	this.intervals.loop = setInterval(function(){
		self.logic();
		self.render();
	}, 1000/self.animation.FPS);

	if(this.debug){
		this.startDebug();
		$("#debug").show();
	}

	// this.betinfoElems.balance.innerHTML = parseFloat(this.balance).toFixed(5);
	// this.betinfoElems.payout.innerHTML = this.payout;
}

/* ========== SlotMachine - setters, getters, misc. ==================================================== */

SlotMachine.prototype.setLines = function(lines){
	this.lines = lines;
	// this.betinfoElems.lines.innerHTML = lines;
}
SlotMachine.prototype.setBet = function(bet){
	this.bet = bet;
	// this.betinfoElems.bet.innerHTML = bet * this.lines;
}
SlotMachine.prototype.nextBet = function(){
	var newIndex = this.possibleBets.indexOf(this.bet) + 1;
	if(this.possibleBets[newIndex] * this.lines > this.balance) newIndex = 0;
	if(newIndex == this.possibleBets.length) newIndex = 0;
	this.setBet(this.possibleBets[newIndex]);
}
SlotMachine.prototype.setMaxBet = function(){
	for(var i=0; i <= this.possibleBets.length; i++){
		if(this.balance >= this.lines * this.possibleBets[i]){
			var newBet = this.possibleBets[i];
		}else{
			break;
		}
	}
	this.setBet(newBet);
}
SlotMachine.prototype.enableAudio = function(){
	this.audioEnabled = true;
}
SlotMachine.prototype.disableAudio = function(){
	this.audioEnabled = false;
	this.stopSound('all');
}
SlotMachine.prototype.startDebug = function(){
	this.debug = true;
	var debugElem = document.querySelector("#debug");
	var html = '';
	html += ''+
		'<table class="table">'+
			'<tr>'+
				'<th>State</th>'+
				'<td id="debug-state"></td>'+
			'</tr>'+
		'</table>'+
		'<table class="table">'+
			'<tr>'+
				'<th>pos</th>'+
				'<th>isSlowing</th>'+
				'<th>speed</th>'+
			'</tr>';
	for(var i=0; i<this.reel.count; i++){
		html += ''+
			'<tr id="reel'+i+'">'+
				'<td class="pos"></td>'+
				'<td class="isSlowing"></td>'+
				'<td class="speed"></td>'+
			'</tr>';
	}
	html += '</table>';
	debugElem.innerHTML += html;
	debugElem.style.display = 'block';
}

/* ========== SlotMachine - logic ====================================================================== */

SlotMachine.prototype.logic = function(){
	if(this.state == "spinup"){
		this.logicSpinup();
	}else if(this.state == "spindown"){
		this.logicSpindown();
	}else if(this.state == "reward"){
		this.logicReward();
	}
}
SlotMachine.prototype.logicSpinup = function(){
	if(this.demo){
		var maxSpeed = 2;
	}else{
		var maxSpeed = this.animation.maxReelSpeed
	}
	if(this.reels[0].speed <= maxSpeed){
		for(var i=0; i<this.reel.count; i++){
			this.moveReel(i);
			this.reels[i].speed += this.animation.accelSpinup;
		}
	}else if(this.demo){
		for(var i=0; i<this.reel.count; i++){
			this.moveReel(i);
		}
	}else if(this.finalScreen.length > 0){
		if(this.stopType == "asap"){
			this.stopType = "normal";
			for(var i=0; i<this.reel.count; i++){
				this.reels[i].isSlowing = true;
			}
		}else{
			for(var i=0; i<this.reel.count; i++){
				this.reels[i].isSlowing = false;
			}
		}
		this.state = "spindown";
	}
}
SlotMachine.prototype.logicSpindown = function(){
	if(this.areReelsStopped()){
		this.state = "reward";
		return;
	}

	for(var i=0; i<this.reel.count; i++){
		if(this.reels[i].isSlowing){
			if(this.reels[i].speed > 0){
				if(this.reels[i].speed - this.animation.accelSpindown <= 0){
					var current = {position: this.reels[i].position, speed:this.reels[i].speed}
					var prev_first = this.reelPreviousPositionAndSpeed(current.position, current.speed);
					var first = this.reelNextPositionAndSpeed(current.position, current.speed);
					var second = this.reelNextPositionAndSpeed(first.position, current.speed);
					var third = this.reelNextPositionAndSpeed(second.position, first.speed);
					var fourth = this.reelNextPositionAndSpeed(third.position, second.speed);
					var fifth = this.reelNextPositionAndSpeed(fourth.position, third.speed);
					var divisor = SlotMath.existsDivisorBetween(this.cell.size.height,
						current.position, first.position
					);
					if(divisor){
						this.reels[i].position = divisor;
						this.reels[i].speed = 0;
						this.playSound('reelstop');
						this.makeCurrentPosStartingPosForReel(i);
					}
				}else{
					this.reels[i].speed -= this.animation.accelSpindown;
				}
				this.moveReel(i);
			}
		}else{
			var reelShouldStartSlowing = false;
			if(i==0 || this.reels[i-1].speed == 0 || this.stopType == "asap"){
				reelShouldStartSlowing = true;
			}

			if(reelShouldStartSlowing){
				if(this.reels[i].speed == this.animation.maxReelSpeed + this.animation.accelSpinup){
					this.reels[i].speed -= this.animation.accelSpinup;
				}
				if(!this.reels[i].stoppingSpritesSet){
					this.setStoppingSpritesForReel(i);
					this.reels[i].stoppingSpritesSet = true;
				}
			}

			this.moveReel(i);

			if(reelShouldStartSlowing){
				this.reels[i].isSlowing = true;
			}
		}
	}
}
SlotMachine.prototype.makeCurrentPosStartingPosForReel = function(i){
	for(var j=0; j<this.row.count; j++){
		var reel_index = Math.floor(this.reels[i].position / this.cell.size.height) + j;
		if(reel_index >= this.reel.positions){
			reel_index -= this.reel.positions;
		}
		var sprite_id = this.reels[i].sprites[reel_index];
		this.reels[i].sprites[j] = sprite_id;
	}
	this.reels[i].position = 0;
}
SlotMachine.prototype.pixelsUntilReelStops = function(i){
	var pos = this.reels[i].position;
	var speed = this.reels[i].speed;
	var diff = 0;
	while(speed > 0){
		if(speed - this.animation.accelSpindown <= 0){
			var divisor = SlotMath.existsDivisorBetween(this.cell.size.height, pos, this.reelNextPositionAndSpeed(pos, speed).position);
			var prevPos = pos;
			if(divisor){
				pos = divisor;
				speed = 0;
			}
			diff += prevPos - pos;
		}else{
			speed -= this.animation.accelSpindown;
		}
		pos = this.reelNextPositionAndSpeed(pos, speed).position;
		diff += this.reelMoveDiff(speed);
	}
	return diff;
}
SlotMachine.prototype.setStoppingSpritesForReel = function(i){
	var pixelsUntilStop = this.pixelsUntilReelStops(i);
	var firstStoppingPixel = SlotMath.periodicSubtraction(this.reels[i].position, pixelsUntilStop, this.reel.pixelLength);
	var firstStoppingCell = Math.ceil(firstStoppingPixel / this.cell.size.height);
	for(var j=0; j<3; j++){
		var newCell = SlotMath.periodicAddition(firstStoppingCell, j, this.reel.positions, true);
		var newSprite = this.spriteCodes[this.finalScreen[j][i]];
		this.reels[i].sprites[newCell] = newSprite;
	}
}
SlotMachine.prototype.reelMoveDiff = function(speed){
	return speed;
}
SlotMachine.prototype.reelNextPositionAndSpeed = function(pos, speed){
	return {
		position: SlotMath.periodicSubtraction(pos, this.reelMoveDiff(speed), this.reel.pixelLength),
		speed: Math.max(speed - this.animation.accelSpindown, this.animation.accelSpindown)
	}
}
SlotMachine.prototype.reelPreviousPositionAndSpeed = function(pos, speed){
	return {
		position: SlotMath.periodicAddition(pos, this.reelMoveDiff(speed), this.reel.pixelLength),
		speed: Math.max(speed + this.animation.accelSpindown, this.animation.accelSpindown)
	}
}
SlotMachine.prototype.moveReel = function(i) {
	this.reels[i].position = this.reelNextPositionAndSpeed(this.reels[i].position, this.reels[i].speed).position;
}
SlotMachine.prototype.areReelsStopped = function(){
	for(var i=0; i<this.reel.count; i++){
		if(this.reels[i].speed != 0){
			return false;
		}
	}
	return true;
}
SlotMachine.prototype.logicReward = function(){
	for(var i=0; i<this.reel.count; i++){
		this.reels[i].stoppingSpritesSet = false;
	}
	if(this.framesSinceReward == 0){
		this.finalScreen = [];
		// this.betinfoElems.balance.innerHTML = parseFloat(this.balance).toFixed(5);
		// this.betinfoElems.payout.innerHTML = this.payout;
		if(this.payout > 0){
			if(this.payout < 100){
				this.playSound('win');
			}else{
				this.playSound('bigwin');
			}
		}

	}

	if(this.payout == 0){
		this.state = "rest";
		this.framesSinceReward = 0;
		this.spinFinishedCallback();
	}else{
		this.framesSinceReward += 1;
		if(this.framesSinceReward >= this.secondsToDisplayRewardFor * this.animation.FPS){
			this.state = "rest";
			this.framesSinceReward = 0;
			this.spinFinishedCallback();
		}
	}
}

/* ========== SlotMachine - render ===================================================================== */

SlotMachine.prototype.render = function(){
	if(this.state == "spinup" || this.state == "spindown" || this.state == "reward" || this.state == "rest") {
		this.renderReels();
	}
}
SlotMachine.prototype.renderReels = function(){
	this.ctx.clearRect(0, 0, this.size.width, this.size.height);
	this.ctx.clearRect(-9999, -9999, 9999, 9999);

	var reel_index;
	var sprite_offset;
	var sprite_index;
	var x;
	var y;

	if(this.spun){
		this.drawLines(false);
	}

	for(var i=0; i<this.reel.count; i++){
		for(var j=0; j<this.row.count+1; j++){
			this.drawSpriteAtPos(i, j);
		}

		if(this.debug){
			document.querySelector('#debug-state').innerHTML = this.state;
			document.querySelector('#reel' + i + ' .pos').innerHTML = this.reels[i].position;
			document.querySelector('#reel' + i + ' .isSlowing').innerHTML = this.reels[i].isSlowing;
			document.querySelector('#reel' + i + ' .speed').innerHTML = this.reels[i].speed;
		}
	}

	if(!this.spun){
		this.drawLines(true);
	}

	if(this.state == "reward"){
		this.drawWins();
	}

	this.drawReelSeparators();
}
SlotMachine.prototype.drawLines = function(full){
	if(typeof full == "undefined") full = true;
	this.ctx.globalAlpha = full ? 1.0 : 0.0;
	var lineWidth = 3.5;
	var useFadedColor = false;
	var fadedColor = '#f0f0f0';

	this.drawLine(0, this.cell.size.height * 1.5, this.size.width, this.cell.size.height * 1.5, !useFadedColor ? this.lineColors[1] : fadedColor, lineWidth);
	this.drawLine(0, this.cell.size.height * 0.5, this.size.width, this.cell.size.height * 0.5, !useFadedColor ? this.lineColors[2] : fadedColor, lineWidth);
	this.drawLine(0, this.cell.size.height * 2.5, this.size.width, this.cell.size.height * 2.5, !useFadedColor ? this.lineColors[3] : fadedColor, lineWidth);

	var edgeCompensation = 2;

	this.drawLine(0, 0, this.cell.size.width * 2.5 + edgeCompensation, this.cell.size.height * 2.5, !useFadedColor ? this.lineColors[4] : fadedColor, lineWidth);
	this.drawLine(this.cell.size.width * 2.5 - edgeCompensation, this.cell.size.height * 2.5, this.size.width, 0, !useFadedColor ? this.lineColors[4] : fadedColor, lineWidth);

	this.drawLine(0, this.size.height, this.cell.size.width * 2.5 + edgeCompensation, this.cell.size.height * 0.5, !useFadedColor ? this.lineColors[5] : fadedColor, lineWidth);
	this.drawLine(this.cell.size.width * 2.5 - edgeCompensation, this.cell.size.height * 0.5, this.size.width, this.size.height, !useFadedColor ? this.lineColors[5] : fadedColor, lineWidth);
	this.ctx.globalAlpha = 1.0;
}
SlotMachine.prototype.drawWins = function(){
	if(this.scatters.length > 2){
		for(si in this.scatters){
			var scatter = this.scatters[si];
			this.drawBorderForCell(scatter[1], scatter[0], this.lineColors[0]);
		}
	}
	if(this.wins.length > 0){
		for(wi in this.wins){
			win = this.wins[wi];

			if(win.type=="line"){
				var lineNumber = 0;
				if(win.position == 1) lineNumber = 1;
				if(win.position == 0) lineNumber = 2;
				if(win.position == 2) lineNumber = 3;
				var lineColor = this.lineColors[lineNumber];
				this.drawBorderForCell(0, win.position, lineColor);
				for(var k=1; k<win.count; k++){
					this.drawBorderForCell(k, win.position, lineColor);
					this.drawLineBetweenCells(k-1, win.position, k, win.position, lineColor);
				}
			}else if(this.wins[wi].type=="diagonal"){
				if(this.wins[wi].position==0){ // v
					var lineColor = this.lineColors[4];
					this.drawBorderForCell(0, 0, lineColor);
					for(var k=1; k<win.count; k++){
						var j = k;
						var spriteDiff = -1;
						if(j >= this.row.count){
							j = j - (j - this.row.count - 1);
							var spriteDiff = +1;
						}
						this.drawBorderForCell(k, j, lineColor);
						this.drawLineBetweenCells(k-1, j+spriteDiff, k, j, lineColor);
					}
				}else if(this.wins[wi].position==1){ // ^
					var lineColor = this.lineColors[5];
					this.drawBorderForCell(0, this.row.count - 1, lineColor);
					for(var k=1; k<win.count; k++){
						var j = this.row.count - 1 - k;
						var spriteDiff = +1;
						if(j < 0){
							j = 0 - j;
							var spriteDiff = -1;
						}
						this.drawBorderForCell(k, j, lineColor);
						this.drawLineBetweenCells(k-1, j+spriteDiff, k, j, lineColor);
					}
				}
			}
		}
	}
}
SlotMachine.prototype.drawSpriteAtPos = function(i, j){
	var reel_index = Math.floor(this.reels[i].position / this.cell.size.height) + j;
	if(reel_index >= this.reel.positions){
		reel_index -= this.reel.positions;
	}

	var sprite_offset = this.reels[i].position % this.cell.size.height;

	var sprite_id = this.reels[i].sprites[reel_index];
	var x = i * this.cell.size.width;
	var y = j * this.cell.size.height - sprite_offset;
	this.drawSprite(sprite_id, x, y);
}
SlotMachine.prototype.drawSprite = function(sprite_id, x, y){
	var sprite_pos = sprite_id * this.sprite.size.height;
	var xOffsetToCenter = Math.max(0, (this.cell.size.width - this.sprite.size.width) / 2);
	var yOffsetToCenter = Math.max(0, (this.cell.size.height - this.sprite.size.height) / 2);
	this.ctx.drawImage(this.sprite.img, 0, sprite_pos, this.sprite.size.width, this.sprite.size.height,
		x + xOffsetToCenter, y + yOffsetToCenter, this.sprite.size.width, this.sprite.size.height);
}
SlotMachine.prototype.drawBorderForCell = function(i, j, strokeStyle, lineWidth){
	var x = i * this.cell.size.width;
	var y = j * this.cell.size.height;
	var pd = this.cell.borderPadding;
	this.drawSquare(x + pd, y + pd, this.cell.size.width - pd*2, this.cell.size.height - pd*2, strokeStyle);
}
SlotMachine.prototype.drawSquare = function(x, y, width, height, strokeStyle, lineWidth){
	this.ctx.strokeStyle = typeof strokeStyle !== 'undefined' ? strokeStyle : 'black';
	this.ctx.lineWidth = typeof lineWidth !== 'undefined' ? lineWidth : this.cell.borderWidth;
	this.ctx.strokeRect(x, y, width, height);
}
SlotMachine.prototype.drawLineBetweenCells = function(i1, j1, i2, j2, strokeStyle, lineWidth){
	var pd = this.cell.borderPadding;
	if(j1 == j2){
		var x1 = i1 * this.cell.size.width + this.cell.size.width;
		var x2 = i2 * this.cell.size.width;

		var y1 = j1 * this.cell.size.height  + this.cell.size.height / 2;
		var y2 = y1;

		x1-=pd;
		x2+=pd
	}else if(j1 > j2){
		var x1 = i1 * this.cell.size.width + this.cell.size.width;
		var y1 = j1 * this.cell.size.height;

		var x2 = i2 * this.cell.size.width;
		var y2 = j2 * this.cell.size.height + this.cell.size.height;

		x1-=pd;
		y1+=pd;
		x2+=pd;
		y2-=pd;
	}else if(j2 > j1){
		var x1 = i1 * this.cell.size.width + this.cell.size.width;
		var y1 = j1 * this.cell.size.height + this.cell.size.height;

		var x2 = i2 * this.cell.size.width;
		var y2 = j2 * this.cell.size.height;

		x1-=pd;
		y1-=pd;
		x2+=pd;
		y2+=pd;
	}
	this.drawLine(x1, y1, x2, y2, strokeStyle);
}
SlotMachine.prototype.drawLine = function(x1, y1, x2, y2, strokeStyle, lineWidth){
	this.ctx.strokeStyle = typeof strokeStyle !== 'undefined' ? strokeStyle : 'black';
	this.ctx.lineWidth = typeof lineWidth !== 'undefined' ? lineWidth : this.cell.borderWidth;
	this.ctx.beginPath();
	this.ctx.moveTo(x1, y1);
	this.ctx.lineTo(x2, y2);
	this.ctx.stroke();
}
SlotMachine.prototype.drawShadows = function(){
	var shadowOpacity = 0.25;
	this.ctx.globalAlpha = 0.5;
	var shadowHeight = 50;
	var shadowWidth = 5;

	/* bottom/top */
	var y1 = this.size.height - shadowHeight;
	var y2 = this.size.height;
	var grd = this.ctx.createLinearGradient(0, y1, 0, y2);
	grd.addColorStop(0, 'rgba(0,0,0,0)');
	grd.addColorStop(1, 'rgba(0,0,0,' + shadowOpacity + ')');
	this.ctx.fillStyle = grd;
	this.ctx.fillRect(0, y1, this.size.width, y2);

	var y1 = 0;
	var y2 = shadowHeight;
	var grd = this.ctx.createLinearGradient(0, y2, 0, y1);
	grd.addColorStop(0, 'rgba(0,0,0,0)');
	grd.addColorStop(1, 'rgba(0,0,0,' + shadowOpacity +')');
	this.ctx.fillStyle = grd;
	this.ctx.fillRect(0, y1, this.size.width, y2);

	/* left/right */
	var x1 = 0;
	var x2 = shadowWidth;
	var grd = this.ctx.createLinearGradient(x1, 0, x2, 0);
	grd.addColorStop(0, 'rgba(0,0,0,' + shadowOpacity +')');
	grd.addColorStop(1, 'rgba(0,0,0,0)');
	this.ctx.fillStyle = grd;
	this.ctx.fillRect(x1, 0, x2, this.size.height);

	var x1 = this.size.width - shadowWidth;
	var x2 = this.size.width;
	var grd = this.ctx.createLinearGradient(x1, 0, x2, 0);;
	grd.addColorStop(0, 'rgba(0,0,0,0)');
	grd.addColorStop(1, 'rgba(0,0,0,' + shadowOpacity +')');
	this.ctx.fillStyle = grd;
	this.ctx.fillRect(x1, 0, x2, this.size.height);

	this.ctx.globalAlpha = 1;
}
SlotMachine.prototype.drawReelSeparators = function(){
	this.ctx.lineWidth = 1;
	var shadowOpacity = 0.125;

	for(var i=0; i<this.reel.count; i++){
		if(i > 0 && i < this.reel.count){
			var grd = this.ctx.createLinearGradient(0, 0, 0, this.size.height);
			grd.addColorStop(0, 'rgba(0,0,0,0.025)');
			grd.addColorStop(0.5, 'rgba(0,0,0,' + shadowOpacity + ')');
			grd.addColorStop(1, 'rgba(0,0,0,0.025)');
			this.ctx.strokeStyle = grd;

			this.ctx.beginPath();
			this.ctx.moveTo(i * this.cell.size.width, 0);
			this.ctx.lineTo(i * this.cell.size.width, this.size.height);
			this.ctx.stroke();
		}
	}
}

/* ========== SlotMachine - public methods ============================================================ */

SlotMachine.prototype.spin = function(){
	if(this.state != "rest") return;
	if(this.balance < this.lines * this.bet || this.balance <= 0 || this.bet <= 0 || this.lines <= 0){
		this.showElem('slotmachine-error-nocredits');
		return;
	}
	this.playSound('spinup');
	this.spun = true;

	this.balance -= this.lines;
	this.state = "spinup";
}

SlotMachine.prototype.showError = function(message){
	this.errorElem.style.display = 'block';
	// this.errorElem.innerHTML = message;
}
SlotMachine.prototype.showElem = function(elem){
	document.getElementById(elem).style.display = 'block';
}

SlotMachine.prototype.handleSpacebar = function(){
	if(this.state == "rest"){
		this.spin();
	}/*else if(this.state == "spindown"){
		for(var i=0; i<this.reel.count; i++){
			this.reels[i].isSlowing = true;
		}
	}else if(this.state == "spinup"){
		this.stopType = "asap";
	}*/else if(this.state == "reward"){
		this.state = "rest";
		this.spin();
	}
}

/* ========== SlotMachine - sounds ====================================================================== */

SlotMachine.prototype.playSound = function(sound){
	if(this.audioEnabled){
		if(this.userIsAdmin && sound == 'spinup') sound = 'paint';
		if(sound in this.audioElems){
			var elem = this.audioElems[sound];
			elem.currentTime = 0;
			elem.volume = 0.3;
			elem.play();
		}
	}
}
SlotMachine.prototype.stopSound = function(sound){
	if(this.audioEnabled){
		if(sound == "all"){
			for(i in this.audioElems){
				var elem = this.audioElems[i];
				if(elem != null){
					elem.pause();
					elem.currentTime = 0;
				}
			}
		}else if(sound in this.audioElems){
			var elem = this.audioElems[sound];
			elem.pause();
			elem.currentTime = 0;
		}
	}
}
