/*global cc,res,wheelSprite,BackGround,Spin,cocosScope*/'use strict';
/*jslint evil: true */

cocosScope.GameLayer = cc.Layer.extend({
        menuPlayerSlotFirst:null,
        menuPlayerSlotSec:null,
        menuPlayerSlotThird:null,
        menuPlayerSlotFourth:null,
        menuPlayerSlotFifth:null,
        menuPlayerSlotSixth:null,
        menuPlayerSlotSeventh:null,
        delearSlotFirst:null,
        delearSlotSec:null,
        delearSlotThird:null,
        delearSlotFourth:null,
        delearSlotFifth:null,
        delearSlotSixth:null,
        delearSlotSeventh:null,
        delearSlotFirstTemp:null,
        delearSlotSecTemp:null,
        delearSlotThirdTemp:null,
        delearSlotFourthTemp:null,
        delearSlotFifthTemp:null,
        delearSlotSixthTemp:null,
        delearSlotSeventhTemp:null,
        animationStartCard:null,
        playerTwoCardHandLeft:null,
        playertwoCardHandRight:null,
        animationStartCardObj:null,
        blinkCard:null,
        twoHandFlippedCardLeft:null,
        resultFiveCardText:null,
        resultTwoCardText:null,
        fiveTwoValidationTxt:null,
        resultTxt:null,
        bitCoinFirst:null,
        bitCoinSecond:null,
        bitCoinThird:null,
        bitCoinFourth:null,
        footerMessagesText:null,
        bitCoinValueText:null,
	wingameTxt:null,
	setBitCoinPos : 0,

        init:function () {  
        if (this._super()) {
		//var winSize = cc.Director.getInstance().getWinSize();
               //  this.rearangeCards();
        		var winSize = cc.Director.getInstance().getWinSize();
	        	var spriteFrameCache = cc.SpriteFrameCache.getInstance();
	    		spriteFrameCache.addSpriteFrames(res.baseResource_plist, res.baseResource_png);
	    		this.createBitcoins();
	    		this.soundOptionMenu();
	    		//this.createbuttons();
	
	    		this.resultFiveCardText = cc.LabelTTF.create("", "Arial", 22);
	    		//this.resultFiveCardText.enableStroke(ccGREEN, 1.0,true);
	    		//this.resultFiveCardText.setColor(cc.c3b(218,165,32));
	    		this.resultFiveCardText.setPosition(g_resultPositions.fiveCardStatusText.width,g_resultPositions.fiveCardStatusText.height);
	    		this.addChild(this.resultFiveCardText);
	    		this.resultFiveCardText.setVisible(false);
	    		
	    		this.resultTwoCardText = cc.LabelTTF.create("", "Arial", 22);
	    		//this.resultTwoCardText.setColor(cc.c3b(218,165,32));
	    		this.resultTwoCardText.setPosition(g_resultPositions.twoCardStatusText.width,g_resultPositions.twoCardStatusText.height);
	    		this.addChild(this.resultTwoCardText);
	    		this.resultTwoCardText.setVisible(false);
                //  label.setString('test');

                this.fiveTwoValidationTxt = cc.LabelTTF.create("", "Arial", 22);
                //this.fiveTwoValidationTxt.setColor(cc.c3b(218,165,32));   
                this.fiveTwoValidationTxt.setPosition(g_resultPositions.twoCardValidationText.width,g_resultPositions.twoCardValidationText.height);
                this.addChild(this.fiveTwoValidationTxt);
                this.fiveTwoValidationTxt.setVisible(false);
                g_langObj = g_strings.en_US;

                
                this.footerMessagesText = cc.LabelTTF.create("", "Arial", 22);
               // this.footerMessagesText.setColor(cc.c3b(218,165,32)); 
                this.footerMessagesText.setPosition(winSize.width / 2,g_messagePositions.placeYourBetCoinMessage.height);
                this.addChild(this.footerMessagesText);
                this.footerMessagesText.setVisible(false);

                this.bitCoinValueText = cc.LabelTTF.create("", "Arial", 15);
                //this.bitCoinValueText.setColor(cc.c3b(218,165,32)); 
                
                this.bitCoinValueText.setPosition(g_bitcoinPositions.text.x,g_bitcoinPositions.text.y);
                this.addChild(this.bitCoinValueText);
                this.bitCoinValueText.setVisible(false);
                
                this.resultTxt = cc.LabelTTF.create("", "Arial", 22);
                //this.resultTxt.setColor(cc.c3b(218,165,32)); 
                this.resultTxt.setPosition(g_resultPositions.resultText.width,g_resultPositions.resultText.height);
                this.addChild(this.resultTxt);
                this.resultTxt.setVisible(false);
                g_langObj = g_strings.en_US;

                var dealButton = cc.Sprite.createWithSpriteFrameName("split.png");
       		 	var dealButton = cc.MenuItemSprite.create(dealButton,null, null, this.dealGame, this);
       		 	this.menuDealButton = cc.Menu.create(dealButton);
	       		this.menuDealButton.alignItemsHorizontallyWithPadding(10);
	       	    this.addChild(this.menuDealButton);
	       	    this.menuDealButton.setPosition(winSize.width / 2, g_bitcoinPositions.newbtn.x);
	       	    this.menuDealButton.setVisible(false);
                
                this.wingameTxt = cc.LabelTTF.create("", "Arial", 18);
                this.wingameTxt.setPosition(g_resultPositions.resultWinText.width,g_resultPositions.resultWinText.height);
                this.addChild(this.wingameTxt);
                this.wingameTxt.setVisible(false);
               // g_langObj = g_strings.en_US;
                
                this.placeYourBetMessage();
        }
        return true;
	},
	createBitcoins : function(){
		var winSize = cc.Director.getInstance().getWinSize();
		var pos = cc.p(Math.random() * winSize.width, 0);
		var bitcoin1 = cc.Sprite.createWithSpriteFrameName("bitcoin_.001.png");
		var bitcoin2 = cc.Sprite.createWithSpriteFrameName("bitcoin_.01.png");
		var bitcoin3 = cc.Sprite.createWithSpriteFrameName("bitcoin_.1.png");
		var bitcoin4 = cc.Sprite.createWithSpriteFrameName("bitcoin_1.png");
		var bit1 = cc.MenuItemSprite.create(bitcoin1,null,this.onSelectBitcoin1,this);
		var bit2 = cc.MenuItemSprite.create(bitcoin2,null, this.onSelectBitcoin2,this);		
		var bit3 = cc.MenuItemSprite.create(bitcoin3,null,this.onSelectBitcoin3,this);
		var bit4 = cc.MenuItemSprite.create(bitcoin4,null, this.onSelectBitcoin4,this);		
	
		var menu = cc.Menu.create(bit1,bit2,bit3,bit4);
        	menu.alignItemsHorizontallyWithPadding(7);
        	this.addChild(menu, 1, 2);
		menu.setPosition(new cc.Point(g_bitcoinPositions.bitcoin.x, g_bitcoinPositions.bitcoin.y));
	},
	placeYourBetMessage:function(){
		//var winSize = cc.Director.getInstance().getWinSize();
		g_langObj = g_strings.en_US;
		var status = null;
		/*this.placeYourBetMessageText = cc.LabelTTF.create("", "Arial", 64);
        this.placeYourBetMessageText.setPosition(winSize.width / 2,g_messagePositions.placeYourBetCoinMessage.height);
        this.addChild(this.placeYourBetMessageText);*/
		//console.log(g_createdBitCoins['0.001'].length);
		if(g_createdBitCoins['1'].length==0 && g_createdBitCoins['0.1'].length==0 && g_createdBitCoins['0.01'].length==0 && g_createdBitCoins['0.001'].length==0){ 
			status = g_langObj.bitConPlacingMessage;	
		}else{
			 status = g_langObj.placeYourBetOrDealMessage;
		}
		this.footerMessagesText.setString(status);
        this.footerMessagesText.setVisible(true);
		
	},
	placeYourBetOnNewGame:function(){
		var status = g_langObj.bitConPlacingMessage;
		this.footerMessagesText.setString(status);
        this.footerMessagesText.setVisible(true);
        if(audioPlaying == true){
    		g_audioEngine.playEffect(g_langObj.placeYourBetSound);
 	    }
        
	},
	removeFooterMessages:function(){
		this.footerMessagesText.setVisible(false);
	},
	maximumBitCoinMessage:function(){
		g_langObj = g_strings.en_US;
		var message = g_langObj.maximumBitCoinMessage;
		this.footerMessagesText.setString(message);
        this.footerMessagesText.setVisible(true);
	},
	bitCoinValueTextShow:function(value){	
		value = "B"+value;
		this.bitCoinValueText.setString(value);
        this.bitCoinValueText.setVisible(true);
		
	},
	createbuttons : function(){
		 var winSize = cc.Director.getInstance().getWinSize();
		 var clearbtn = cc.Sprite.createWithSpriteFrameName("clear.png");
		 var newgamebtn = cc.Sprite.createWithSpriteFrameName("deal.png");
		 var newGame = cc.MenuItemSprite.create(newgamebtn,null, null, this.newGame, this);
		 var clearGame = cc.MenuItemSprite.create(clearbtn,null, null, this.clearBitcoin, this);
		 this.menuNewGame = cc.Menu.create(newGame,clearGame);
		 this.menuNewGame.alignItemsHorizontallyWithPadding(2);
         this.addChild(this.menuNewGame, 1, 2);
         this.menuNewGame.setPosition(winSize.width / 2, g_bitcoinPositions.newbtn.x);
         /*For creating split button*/	
	},
        
        changeToBackCardPlayer: function() {
                 this.playerSlotFirst.setVisible(false);
                 // this.blinkCard.setVisible(true);
                 
        },

	newGame : function(){ 
        	   this.footerMessagesText.setVisible(false);
               this.splitGame();
	},

        addPlayerCards: function(obj, cardName, callbackFunction) {
            var playerSlot = cc.Sprite.createWithSpriteFrameName(cardName);
            var card = cc.MenuItemSprite.create(playerSlot,null,callbackFunction,this);
            obj = cc.Menu.create(card);
            this.addChild(obj);
	        obj.setPosition(new cc.Point(g_cardsPositions.playerCardOrigin.width, g_cardsPositions.playerCardOrigin.height));
            //obj.setPosition(new cc.Point(1300,888.5));
            
            obj.setVisible(false);
            return obj;
        },

	splitGame : function() {  
		g_gameStatus = true;
        	g_playerSelectedCards = [];
        	g_selectedPlayerCardsObj = [];
        	g_playerFiveCards = [];
            if (this.menuPlayerSlotFirst) {
                this.resetGame();
            }
            //if(g_bitValue != 0) { 
            this.removeChild(this.menuNewButton);
            this.removeChild(this.menuNewGame);
            g_cardValues = this.rearangeCards(g_cardValues);
            this.blinkCard = cc.Sprite.createWithSpriteFrameName('back_card_right_rotate.png');
            var obj = g_cardsPositions.blinkCardBotton;
            this.blinkCard.setPosition(new cc.Point(obj.width, obj.height));
            this.addChild(this.blinkCard);
            var moveBlinkCard = cc.MoveTo.create(0.1, cc.p(obj.downWidth, obj.downHeight));
            var moveBlinkCardBack = cc.MoveTo.create(0.1, cc.p(obj.width, obj.height));
            var blink = cc.Blink.create(0.2, 1);

            obj = g_cardsPositions.playerCardOrigin;
           
            var playerCards = document.getElementById("playerCards");
            var dealerCards = document.getElementById("dealerCards");
            
            if(playerCards && dealerCards && dealerCards.value && playerCards.value){
	            var playerCardsArray = dealerCards.value.split(",");
	            var dealerCardsArray = playerCards.value.split(",");
	            g_cardValues = playerCardsArray.concat(dealerCardsArray);
                    g_randomCards.push(g_cardValues[0]);
            g_randomCards.push(g_cardValues[1]);
            g_randomCards.push(g_cardValues[2]);
            g_randomCards.push(g_cardValues[3]);
            g_randomCards.push(g_cardValues[4]);
            g_randomCards.push(g_cardValues[5]);
            g_randomCards.push(g_cardValues[6]);
            g_randomCards.push(g_cardValues[7]);
            g_randomCards.push(g_cardValues[8]);
            g_randomCards.push(g_cardValues[9]);
            g_randomCards.push(g_cardValues[10]);
            g_randomCards.push(g_cardValues[11]);
            g_randomCards.push(g_cardValues[12]);
            g_randomCards.push(g_cardValues[13]);
                    
            }
            else {

                 g_randomCards.push(g_cardValues[40]);
            g_randomCards.push(g_cardValues[20]);
            g_randomCards.push(g_cardValues[17]);
            g_randomCards.push(g_cardValues[28]);
            g_randomCards.push(g_cardValues[35]);
            g_randomCards.push(g_cardValues[30]);
            g_randomCards.push(g_cardValues[25]);
            g_randomCards.push(g_cardValues[15]);
            g_randomCards.push(g_cardValues[10]);
            g_randomCards.push(g_cardValues[9]);
            g_randomCards.push(g_cardValues[7]);
            g_randomCards.push(g_cardValues[45]);
            g_randomCards.push(g_cardValues[47]);
            g_randomCards.push(g_cardValues[5]);
                 g_randomCards = this.rearangeCards(g_randomCards);
            }
            
            //g_cardValues.push(dealerCards);
            //console.log(g_cardValues);
             // g_cardValues =['c13','c11','h10','s4','c2', 'h4','h2','c14','h12','c10','s4','c3', 'h9','s8'];

            // g_cardValues =['d8','h8','c14','h11', 'd2', 'h5',  'h7','h11', 'c7','s6','h4','s3','c3', 'c2'];
            // g_cardValues =['h3','h2','h5','h4', 'h14', 'c8',  'c9','jo15','h12','h11','h10', 'h9', 'c8',  'c9'];

            // g_cardValues =['d7','s12','h7','h6','h3', 'c14','d2','h14','c5','h2','d14','d4', 'd6','d13'];

             // g_cardValues =['d10','c8','c7','jo15','c3', 'c4','c5','h14','c5','h2','d14','d4', 'd6','d13'];
            // g_cardValues =['c4','d10','jo15','c5','d12', 'd14','s11','h14','c5','h2','d14','d4', 'd6','d13'];
            // alert('s');
             // g_cardValues =['d3','h4','s8','s5','s12', 'd10','s11','h14','c5','h2','d14','d4', 'd6','d13'];

              //  g_cardValues =['d3','h4','s8','s5','s12', 'd10','s11','jo15','c11','s10','d9','d7', 'c6','d13'];
            // g_cardValues =['d3','h4','s8','s5','s12', 'd10','s11','c8','c9','s10','d11','d12', 'c13','d14'];
             // g_cardValues =['d3','h4','s8','s5','s12', 'd10','s11','c8','jo15','s10','d11','d12', 'c13','d14']; // Note
            // g_cardValues =['d3','h4','s8','s5','s12', 'd10','s11','jo15','c9','s10','d11','d12', 'c13','d14'];   // Note 
            // g_cardValues =['d3','h4','s8','s5','s12', 'd10','s11','jo15','c9','c10','c11','c12', 'c13','c14'];
            // g_cardValues =['d3','h4','s8','s5','s12', 'd10','s11','c8','c9','c10','c11','c12', 'c13','jo15'];
            // g_cardValues =['d3','h4','s8','s5','s12', 'd10','s11','c3','c2','c10','c11','c12', 'c13','jo15'];

            // g_cardValues =['d3','h4','s8','s5','s12', 'd10','s11','c3','c2','c7','c8','c10', 'c13','jo15'];
           // g_cardValues =['d3','h4','s8','s5','s12', 'd10','s11','s3','d7','c7','c10','h10', 'c14','jo15'];

            
            /*g_randomCards.push(g_cardValues[40]);
            g_randomCards.push(g_cardValues[20]);
            g_randomCards.push(g_cardValues[17]);
            g_randomCards.push(g_cardValues[28]);
            g_randomCards.push(g_cardValues[35]);
            g_randomCards.push(g_cardValues[30]);
            g_randomCards.push(g_cardValues[25]);
            g_randomCards.push(g_cardValues[15]);
            g_randomCards.push(g_cardValues[10]);
            g_randomCards.push(g_cardValues[9]);
            g_randomCards.push(g_cardValues[7]);
            g_randomCards.push(g_cardValues[45]);
            g_randomCards.push(g_cardValues[47]);
            g_randomCards.push(g_cardValues[5]);
            // alert( g_randomCards);
            g_randomCards = this.rearangeCards(g_randomCards);*/
            // g_randomCards =['d3','h4','s8','s5','s12', 'd10','s11','c6','s2','d3','d4','c12', 'h12','jo15'];
            // g_randomCards =['d3','h4','s8','s5','s12','d10','s11','c6','s2','c4','d4','c14', 'h14','jo15'];
           //  g_randomCards =['d3','h4','s8','s5','s12', 'd10','s11','s3','d11','c7','c10','h10', 'c14','jo15'];
           //  g_randomCards =['d3','h4','s8','s5','s12', 'd10','s11','c3','c5','c7','c12','c10', 'c14','d13'];
           //  g_randomCards =['d3','h4','s8','s5','s12', 'd10','s11','c2','d2','s2','c8','s13', 'jo15','d14'];
           // g_randomCards =['d10','c4','jo15','c5','d12', 'd14','s11','c2','d2','s11','c10','s9', 's7','d6'];
            g_playerSelectedCards.push(g_randomCards[0]);
            g_playerSelectedCards.push(g_randomCards[1]);
            g_playerSelectedCards.push(g_randomCards[2]);
            g_playerSelectedCards.push(g_randomCards[3]);
            g_playerSelectedCards.push(g_randomCards[4]);
            g_playerSelectedCards.push(g_randomCards[5]);
            g_playerSelectedCards.push(g_randomCards[6]);
            /*g_playerFiveCards = g_playerSelectedCards;     
            console.log(g_playerFiveCards);
            console.log(g_playerSelectedCards);*/
            
            //g_playerFiveCards = g_playerSelectedCards; 
            
            /*g_playerFiveCards.push(g_cardValues[0]);
            g_playerFiveCards.push(g_cardValues[1]);
            g_playerFiveCards.push(g_cardValues[2]);
            g_playerFiveCards.push(g_cardValues[3]);
            g_playerFiveCards.push(g_cardValues[4]);
            g_playerFiveCards.push(g_cardValues[5]);
            g_playerFiveCards.push(g_cardValues[6]);*/
            //console.log(g_playerSelectedCards);
            
            this.menuPlayerSlotFirst = this.addPlayerCards(this.menuPlayerSlotFirst, g_cards[g_randomCards[0]].src,  this.playerCardFirstClick);
            this.menuPlayerSlotSec = this.addPlayerCards(this.menuPlayerSlotSec, g_cards[g_randomCards[1]].src,  this.playerCardSecClick);
            this.menuPlayerSlotThird = this.addPlayerCards(this.menuPlayerSlotThird, g_cards[g_randomCards[2]].src,  this.playerCardThirdClick);
            this.menuPlayerSlotFourth = this.addPlayerCards(this.menuPlayerSlotFourth, g_cards[g_randomCards[3]].src,  this.playerCardFourthClick);
            this.menuPlayerSlotFifth = this.addPlayerCards(this.menuPlayerSlotFifth, g_cards[g_randomCards[4]].src,  this.playerCardFifthClick);
            this.menuPlayerSlotSixth = this.addPlayerCards(this.menuPlayerSlotSixth, g_cards[g_randomCards[5]].src,  this.playerCardSixthClick);
            this.menuPlayerSlotSeventh = this.addPlayerCards(this.menuPlayerSlotSeventh, g_cards[g_randomCards[6]].src, this.playerCardSeventhClick);

            //console.log(this.menuPlayerSlotSeventh);
            
            g_selectedPlayerCardsObj[g_randomCards[0]] = this.menuPlayerSlotFirst;
            g_selectedPlayerCardsObj[g_randomCards[1]] = this.menuPlayerSlotSec;
            g_selectedPlayerCardsObj[g_randomCards[2]] = this.menuPlayerSlotThird;
            g_selectedPlayerCardsObj[g_randomCards[3]] = this.menuPlayerSlotFourth;
            g_selectedPlayerCardsObj[g_randomCards[4]] = this.menuPlayerSlotFifth;
            g_selectedPlayerCardsObj[g_randomCards[5]] = this.menuPlayerSlotSixth;
            g_selectedPlayerCardsObj[g_randomCards[6]] = this.menuPlayerSlotSeventh;
            
            /*Adding property card_id to object8*/  
            
            this.menuPlayerSlotFirst['card_id'] =  g_randomCards[0];
            this.menuPlayerSlotSec['card_id'] =  g_randomCards[1];
            this.menuPlayerSlotThird['card_id'] =  g_randomCards[2];
            this.menuPlayerSlotFourth['card_id'] =  g_randomCards[3];
            this.menuPlayerSlotFifth['card_id'] =  g_randomCards[4];
            this.menuPlayerSlotSixth['card_id'] =  g_randomCards[5];
            this.menuPlayerSlotSeventh['card_id'] =  g_randomCards[6];
            

           

            var moveSecond = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.playerCardSlot2.width, g_cardsPositions.playerCardSlot2.height));
            var moveFirst = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.playerCardSlot1.width, g_cardsPositions.playerCardSlot1.height));
            var moveThrid = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.playerCardSlot3.width, g_cardsPositions.playerCardSlot3.height));
            var moveFourth = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.playerCardSlot4.width, g_cardsPositions.playerCardSlot4.height));
            var moveFifth = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.playerCardSlot5.width, g_cardsPositions.playerCardSlot5.height));
            var moveSixth = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.playerCardSlot6.width, g_cardsPositions.playerCardSlot6.height));
            var moveSeventh = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.playerCardSlot7.width, g_cardsPositions.playerCardSlot7.height));

            var actionFirst =  cc.TargetedAction.create(this.menuPlayerSlotFirst, moveFirst);
            var actionSecond = cc.TargetedAction.create(this.menuPlayerSlotSec, moveSecond);
            var actionThird = cc.TargetedAction.create(this.menuPlayerSlotThird, moveThrid);
            var actionFourth =  cc.TargetedAction.create(this.menuPlayerSlotFourth, moveFourth);
            var actionFifth = cc.TargetedAction.create(this.menuPlayerSlotFifth, moveFifth);
            var actionSixth = cc.TargetedAction.create(this.menuPlayerSlotSixth, moveSixth);
            var actionSeventh = cc.TargetedAction.create(this.menuPlayerSlotSeventh, moveSeventh);

            var seq = cc.Sequence.create( moveBlinkCard,  blink, cc.CallFunc.create(this.getFirstCardVisible, this), actionFirst, blink, cc.CallFunc.create(this.getSecondCardVisible, this), actionSecond,blink, cc.CallFunc.create(this.getThirdCardVisible, this), actionThird,blink, cc.CallFunc.create(this.getFouthCardVisible, this), actionFourth,  blink, cc.CallFunc.create(this.getFifthCardVisible, this), actionFifth, blink,cc.CallFunc.create(this.getSixthCardVisible, this),   actionSixth, blink,cc.CallFunc.create(this.getSeventhCardVisible, this),   actionSeventh, moveBlinkCardBack, cc.CallFunc.create(this.hideBlinkCard, this) ); 
            this.blinkCard.runAction(seq );
           // }
            
	},
	
	createDealButtons : function(){
		if (this.playerTwoCardHandLeft && this.playertwoCardHandRight) {
			this.menuDealButton.setVisible(true);
		}
		/*else{
			this.menuDealButton.setVisible(false);
		}*/
	},
	
	/*For creating sound option Menu*/
	soundOptionMenu : function(){
		var winSize = cc.Director.getInstance().getWinSize();
		var soundButtonOn = cc.Sprite.createWithSpriteFrameName("sound_on.png");
		var soundButtonOff = cc.Sprite.createWithSpriteFrameName("sound_off.png");
		soundButtonOn = cc.MenuItemSprite.create(soundButtonOn);
		soundButtonOff = cc.MenuItemSprite.create(soundButtonOff);
        var soundButton = cc.MenuItemToggle.create(soundButtonOn,soundButtonOff,this.soundControl);
         //item2.setCallback( this.onModeControl );
		this.menuSoundButtonOn = cc.Menu.create(soundButton);
		this.addChild(this.menuSoundButtonOn);
		this.menuSoundButtonOn.setPosition(winSize.width / 2, g_soundMenu);
	},
	soundControl : function(){
		if(audioPlaying == true){
			audioPlaying = false;
			cc.AudioEngine.getInstance().pauseAllEffects();
		}
		else if(audioPlaying == false){
			audioPlaying = true;
			cc.AudioEngine.getInstance().resumeAllEffects();
		}
		
	},
	getNewGameButton:function(){
		var winSize = cc.Director.getInstance().getWinSize();
		var newButton = cc.Sprite.createWithSpriteFrameName("new.png");
		var newButton = cc.MenuItemSprite.create(newButton,null, null, this.onNewgameButton, this);
		this.menuNewButton = cc.Menu.create(newButton);
		this.menuNewButton.alignItemsHorizontallyWithPadding(10);
        this.addChild(this.menuNewButton);
        this.menuNewButton.setPosition(winSize.width / 2, g_bitcoinPositions.newbtn.x);
        this.menuDealButton.setVisible(false);
	},
    dealGame : function(){	
			//g_gameStatus = false;
    		// alert(g_cardShuflingStatus);
    		if(g_cardShuflingStatus == true) { // alert(g_cardShuflingStatus);
    			return;
    		} 
			this.flipPlayerCard();
			//this.removeChild(this.menuDealButton);
	}, 
	
	/* Player cards animation 
	 * TODO remove conditions and set array  
	 * 
	*/
	flipPlayerCard : function(){  
        
		//console.log(g_playerSelectedCards);
		var i =0;
		var j =0;
		g_playerTwoCards = [];
		g_playerFiveCards = [];
		this.animationStartCard = null;
		this.menuDealButton.setVisible(false);
		//var indexOfRight = g_playerFiveCards.indexOf(this.playertwoCardHandRight.card_id);
		// g_playerFiveCards.splice(indexOfRight, 1);
		//var indexOfLeft = g_playerFiveCards.indexOf(this.playerTwoCardHandLeft.card_id);
		// g_playerFiveCards.splice(indexOfLeft, 1);	
        for (i=0;i<=6;i++){
        	if(this.playerTwoCardHandLeft.card_id!=g_playerSelectedCards[i] && this.playertwoCardHandRight.card_id!=g_playerSelectedCards[i]){
        		g_playerFiveCards[j] = g_playerSelectedCards[i];
        		j++;
        	}
        	
        }
		//console.log(g_playerFiveCards);
		/*console.log(indexOfRight);
		console.log(indexOfLeft);*/
		//console.log(g_playerSelectedCards);
		
		g_playerTwoCards.push(this.playerTwoCardHandLeft.card_id);
		g_playerTwoCards.push(this.playertwoCardHandRight.card_id);
		
		//g_playerFiveCards = g_playerSelectedCards;
              //  g_playerFiveCards =['c7','s7','h14','s13','h3'];
                  // g_playerFiveCards =['c7','s8','jo15','s10','h11'];
                  // g_playerFiveCards =['c10','c11','jo15','c12','c14'];
		//console.log(g_playerSelectedCards);
                
              //  alert(g_playerFiveCards+' / '+g_playerTwoCards);
              // alert(g_playerTwoCards);

               // alert(g_playerFiveCards+' / '+g_playerTwoCards);
               getPlayerCardResult();
               if (!checkHighestSecondHighestValidation()) {                   
                   this.fiveTwoValidationTxt.setString(g_langObj.twoCardValidation);
                   this.fiveTwoValidationTxt.setVisible(true); 
                   g_playerTwoCards = [];
           		   g_playerFiveCards = [];
               //    g_playerTwoCards = [];
                   return;
               }

               
               getDelearCardResult();

               

               

		/*FOR PLAYER CARDS SECTION*/
		var moveFirst1 = cc.MoveTo.create(0.2, cc.p(g_cardsPositions.playerCardSlot2.width, g_cardsPositions.playerCardSlot2.height));
		var moveSecond = cc.MoveTo.create(0.2, cc.p(g_cardsPositions.playerCardSlot3.width, g_cardsPositions.playerCardSlot3.height));
        var moveThrid = cc.MoveTo.create(0.2, cc.p(g_cardsPositions.playerCardSlot4.width, g_cardsPositions.playerCardSlot4.height));
        var moveFourth = cc.MoveTo.create(0.2, cc.p(g_cardsPositions.playerCardSlot5.width, g_cardsPositions.playerCardSlot5.height));
        var moveFifth = cc.MoveTo.create(0.2, cc.p(g_cardsPositions.playerCardSlot6.width, g_cardsPositions.playerCardSlot6.height));
        var moveSixth = cc.MoveTo.create(0.2, cc.p(g_cardsPositions.flippedTwoHandCard.width,g_cardsPositions.flippedTwoHandCard.height));
        var moveSeventh = cc.MoveTo.create(0.3, cc.p(g_cardsPositions.playerCardSlectedLeft.width,g_cardsPositions.playerCardSlectedLeft.height));
        var moveEighth = cc.MoveTo.create(0.3, cc.p(g_cardsPositions.playerCardSlectedRight.width,g_cardsPositions.playerCardSlectedRight.height));
        //console.log(g_cardsPositions.playerCardSlot6);
        //var actionTo = cc.RotateTo.create(0.1, -20);

        var actionFirst = cc.TargetedAction.create(g_selectedPlayerCardsObj[g_playerFiveCards[0]], moveFirst1);
        var actionSecond = cc.TargetedAction.create(g_selectedPlayerCardsObj[g_playerFiveCards[1]], moveSecond);
        var actionThird = cc.TargetedAction.create(g_selectedPlayerCardsObj[g_playerFiveCards[2]], moveThrid);
        var actionFourth =  cc.TargetedAction.create(g_selectedPlayerCardsObj[g_playerFiveCards[3]], moveFourth);
        var actionFifth = cc.TargetedAction.create(g_selectedPlayerCardsObj[g_playerFiveCards[4]], moveFifth);
        
        var actionEighth = cc.TargetedAction.create(g_selectedPlayerCardsObj[g_playerTwoCards[0]], moveSeventh);
        var actionNinth = cc.TargetedAction.create(g_selectedPlayerCardsObj[g_playerTwoCards[1]], moveEighth);
        
		if(this.playerTwoCardHandLeft!=this.menuPlayerSlotFirst && this.playertwoCardHandRight!=this.menuPlayerSlotFirst ){
			this.animationStartCard = g_cardsPositions.playerCardSlot1;
			this.animationStartCardObj = this.menuPlayerSlotFirst;		
		}
		else if(this.playerTwoCardHandLeft!=this.menuPlayerSlotSec && this.playertwoCardHandRight!=this.menuPlayerSlotSec){
			this.animationStartCard = g_cardsPositions.playerCardSlot2;
			this.animationStartCardObj = this.menuPlayerSlotSec;
		}
		else if(this.playerTwoCardHandLeft!=this.menuPlayerSlotThird && this.playertwoCardHandRight!=this.menuPlayerSlotThird){
			this.animationStartCard = g_cardsPositions.playerCardSlot3;
			this.animationStartCardObj = this.menuPlayerSlotThird;
		}
		
		/*Flip card for animation start card*/
		this.flippedCard = cc.Sprite.createWithSpriteFrameName('back_card.png');
   	    this.flippedCard.setPosition(new cc.Point(this.animationStartCard.width, this.animationStartCard.height));
        this.addChild(this.flippedCard); 
        
        /*Flip card for two card left hand card*/
        this.flippedCardTwoCardHandLeft = cc.Sprite.createWithSpriteFrameName('back_card.png');
   	    this.flippedCardTwoCardHandLeft.setPosition(new cc.Point(this.playerTwoCardHandLeft._position._x,this.playerTwoCardHandLeft._position._y));
        this.addChild(this.flippedCardTwoCardHandLeft);
        this.flippedCardTwoCardHandLeft.setVisible(false);
        
        /*Flip card for two card Right hand card*/
        this.flippedCardTwoCardHandRight = cc.Sprite.createWithSpriteFrameName('back_card.png');
   	    this.flippedCardTwoCardHandRight.setPosition(new cc.Point(this.playerTwoCardHandLeft._position._x,this.playerTwoCardHandLeft._position._y));
        this.addChild(this.flippedCardTwoCardHandRight);
        this.flippedCardTwoCardHandRight.setVisible(false);
        
        
        var moveFirst = cc.MoveTo.create(0.3, cc.p(g_cardsPositions.playerCardSlot4.width, g_cardsPositions.playerCardSlot4.height));
		var moveSecond = cc.MoveTo.create(0.3, cc.p(g_cardsPositions.playerFlipCardOrigin.width,g_cardsPositions.playerFlipCardOrigin.height));
		var actionSixth = cc.TargetedAction.create(this.flippedCardTwoCardHandLeft, moveSixth);	
        var actionSeventh = cc.TargetedAction.create(this.flippedCardTwoCardHandRight, moveSixth);

	    var seq = cc.Sequence.create(cc.CallFunc.create(this.getAnimationStartCardInvisible, this),moveFirst,cc.CallFunc.create(this.getSecondCardInvisible, this),cc.CallFunc.create(this.getThirdCardInvisible, this),cc.CallFunc.create(this.getFouthCardInvisible, this),cc.CallFunc.create(this.getFifthCardInvisible, this),moveSecond,cc.CallFunc.create(this.getFirstFiveCardVisible, this),actionFirst,cc.CallFunc.create(this.getSecondFiveCardVisible, this),actionSecond,cc.CallFunc.create(this.getThirdFiveCardVisible, this),actionThird,cc.CallFunc.create(this.getFourthFiveCardVisible, this),actionFourth,cc.CallFunc.create(this.getFifthFiveCardVisible, this),actionFifth,cc.CallFunc.create(this.getBackCardInvisible, this),cc.CallFunc.create(this.playerTwoCardHandLeftInvisible, this),cc.CallFunc.create(this.playerTwoCardLeftFlipVisible, this),   actionSixth,cc.CallFunc.create(this.playerTwoCardHandLeftCardMove, this),cc.CallFunc.create(this.playerTwoCardHandRightInvisible, this),cc.CallFunc.create(this.playerTwoCardRightFlipVisible, this),actionSeventh,cc.CallFunc.create(this.playerTwoCardHandRightCardMove, this),cc.CallFunc.create(this.playerTwoCardLeftFlipInvisible, this),cc.CallFunc.create(this.playerTwoCardHandLeftVisible, this),actionEighth,cc.CallFunc.create(this.playerTwoCardRightFlipInvisible, this),cc.CallFunc.create(this.playerTwoCardHandRightVisible, this),actionNinth,cc.CallFunc.create(this.getNewGameButton, this),cc.CallFunc.create(this.dealerCardsAnimation, this));
		this.flippedCard.runAction(seq);    
	  },
	  
	  getAnimationStartCardInvisible: function() { 
		  
		  g_selectedPlayerCardsObj[g_playerFiveCards[0]].setVisible(false);
    	  g_selectedPlayerCardsObj[g_playerFiveCards[0]].setPosition(new cc.Point(g_cardsPositions.playerFlipCardOrigin.width,g_cardsPositions.playerFlipCardOrigin.height));
      },
      
       getSecondCardInvisible: function() {
    	  g_selectedPlayerCardsObj[g_playerFiveCards[1]].setVisible(false);
    	  g_selectedPlayerCardsObj[g_playerFiveCards[1]].setPosition(new cc.Point(g_cardsPositions.playerFlipCardOrigin.width,g_cardsPositions.playerFlipCardOrigin.height));
       },

       getThirdCardInvisible: function() {
    	   g_selectedPlayerCardsObj[g_playerFiveCards[2]].setVisible(false);
     	   g_selectedPlayerCardsObj[g_playerFiveCards[2]].setPosition(new cc.Point(g_cardsPositions.playerFlipCardOrigin.width,g_cardsPositions.playerFlipCardOrigin.height));
       },

       getFouthCardInvisible: function() {
    	   g_selectedPlayerCardsObj[g_playerFiveCards[3]].setVisible(false);
     	   g_selectedPlayerCardsObj[g_playerFiveCards[3]].setPosition(new cc.Point(g_cardsPositions.playerFlipCardOrigin.width,g_cardsPositions.playerFlipCardOrigin.height));
       },

       getFifthCardInvisible: function() {
    	   g_selectedPlayerCardsObj[g_playerFiveCards[4]].setVisible(false);
     	   g_selectedPlayerCardsObj[g_playerFiveCards[4]].setPosition(new cc.Point(g_cardsPositions.playerFlipCardOrigin.width,g_cardsPositions.playerFlipCardOrigin.height))
           //console.log(g_selectedPlayerCardsObj[g_playerFiveCards[4]]);
       },
       
       getBackCardInvisible:function(){
    	   this.flippedCard.setVisible(false); 
       },
       
       getFirstFiveCardVisible:function(){
    	   // alert('kkk');
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   g_selectedPlayerCardsObj[g_playerFiveCards[0]].setVisible(true);
    	   // g_cardShuflingStatus = true; 
    	   
       },
       
       getSecondFiveCardVisible:function(){
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   g_selectedPlayerCardsObj[g_playerFiveCards[1]].setVisible(true);
       },
       
       getThirdFiveCardVisible:function(){
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   g_selectedPlayerCardsObj[g_playerFiveCards[2]].setVisible(true);
       },
       
       getFourthFiveCardVisible:function(){
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   g_selectedPlayerCardsObj[g_playerFiveCards[3]].setVisible(true);
       },
       
       getFifthFiveCardVisible:function(){
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   
    	   g_selectedPlayerCardsObj[g_playerFiveCards[4]].setVisible(true);
       },
       
       playerTwoCardHandLeftCardMove:function(){
    	   this.playerTwoCardHandLeft.setPosition(new cc.Point(g_cardsPositions.flippedTwoHandCard.width,g_cardsPositions.flippedTwoHandCard.height));
       },
       
       playerTwoCardHandRightCardMove:function(){
    	   this.playertwoCardHandRight.setPosition(new cc.Point(g_cardsPositions.flippedTwoHandCard.width,g_cardsPositions.flippedTwoHandCard.height));
       },
       
       playerTwoCardHandLeftVisible:function(){
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   this.playerTwoCardHandLeft.setVisible(true);
       },
       
       playerTwoCardHandRightVisible:function(){
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   this.playertwoCardHandRight.setVisible(true);
       },
       
       playerTwoCardHandLeftInvisible:function(){
    	   this.playerTwoCardHandLeft.setVisible(false);
       },
       
       playerTwoCardHandRightInvisible:function(){
    	   this.playertwoCardHandRight.setVisible(false);
       },
       playerTwoCardLeftFlipVisible:function(){
    	   this.flippedCardTwoCardHandLeft.setVisible(true);
       },
       
       playerTwoCardRightFlipVisible:function(){
    	   this.flippedCardTwoCardHandRight.setVisible(true);
       },
       
       playerTwoCardLeftFlipInvisible:function(){
    	   this.flippedCardTwoCardHandLeft.setVisible(false);
       },
       
       playerTwoCardRightFlipInvisible:function(){
    	   this.flippedCardTwoCardHandRight.setVisible(false);
       },
       /*Animation of dealer cards */
       dealerCardsAnimation:function(){
    	   
    	 
    	   var dealerCardMoveFirst = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot6.width, g_cardsPositions.delearCardSlot6.height));
    	   var dealerCardMoveSecond = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot5.width, g_cardsPositions.delearCardSlot5.height));
    	   var dealerCardMoveThird = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot4.width, g_cardsPositions.delearCardSlot4.height));
    	   var dealerCardMoveFourth = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot3.width, g_cardsPositions.delearCardSlot3.height));
    	   var dealerCardMoveFifth = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot2.width, g_cardsPositions.delearCardSlot2.height));
    	   var dealerCardMoveSixth = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot1.width, g_cardsPositions.delearCardSlot1.height));
    	   var dealerCardMoveSeventh = cc.MoveTo.create(0.4, cc.p(g_cardsPositions.delearCardSlotSelectedLeft.width, g_cardsPositions.delearCardSlotSelectedLeft.height));
    	   var dealerCardMoveEighth = cc.MoveTo.create(0.4, cc.p(g_cardsPositions.delearCardSlotSelectedRight.width, g_cardsPositions.delearCardSlotSelectedRight.height));
    	   var dealerCardMoveNinth = cc.MoveTo.create(0.3, cc.p(g_cardsPositions.delearCardSlot2.width, g_cardsPositions.delearCardSlot2.height));
    	   var dealerCardMoveTenth = cc.MoveTo.create(0.3, cc.p(g_cardsPositions.delearCardSlot3.width, g_cardsPositions.delearCardSlot3.height));
    	   var dealerCardMoveEleventh = cc.MoveTo.create(0.3, cc.p(g_cardsPositions.delearCardSlot4.width, g_cardsPositions.delearCardSlot4.height));
    	   var dealerCardMoveTwelfth = cc.MoveTo.create(0.3, cc.p(g_cardsPositions.delearCardSlot5.width, g_cardsPositions.delearCardSlot5.height));
    	   var dealerCardMoveThirteenth = cc.MoveTo.create(0.3, cc.p(g_cardsPositions.delearCardSlot6.width, g_cardsPositions.delearCardSlot6.height));
    	   
    	   var dealerCardActionFirst =  cc.TargetedAction.create(this.delearSlotSeventhTemp, dealerCardMoveFirst);
    	   var dealerCardActionSecond =  cc.TargetedAction.create(this.delearSlotSixthTemp, dealerCardMoveSecond);
    	   var dealerCardActionThird =  cc.TargetedAction.create(this.delearSlotFifthTemp, dealerCardMoveThird);
    	   var dealerCardActionFourth =  cc.TargetedAction.create(this.delearSlotFourthTemp, dealerCardMoveFourth);
    	   var dealerCardActionFifth =  cc.TargetedAction.create(this.delearSlotThirdTemp, dealerCardMoveFifth);
    	   var dealerCardActionSixth =  cc.TargetedAction.create(this.delearSlotSecTemp, dealerCardMoveSixth);
    	   var dealerCardActionSeventh =  cc.TargetedAction.create(g_selectedDelearCardsObj[g_delearTwoCards[0]], dealerCardMoveSeventh);
    	   var dealerCardActionEighth = cc.TargetedAction.create(g_selectedDelearCardsObj[g_delearTwoCards[1]], dealerCardMoveEighth);
    	   var dealerCardActionNinth = cc.TargetedAction.create(g_selectedDelearCardsObj[g_delearFiveCards[0]], dealerCardMoveNinth);
    	   var dealerCardActionTenth = cc.TargetedAction.create(g_selectedDelearCardsObj[g_delearFiveCards[1]], dealerCardMoveTenth);
    	   var dealerCardActionEleventh = cc.TargetedAction.create(g_selectedDelearCardsObj[g_delearFiveCards[2]], dealerCardMoveEleventh);
    	   var dealerCardActionTwelfth = cc.TargetedAction.create(g_selectedDelearCardsObj[g_delearFiveCards[3]], dealerCardMoveTwelfth);
    	   var dealerCardActionThirteenth = cc.TargetedAction.create(g_selectedDelearCardsObj[g_delearFiveCards[4]], dealerCardMoveThirteenth);
    	   
    	   var dealerCardSeq = cc.Sequence.create(dealerCardActionFirst,cc.CallFunc.create(this.seventhDealerCardInvisible, this),dealerCardActionSecond,cc.CallFunc.create(this.sixthDealerCardInvisible, this),dealerCardActionThird,cc.CallFunc.create(this.fifthDealerCardInvisible, this),dealerCardActionFourth,cc.CallFunc.create(this.fourthDealerCardInvisible, this),dealerCardActionFifth,cc.CallFunc.create(this.thirdDealerCardInvisible, this),dealerCardActionSixth,cc.CallFunc.create(this.secondDealerCardInvisible, this),cc.CallFunc.create(this.firstDealerCardMove, this),cc.CallFunc.create(this.dealerFirstTwoCardHandVisible, this),dealerCardActionSeventh,cc.CallFunc.create(this.dealerSecondTwoCardHandVisible, this),dealerCardActionEighth,cc.CallFunc.create(this.dealerFirstFiveCardHandVisible, this),dealerCardActionNinth,cc.CallFunc.create(this.dealerSecondtFiveCardHandVisible, this),dealerCardActionTenth,cc.CallFunc.create(this.dealerThirdFiveCardHandVisible, this),dealerCardActionEleventh,cc.CallFunc.create(this.dealerFourthFiveCardHandVisible, this),dealerCardActionTwelfth,cc.CallFunc.create(this.dealerFifthFiveCardHandVisible, this),dealerCardActionThirteenth,cc.CallFunc.create(this.firstDealerCardInvisible, this), cc.CallFunc.create(this.setResults, this))
    	   this.delearSlotSeventh.runAction(dealerCardSeq);   
       },
       seventhDealerCardInvisible:function(){
    	   this.delearSlotSeventhTemp.setVisible(false);
    	   this.delearSlotSeventhTemp.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
    	   this.delearSlotSeventh.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
       },
       
       sixthDealerCardInvisible:function(){
    	   this.delearSlotSixthTemp.setVisible(false);
    	   this.delearSlotSixthTemp.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
    	   this.delearSlotSixth.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
       },
       fifthDealerCardInvisible:function(){
    	   this.delearSlotFifthTemp.setVisible(false);
    	   this.delearSlotFifthTemp.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
    	   this.delearSlotFifth.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
       },
       fourthDealerCardInvisible:function(){
    	   this.delearSlotFourthTemp.setVisible(false);
    	   this.delearSlotFourthTemp.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
    	   this.delearSlotFourth.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
       },
       thirdDealerCardInvisible:function(){
    	   this.delearSlotThirdTemp.setVisible(false);
    	   this.delearSlotThirdTemp.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
    	   this.delearSlotThird.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
       },
       secondDealerCardInvisible:function(){
    	   this.delearSlotSecTemp.setVisible(false);
    	   this.delearSlotSecTemp.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
    	   this.delearSlotSec.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
       },
       firstDealerCardMove:function(){
    	  // this.delearSlotSecTemp.setVisible(false);
    	   //this.delearSlotSecTemp.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
    	   this.delearSlotFirst.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
       },
       firstDealerCardInvisible:function(){
     	    this.delearSlotFirstTemp.setVisible(false);
     	   //this.delearSlotSecTemp.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
     	   //this.delearSlotFirst.setPosition(new cc.Point(g_cardsPositions.delearCardSlot1.width,g_cardsPositions.delearCardSlot1.height));
        },
       dealerFirstTwoCardHandVisible:function(){
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	   }
    	   g_selectedDelearCardsObj[g_delearTwoCards[0]].setVisible(true);
       },
       dealerSecondTwoCardHandVisible:function(){
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   g_selectedDelearCardsObj[g_delearTwoCards[1]].setVisible(true);
       },
       dealerFirstFiveCardHandVisible:function(){
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   g_selectedDelearCardsObj[g_delearFiveCards[0]].setVisible(true);
       },
       dealerSecondtFiveCardHandVisible:function(){
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   g_selectedDelearCardsObj[g_delearFiveCards[1]].setVisible(true);
       },
       dealerThirdFiveCardHandVisible:function(){
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   g_selectedDelearCardsObj[g_delearFiveCards[2]].setVisible(true);
       },
       dealerFourthFiveCardHandVisible:function(){
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   g_selectedDelearCardsObj[g_delearFiveCards[3]].setVisible(true);
       },
       dealerFifthFiveCardHandVisible:function(){
    	   if(audioPlaying == true){
    		   g_audioEngine.playEffect(res.cardSelect_mp3);
    	   }
    	   g_selectedDelearCardsObj[g_delearFiveCards[4]].setVisible(true);
       },
       getCardsOriginalPosition: function(cardObj) {      
          if(cardObj == this.menuPlayerSlotFirst) {
              return {x:g_cardsPositions.playerCardSlot1.width,y:g_cardsPositions.playerCardSlot1.height};
          }
          else if (cardObj == this.menuPlayerSlotSec) {
              return {x:g_cardsPositions.playerCardSlot2.width,y:g_cardsPositions.playerCardSlot2.height};
          }
          else if(cardObj == this.menuPlayerSlotThird) {
              return {x:g_cardsPositions.playerCardSlot3.width,y:g_cardsPositions.playerCardSlot3.height};
          }
          else if (cardObj == this.menuPlayerSlotFourth) {
              return {x:g_cardsPositions.playerCardSlot4.width,y:g_cardsPositions.playerCardSlot4.height};
          }
          else if (cardObj == this.menuPlayerSlotFifth) {
              return {x:g_cardsPositions.playerCardSlot5.width,y:g_cardsPositions.playerCardSlot5.height};
          }
          else if(cardObj == this.menuPlayerSlotSixth) {
              return {x:g_cardsPositions.playerCardSlot6.width,y:g_cardsPositions.playerCardSlot6.height};
          }
          else if (cardObj == this.menuPlayerSlotSeventh) {
              return {x:g_cardsPositions.playerCardSlot7.width,y:g_cardsPositions.playerCardSlot7.height};
          }
          
       },
        movePlayerCard: function(cardObj, positionObject) {
    	    //console.log(cardObj);
        	//alert(g_playerFiveCards.length);
        	//alert(g_playerFiveCards.length);
    	   
           if(g_playerFiveCards.length!= 0 || g_cardShuflingStatus == true) {
        	   return;
           }
           var moveProgress = null;
           this.fiveTwoValidationTxt.setVisible(false);
           var deselected = false;
           if(cardObj == this.playerTwoCardHandLeft) { 
               deselected = true;
               this.playerTwoCardHandLeft = '';
               this.menuDealButton.setVisible(false);
           }
           else if(cardObj == this.playertwoCardHandRight) {
               deselected = true;
               this.playertwoCardHandRight = '';
               this.menuDealButton.setVisible(false);
           }
           
           if (deselected) {
        	   g_moveProgress=true;
               var pos = this.getCardsOriginalPosition(cardObj);
               moveProgress = cc.MoveTo.create(0.2, cc.p(pos.x, pos.y + g_cardsPositions.playerCardMoveDist));
               var actionMove = cc.TargetedAction.create(cardObj, moveProgress);
               var moveEnd = cc.MoveTo.create(0.2, cc.p(pos.x, pos.y));
               var actionEnd = cc.TargetedAction.create(cardObj, moveEnd);
               var seq = cc.Sequence.create(actionMove, actionEnd,cc.CallFunc.create(this.cardMoveCompletion, this));
               cardObj.runAction(seq );
               return;
           }
           else if (this.playerTwoCardHandLeft && this.playertwoCardHandRight) {
              return;
           }
           else if (!this.playerTwoCardHandLeft) { 
               
               moveProgress = cc.MoveTo.create(0.2, cc.p(g_cardsPositions.playerCardSlectedLeft.width, g_cardsPositions.playerCardSlectedLeft.height));
               this.playerTwoCardHandLeft = cardObj;
               this.twoCardHandLeftOriginalXPosition = cardObj._position._x;
               this.twoCardHandLeftOriginalYPosition = cardObj._position._y;
               
           }
           else if (!this.playertwoCardHandRight) {
               moveProgress = cc.MoveTo.create(0.2, cc.p(g_cardsPositions.playerCardSlectedRight.width, g_cardsPositions.playerCardSlectedRight.height));   
               this.playertwoCardHandRight = cardObj;
               this.twoCardHandRightOriginalXPosition = cardObj._position._x;
               this.twoCardHandRightOriginalYPosition = cardObj._position._y;
           }
           g_moveProgress=true;
           var moveStart = cc.MoveTo.create(0.2, cc.p(positionObject.width, positionObject.height + g_cardsPositions.playerCardMoveDist));
           var actionStart = cc.TargetedAction.create(cardObj, moveStart);
           var actionMove = cc.TargetedAction.create(cardObj, moveProgress);
           var seq = cc.Sequence.create(actionStart, actionMove,cc.CallFunc.create(this.cardMoveCompletion, this));
           cardObj.runAction(seq );
           this.createDealButtons();
        },
        cardMoveCompletion:function(){
        	//alert('hai');
        	g_moveProgress = false;
        },
        playerCardFirstClick: function() {
           if(g_moveProgress==false){
        	   this.movePlayerCard(this.menuPlayerSlotFirst, g_cardsPositions.playerCardSlot1);
           }
        },

        playerCardSecClick: function() {
        	if(g_moveProgress==false){
        		this.movePlayerCard(this.menuPlayerSlotSec, g_cardsPositions.playerCardSlot2);
        	}	
        },

        playerCardThirdClick: function() {
        	if(g_moveProgress==false){
        		this.movePlayerCard(this.menuPlayerSlotThird, g_cardsPositions.playerCardSlot3);
        	}	
        },

        playerCardFourthClick: function() {
           if(g_moveProgress==false){
        	   this.movePlayerCard(this.menuPlayerSlotFourth, g_cardsPositions.playerCardSlot4);  
           }
        },

        playerCardFifthClick: function() {
        	if(g_moveProgress==false){
        		this.movePlayerCard(this.menuPlayerSlotFifth, g_cardsPositions.playerCardSlot5);
        	}	
        },

        playerCardSixthClick: function() {
        	if(g_moveProgress==false){
        		this.movePlayerCard(this.menuPlayerSlotSixth, g_cardsPositions.playerCardSlot6);
        	}	
        },

        playerCardSeventhClick: function() {
        	if(g_moveProgress==false){
        		this.movePlayerCard(this.menuPlayerSlotSeventh, g_cardsPositions.playerCardSlot7);
        	}
        },

        getFirstCardVisible: function() { g_cardShuflingStatus = true; 
        if(audioPlaying == true){
 		   g_audioEngine.playEffect(res.cardSelect_mp3);
 	    }
           this.menuPlayerSlotFirst.setVisible(true); 
        },

        getSecondCardVisible: function() {
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	    }
            this.menuPlayerSlotSec.setVisible(true);
        },

        getThirdCardVisible: function() {
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	    }
            this.menuPlayerSlotThird.setVisible(true);
        },

        getFouthCardVisible: function() {
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	    }
           this.menuPlayerSlotFourth.setVisible(true);
        },

        getFifthCardVisible: function() {
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	    }
           this.menuPlayerSlotFifth.setVisible(true);
        },

        getSixthCardVisible: function() {
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	    }
           this.menuPlayerSlotSixth.setVisible(true);
        },

        getSeventhCardVisible: function() {
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	    }
           this.menuPlayerSlotSeventh.setVisible(true);
        },

        hideBlinkCard: function() {
            this.blinkCard.setVisible(false);
            this.delearCardsShift();
        },

        rearangeCards: function(cardData) {
           var cardsLength = cardData.length - 1;
           var toSwap = 0;
           var tmpCard = '';
           var toSwapNext = 0;
           for (var i = cardsLength; i > 1; i--) {
                toSwap = Math.floor(Math.random() * i);
                // console.log(toSwap+'   '+i);
                tmpCard = cardData[i];
                cardData[i] =  cardData[toSwap];
                cardData[toSwap] = tmpCard;

                /*toSwapNext = Math.floor(Math.random() * toSwap);
                // console.log(toSwap+'   '+i);
                tmpCard = g_cardValues[toSwap];
                g_cardValues[toSwap] =  g_cardValues[toSwapNext];
                g_cardValues[toSwapNext] = tmpCard;*/
           }
           return cardData;
          //  alert(g_cardValues);
        },

        resetGame: function() {
           this.removeChild(this.menuPlayerSlotFirst);
           this.removeChild(this.menuPlayerSlotSec);
           this.removeChild(this.menuPlayerSlotThird);
           this.removeChild(this.menuPlayerSlotFourth);
           this.removeChild(this.menuPlayerSlotFifth);
           this.removeChild(this.menuPlayerSlotSixth);
           this.removeChild(this.menuPlayerSlotSeventh);
           this.removeChild(this.blinkCard);
           this.removeChild(this.delearSlotFirst);
           this.removeChild(this.delearSlotSec);
           this.removeChild(this.delearSlotThird);
           this.removeChild(this.delearSlotFourth);
           this.removeChild(this.delearSlotFifth);
           this.removeChild(this.delearSlotSixth);
           this.removeChild(this.delearSlotSeventh);
           this.removeChild(this.blinkCardDelear);
           this.removeChild(this.delearSlotFirstTemp);
           this.removeChild(this.delearSlotSecTemp);
           this.removeChild(this.delearSlotThirdTemp);
           this.removeChild(this.delearSlotFourthTemp);
           this.removeChild(this.delearSlotFifthTemp);
           this.removeChild(this.delearSlotSixthTemp);
           this.removeChild(this.delearSlotSeventhTemp);
           //this.removeChild(this.resultFiveCardText);
           //this.removeChild(this.resultTwoCardText);
           //this.removeChild(this.menuDealButton);
           //this.removeChild(this.fiveTwoValidationTxt);
	   this.resultTxt.setVisible(false);
	   this.fiveTwoValidationTxt.setVisible(false);
	   this.resultTwoCardText.setVisible(false);
	   this.resultFiveCardText.setVisible(false);
	   
         //  this.removeChild(this.resultTxt);
	       g_wincoinPositions.bitcoin.y = 538.5;
           g_selectedPlayerCardsObj = [];
           g_selectedDelearCardsObj = []; 
           g_playerSelectedCards = [];
           g_delearSelectedCards = [];
           g_playerTwoCards = [];
           g_delearTwoCards = []; 
           g_playerFiveCards = [];
           g_delearFiveCards = [];
           g_delearFiveRankObj = [];
           g_delearTwoRankObj = [];
           g_playerFiveRankObj = [];
           g_playerTwoRankObj = [];
           g_randomCards = [];
           g_cardShuflingStatus = false;
           this.playerTwoCardHandLeft = null;
           this.playertwoCardHandRight = null;
           
        },      
	onSelectBitcoin1 : function() { 	
		g_bitMovePos = 11;
		this.onSelectBitcoin(g_bitValue1);
		
		//this.bitcoinvalidation(g_bitValue1);
	},
	onSelectBitcoin2 : function() { 
		g_bitMovePos = -44.5;
		this.onSelectBitcoin(g_bitValue2);
		//this.bitcoinvalidation(g_bitValue2);
	},
	onSelectBitcoin3 : function() { 	
		g_bitMovePos = -100.5;
		this.onSelectBitcoin(g_bitValue3);
		//this.bitcoinvalidation(g_bitValue3);
	},
	onSelectBitcoin4 : function() { 
		g_bitMovePos = -60;
		this.onSelectBitcoin(g_bitValue4);
		//this.bitcoinvalidation(g_bitValue4);
	},
	onSelectBitcoin : function(val) { 
		
		if(g_gameStatus == true){
			return false;
		}
		if(g_newgame == true ) {
			this.removeBitcoin(g_createdBitCoins['1'].length,g_createdBitCoins['1']);
			this.removeBitcoin(g_createdBitCoins['0.1'].length,g_createdBitCoins['0.1']);
			this.removeBitcoin(g_createdBitCoins['0.01'].length,g_createdBitCoins['0.01']);
			this.removeBitcoin(g_createdBitCoins['0.001'].length,g_createdBitCoins['0.001']);
			g_createdBitCoins['1'] = [];
			g_createdBitCoins['0.1'] = [];
			g_createdBitCoins['0.01'] = [];
			g_createdBitCoins['0.001'] = [];
			//this.removeChild(this.menuRebetButton);
			g_bitValue = 0;
			g_bitSelectedVal = 0;
			//this.removeChild(this.menuDealButton);
			//this.removeChild(this.menuNewButton);
			//this.createbuttons();
			
		}
		this.removeChild(this.menuRebetButton);
		g_newgame = false;
		if(g_bitValue == 0) {
			this.createbuttons();
		}
		
		//this.createbuttons();
		/*FIRST BIT COIN*/
		this.bitCoinFirst = cc.Sprite.createWithSpriteFrameName("bitcoin_.001.png");
    		this.bitCoinFirst.setPosition(g_bitcoinPositions.bitcoin_0001.x, g_bitcoinPositions.bitcoin_0001.y);
    		/*SECOND BIT COIN*/
    		this.bitCoinSecond = cc.Sprite.createWithSpriteFrameName("bitcoin_.01.png");
		this.bitCoinSecond.setPosition(g_bitcoinPositions.bitcoin_001.x, g_bitcoinPositions.bitcoin_001.y);
    		/*THIRD BIT COIN*/
		this.bitCoinThird = cc.Sprite.createWithSpriteFrameName("bitcoin_.1.png");
		this.bitCoinThird.setPosition(g_bitcoinPositions.bitcoin_01.x, g_bitcoinPositions.bitcoin_01.y);
    		/*FOURTH BIT COIN*/
		this.bitCoinFourth = cc.Sprite.createWithSpriteFrameName("bitcoin_1.png");
		this.bitCoinFourth.setPosition(g_bitcoinPositions.bitcoin_1.x, g_bitcoinPositions.bitcoin_1.y);
		
		g_bitSelectedVal = Number(g_bitSelectedVal) + Number(val);

			if(val ==1 && g_createdBitCoins['0.1'].length==0 && g_createdBitCoins['0.01'].length==0 && g_createdBitCoins['0.001'].length==0 && g_createdBitCoins['1'].length==0 && g_bitSelectedVal <= 1){
				var pos = g_bitPosAdd+g_bitcoinPos;
				g_bitcoinPos = g_bitcoinPos +g_bitPosChange;
				var s = cc.Director.getInstance().getWinSize();
				var move = cc.MoveBy.create(.5, cc.p(g_bitMovePos, pos));
				this.addChild(this.bitCoinFourth,1);
				g_createdBitCoins['1'].push(this.bitCoinFourth);
				this.bitCoinFourth.runAction(move);	
				this.bitCoinValidation();	
				this.betAmount();
			 }
			else if(val == 0.1 && g_createdBitCoins['1'].length==0 && g_bitSelectedVal <= 1){
				//var pos = g_bitPosAdd+this.g_bitcoinPos; 

				var pos = g_bitPosAdd+ g_bitcoinPos;
				g_bitcoinPos = g_bitcoinPos + g_bitPosChange;

				var s = cc.Director.getInstance().getWinSize();
				var move = cc.MoveBy.create(.5, cc.p(g_bitMovePos, pos));
				this.addChild(this.bitCoinThird,1);
				g_createdBitCoins['0.1'].push(this.bitCoinThird);
				this.bitCoinThird.runAction(move);	
				this.bitCoinValidation();	
				this.betAmount();
			}
			else if(val == 0.01 && g_createdBitCoins['1'].length==0 && g_bitSelectedVal <= 1){	
				
				var pos = g_bitPosAdd+ g_bitcoinPos;
				g_bitcoinPos = g_bitcoinPos + g_bitPosChange;
				var s = cc.Director.getInstance().getWinSize();
				var move = cc.MoveBy.create(.5, cc.p(g_bitMovePos, pos));
				this.addChild(this.bitCoinSecond,1);
				g_createdBitCoins['0.01'].push(this.bitCoinSecond);
				this.bitCoinSecond.runAction(move);	
				this.bitCoinValidation();	
				this.betAmount();
			}
			else if(val == 0.001 && g_createdBitCoins['1'].length==0 && g_bitSelectedVal <= 1){
				//console.log(g_bitcoinPos);
				var pos = g_bitPosAdd + g_bitcoinPos;
				g_bitcoinPos = g_bitcoinPos + g_bitPosChange;
				
				var s = cc.Director.getInstance().getWinSize();
				var move = cc.MoveBy.create(.5, cc.p(g_bitMovePos, pos));
				this.addChild(this.bitCoinFirst,1);
				g_createdBitCoins['0.001'].push(this.bitCoinFirst);
				this.bitCoinFirst.runAction(move);
				this.bitCoinValidation();	
				this.betAmount();
			}
			
		    else if(g_bitSelectedVal >= 1) {
		    	g_bitSelectedVal = Number(g_bitSelectedVal) - Number(val);
			//g_bitSelectedVal = Number(g_bitSelectedVal).toFixed(3);
		    	this.maximumBitCoinMessage();
		    }
		g_bitSelectedVal = Number(g_bitSelectedVal).toFixed(3);
	},
	bitCoinValidation:function(){
		var i = 0;
		
		if(g_createdBitCoins['0.001'].length==10 && g_bitSelectedVal <= 1){
			this.addAndRemoveBitCoins('0.001');
		}
		
		
		if(g_createdBitCoins['0.01'].length==10 && g_bitSelectedVal <= 1){
			this.addAndRemoveBitCoins('0.01');
			
		}
		
		if(g_createdBitCoins['0.1'].length==10 && g_bitSelectedVal <=1){
			this.addAndRemoveBitCoins('0.1');
		}


		if(g_bitSelectedVal == 1.00) {
           this.removeBitcoin(g_createdBitCoins['1'].length,g_createdBitCoins['1']);
		   this.removeBitcoin(g_createdBitCoins['0.1'].length,g_createdBitCoins['0.1']);
		   this.removeBitcoin(g_createdBitCoins['0.01'].length,g_createdBitCoins['0.01']);
		   this.removeBitcoin(g_createdBitCoins['0.001'].length,g_createdBitCoins['0.001']);
		   this.removeBitcoin(g_winCoins.length,g_winCoins);
		   g_winCoins = [];
		   g_createdBitCoins['1'] = [];
		   g_createdBitCoins['0.1'] = [];
		   g_createdBitCoins['0.01'] = [];
		   g_createdBitCoins['0.001'] = [];
		   this.addChild(this.bitCoinFourth,1);	
		   g_bitcoinPos = 5;
		   g_bitcoinPositions.origin.y = g_bitCoinRoundPostion+g_bitcoinPos;
           this.bitCoinFourth.setPosition(g_bitcoinPositions.origin.x, g_bitcoinPositions.origin.y);
		   g_createdBitCoins['1'].push(this.bitCoinFourth);
		  //g_bitcoinPos = 0;

           }
		this.placeYourBetMessage();
	},
    addDelearCard: function(obj, src) {
            obj = cc.Sprite.createWithSpriteFrameName(src);            
	    obj.setPosition(new cc.Point(g_cardsPositions.delearCardOrigin.width, g_cardsPositions.delearCardOrigin.height));
            obj.setVisible(false);
	    this.addChild(obj);
            return obj;
        },

        delearCardsShift: function() {
            this.blinkCardDelear = cc.Sprite.createWithSpriteFrameName('back_card_left_rotate.png');
            var obj = g_cardsPositions.blinkCardDelear;
            this.blinkCardDelear.setPosition(new cc.Point(obj.width, obj.height));
            this.addChild(this.blinkCardDelear);
            var moveBlinkCard = cc.MoveTo.create(0.1, cc.p(obj.downWidth, obj.downHeight));
            var moveBlinkCardBack = cc.MoveTo.create(0.1, cc.p(obj.width, obj.height));
            var blink = cc.Blink.create(0.2, 1);

            /*obj = g_cardsPositions.delearCardOrigin;
            this.delearSlotFirst = cc.Sprite.createWithSpriteFrameName(g_cardsPositions.backcard.src);            
	    this.delearSlotFirst.setPosition(new cc.Point(obj.width, obj.height));
            this.delearSlotFirst.setVisible(false);
	    this.addChild(this.delearSlotFirst);*/

            this.delearSlotFirstTemp = this.addDelearCard(this.delearSlotFirst, g_cardsPositions.backcard.src);
            this.delearSlotSecTemp = this.addDelearCard(this.delearSlotSec, g_cardsPositions.backcard.src);
            this.delearSlotThirdTemp = this.addDelearCard(this.delearSlotThird, g_cardsPositions.backcard.src);
            this.delearSlotFourthTemp = this.addDelearCard(this.delearSlotFourth, g_cardsPositions.backcard.src);
            this.delearSlotFifthTemp = this.addDelearCard(this.delearSlotFifth, g_cardsPositions.backcard.src);
            this.delearSlotSixthTemp = this.addDelearCard(this.delearSlotSixth, g_cardsPositions.backcard.src);
            this.delearSlotSeventhTemp = this.addDelearCard(this.delearSlotSeventh, g_cardsPositions.backcard.src);


            this.delearSlotFirst = this.addDelearCard(this.delearSlotFirst, g_cards[g_randomCards[7]].src);
            this.delearSlotSec = this.addDelearCard(this.delearSlotSec, g_cards[g_randomCards[8]].src);
            this.delearSlotThird = this.addDelearCard(this.delearSlotThird, g_cards[g_randomCards[9]].src);
            this.delearSlotFourth = this.addDelearCard(this.delearSlotFourth, g_cards[g_randomCards[10]].src);
            this.delearSlotFifth = this.addDelearCard(this.delearSlotFifth, g_cards[g_randomCards[11]].src);
            this.delearSlotSixth = this.addDelearCard(this.delearSlotSixth, g_cards[g_randomCards[12]].src);
            this.delearSlotSeventh = this.addDelearCard(this.delearSlotSeventh, g_cards[g_randomCards[13]].src);
            
            //console.log(this.delearSlotSeventh);
            
            
            g_delearSelectedCards.push(g_randomCards[7]);
            g_delearSelectedCards.push(g_randomCards[8]);
            g_delearSelectedCards.push(g_randomCards[9]);
            g_delearSelectedCards.push(g_randomCards[10]);
            g_delearSelectedCards.push(g_randomCards[11]);
            g_delearSelectedCards.push(g_randomCards[12]);
            g_delearSelectedCards.push(g_randomCards[13]);

            g_selectedDelearCardsObj[g_randomCards[7]] = this.delearSlotFirst;
            g_selectedDelearCardsObj[g_randomCards[8]] = this.delearSlotSec;
            g_selectedDelearCardsObj[g_randomCards[9]] = this.delearSlotThird;
            g_selectedDelearCardsObj[g_randomCards[10]] = this.delearSlotFourth;
            g_selectedDelearCardsObj[g_randomCards[11]] = this.delearSlotFifth;
            g_selectedDelearCardsObj[g_randomCards[12]] = this.delearSlotSixth;
            g_selectedDelearCardsObj[g_randomCards[13]] = this.delearSlotSeventh;
            
            delearCards.init(g_delearSelectedCards);
            
            

            var moveFirst = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot1.width, g_cardsPositions.delearCardSlot1.height));
            var moveSec = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot2.width, g_cardsPositions.delearCardSlot2.height));
            var moveThird = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot3.width, g_cardsPositions.delearCardSlot3.height));
            var moveFourth = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot4.width, g_cardsPositions.delearCardSlot4.height));
            var moveFifth = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot5.width, g_cardsPositions.delearCardSlot5.height));
            var moveSixth =  cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot6.width, g_cardsPositions.delearCardSlot6.height));
            var moveSeventh = cc.MoveTo.create(0.1, cc.p(g_cardsPositions.delearCardSlot7.width, g_cardsPositions.delearCardSlot7.height));
            
            var actionFirst =  cc.TargetedAction.create(this.delearSlotFirstTemp, moveFirst);
            var actionSec =  cc.TargetedAction.create(this.delearSlotSecTemp, moveSec);
            var actionThird =  cc.TargetedAction.create(this.delearSlotThirdTemp, moveThird);
            var actionFourth =  cc.TargetedAction.create(this.delearSlotFourthTemp, moveFourth);
            var actionFifth =  cc.TargetedAction.create(this.delearSlotFifthTemp, moveFifth);
            var actionSixth =  cc.TargetedAction.create(this.delearSlotSixthTemp, moveSixth);
            var actionSeventh =  cc.TargetedAction.create(this.delearSlotSeventhTemp, moveSeventh);


          
            var seq = cc.Sequence.create( moveBlinkCard,  blink, cc.CallFunc.create(this.getDelearFirstCardVisible, this), actionFirst, blink, cc.CallFunc.create(this.getDelearSecCardVisible, this), actionSec,  blink, cc.CallFunc.create(this.getDelearThirdCardVisible, this), actionThird, blink, cc.CallFunc.create(this.getDelearFourthCardVisible, this), actionFourth, blink, cc.CallFunc.create(this.getDelearFifthCardVisible, this), actionFifth, blink, cc.CallFunc.create(this.getDelearSixthCardVisible, this),actionSixth, blink, cc.CallFunc.create(this.getDelearSeventhCardVisible, this), actionSeventh, moveBlinkCardBack, cc.CallFunc.create(this.hideDelearBlinkCard, this));
            this.blinkCardDelear.runAction(seq );
        },

        getDelearFirstCardVisible: function() {
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	    }
           this.delearSlotFirstTemp.setVisible(true); 
        },

        getDelearSecCardVisible: function() {
        	//alert(audioPlaying);
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	   }
           this.delearSlotSecTemp.setVisible(true); 
        },

        getDelearThirdCardVisible: function() {
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	   }
           this.delearSlotThirdTemp.setVisible(true); 
        },

        getDelearFourthCardVisible: function() {
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	   }
           this.delearSlotFourthTemp.setVisible(true); 
        },

        getDelearFifthCardVisible: function() {
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	    }
           this.delearSlotFifthTemp.setVisible(true); 
        },

        getDelearSixthCardVisible: function() {
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	    }
           this.delearSlotSixthTemp.setVisible(true); 
        },

        getDelearSeventhCardVisible: function() {
        	if(audioPlaying == true){
     		   g_audioEngine.playEffect(res.cardSelect_mp3);
     	    }
           this.delearSlotSeventhTemp.setVisible(true); 
        },

        hideDelearBlinkCard: function() {
            this.blinkCardDelear.setVisible(false);
            // this.delearCardsShift();
            g_cardShuflingStatus = false; // this.splitPlayerCards();return;
        },

        getStatusText: function(status) {
            if (status == "player") {
                return g_langObj.win;
            }
            else if(status == "equal") {
                return g_langObj.tie;
            }
            else {
                return g_langObj.loss;
            }  
        },

        setResults: function() { // alert(g_delearTwoCards +' '+g_delearFiveCards);
        	
            var status = null;
            var fiveCardStatus = getFiveCardResultText();
            status = this.getStatusText(fiveCardStatus);
            this.resultFiveCardText.setString(status);
            this.resultFiveCardText.setVisible(true);     
            var twoCardStatus = getTwoCardResultText(); 
            status = this.getStatusText(twoCardStatus);                  
            this.resultTwoCardText.setString(status);
            this.resultTwoCardText.setVisible(true);
            status = null;
            // alert(fiveCardStatus+' '+twoCardStatus);
            
            if (fiveCardStatus == 'player' && twoCardStatus == 'player') {
                status = g_langObj.resultWin;  
                if(audioPlaying == true){
            		g_audioEngine.playEffect(g_langObj.playerWinSound);
         	    }
            }
            else if (fiveCardStatus == 'delear' && twoCardStatus == 'delear') {
                status = g_langObj.resultLoss;    
                this.lossGame();
                if(audioPlaying == true){
            		g_audioEngine.playEffect(g_langObj.playerLossSound);
         	    }
            }
            else if (fiveCardStatus == 'equal' && twoCardStatus == 'equal') {
                status = g_langObj.resultLoss;    
                this.lossGame();
                if(audioPlaying == true){
            		g_audioEngine.playEffect(g_langObj.playerLossSound);
         	    }
            }
            else if ((fiveCardStatus == 'delear' || twoCardStatus == 'delear') && (fiveCardStatus == 'equal' || twoCardStatus == 'equal')) {
                status = g_langObj.resultLoss;    
                this.lossGame();
                if(audioPlaying == true){
            		g_audioEngine.playEffect(g_langObj.playerLossSound);
         	    }
            }
            else if ((fiveCardStatus == 'player' || twoCardStatus == 'player') && (fiveCardStatus == 'equal' || twoCardStatus == 'equal')) {
                status = g_langObj.resultPush;
                if(audioPlaying == true){
            		g_audioEngine.playEffect(g_langObj.pushSound);
         	    }
            }
            else {
                status = g_langObj.resultPush; 
                if(audioPlaying == true){
            		g_audioEngine.playEffect(g_langObj.pushSound);
         	    }
            }
          if(status ==  g_langObj.win) {
		   this.winBitCoins(g_createdBitCoins['1'].length,"bitcoin_1.png");
		   this.winBitCoins(g_createdBitCoins['0.1'].length,"bitcoin_.1.png");
		   this.winBitCoins(g_createdBitCoins['0.01'].length,"bitcoin_.01.png");
		   this.winBitCoins(g_createdBitCoins['0.001'].length,"bitcoin_.001.png");
		   this.wingameTxt.setString(g_langObj.wingame+""+g_bitValue);
		   this.wingameTxt.setVisible(true);
		   //console.log(g_createdBitCoins);
	     }else {
	    	this.resultTxt.setString(status);
	    	this.resultTxt.setVisible(true);   
	     }   
	   //console.log(this.resultTxt);
        },
	clearBitcoin : function() {
		this.removeBitcoin(g_createdBitCoins['1'].length,g_createdBitCoins['1']);
		this.removeBitcoin(g_createdBitCoins['0.1'].length,g_createdBitCoins['0.1']);
		this.removeBitcoin(g_createdBitCoins['0.01'].length,g_createdBitCoins['0.01']);
		this.removeBitcoin(g_createdBitCoins['0.001'].length,g_createdBitCoins['0.001']);
		this.removeBitcoin(g_winCoins.length,g_winCoins);
		g_winCoins = [];
		g_createdBitCoins['1'] = [];
		g_createdBitCoins['0.1'] = [];
		g_createdBitCoins['0.01'] = [];
		g_createdBitCoins['0.001'] = [];
		g_bitValue = 0;
		//g_wincoinPositions.bitcoin.y = 269.5;
		this.removeChild(this.menuNewGame);
		this.betAmount();
		this.placeYourBetMessage();
		g_bitcoinPos = 0;
		g_bitSelectedVal = 0;
		
	},
	removeBitcoin : function(coinCount,coin) {
		g_bitcoinPos = 0;
		if(coinCount == 0) {
			return;
		}
		for(var i=0; i<coinCount; i++) {
			this.removeChild(coin[i]);
		}
	},
	hideBitcoin : function(coinCount,coin) {
		//this.g_bitcoinPos = 0;
		if(coinCount == 0) {
			return;
		}
		for(var i=0; i<coinCount; i++){
			//this.removeChild(coin[i]);
			coin[i].setVisible(false);
		}
	},
	onNewgameButton : function() {
		
		if(this.resultFiveCardText._visible == false) {
			return false;
		}
		this.placeYourBetOnNewGame();
		this.removeChild(this.menuNewButton);
		var winSize = cc.Director.getInstance().getWinSize();
		var rebetButton = cc.Sprite.createWithSpriteFrameName("rebet.png");
		//var rebetButton = cc.MenuItemSprite.create(rebetButton,null, null, this.splitGame, this);
		var rebetButton = cc.MenuItemSprite.create(rebetButton,null, null, this.onRebetButton, this);
		this.menuRebetButton = cc.Menu.create(rebetButton);
		this.menuRebetButton.alignItemsHorizontallyWithPadding(10);
        	this.addChild(this.menuRebetButton);
        	this.menuRebetButton.setPosition(winSize.width / 2, g_bitcoinPositions.newbtn.x);
		this.resetGame();
		this.hideBitcoin(g_createdBitCoins['1'].length,g_createdBitCoins['1']);
		this.hideBitcoin(g_createdBitCoins['0.1'].length,g_createdBitCoins['0.1']);
		this.hideBitcoin(g_createdBitCoins['0.01'].length,g_createdBitCoins['0.01']);
		this.hideBitcoin(g_createdBitCoins['0.001'].length,g_createdBitCoins['0.001']);
		//this.removeChild(this.menuDealButton);
		this.setBitCoinPos = g_bitcoinPositions.origin.y;
		this.removeBitcoin(g_winCoins.length,g_winCoins);
		this.wingameTxt.setVisible(false);
		this.bitCoinValueText.setVisible(false);
		g_winCoins = [];
		g_gameStatus = false;
		g_newgame = true;
		g_bitcoinPos = 0;
	},
	onRebetButton : function() {
		this.removeFooterMessages();
		cc.AudioEngine.getInstance().pauseAllEffects();
		/*this.addBitCoins(g_createdBitCoins['1'].length,"bitcoin_1.png");
		this.addBitCoins(g_createdBitCoins['0.001'].length,"bitcoin_.001.png");
		this.addBitCoins(g_createdBitCoins['0.01'].length,"bitcoin_.01.png");
		this.addBitCoins(g_createdBitCoins['0.1'].length,"bitcoin_.1.png");*/
		/*this.addBitCoins(g_createdBitCoins['1'].length,g_createdBitCoins['1']);
		this.addBitCoins(g_createdBitCoins['0.1'].length,g_createdBitCoins['0.1']);
		this.addBitCoins(g_createdBitCoins['0.01'].length,g_createdBitCoins['0.01']);
		this.addBitCoins(g_createdBitCoins['0.001'].length,g_createdBitCoins['0.001']);*/
		//g_bitcoinPos = 0;
		this.setBitCoinPos =161;
                 
		this.setBitCoins(g_createdBitCoins['1'].length,"bitcoin_1.png");
		this.setBitCoins(g_createdBitCoins['0.1'].length,"bitcoin_.1.png");
		this.setBitCoins(g_createdBitCoins['0.01'].length,"bitcoin_.01.png");
		this.setBitCoins(g_createdBitCoins['0.001'].length,"bitcoin_.001.png");
		this.splitGame();
		this.removeChild(this.menuRebetButton);
		this.bitCoinValueText.setVisible(true);
		
	},
	addBitCoins : function(coinlen,rebetimg) {
		if(coinlen == 0) {
			return;
		}
                for(var i=0; i<coinlen; i++) {
                	//console.log(rebetimg);
			/*g_rebetcoinPositions.y = g_rebetcoinPositions.y+g_rebetcoinPositions.diff;
			var bitcoin = cc.Sprite.createWithSpriteFrameName(rebetimg);
			bitcoin.setPosition(new cc.Point(g_rebetcoinPositions.x, g_rebetcoinPositions.y));
			this.addChild(bitcoin);*/
			rebetimg[i].setVisible(true);
		}
	},
	winBitCoins : function(coinlen,coinimg) {
		if(coinlen == 0) {
			return;
		}
        for(var i=0; i<coinlen; i++) {
			g_wincoinPositions.bitcoin.y = g_wincoinPositions.bitcoin.y+g_wincoinPositions.bitcoin.diff;
			var bitcoin = cc.Sprite.createWithSpriteFrameName(coinimg);
			bitcoin.setPosition(new cc.Point(g_wincoinPositions.bitcoin.x, g_wincoinPositions.bitcoin.y));
			this.addChild(bitcoin,1);
			g_winCoins.push(bitcoin);
			//rebetimg[i].setVisible(true);
		}
	},
	betAmount : function() {
		g_bitValue = (g_createdBitCoins['0.1'].length) * 0.1 + (g_createdBitCoins['0.01'].length) * 0.01 +
 			     (g_createdBitCoins['0.001'].length) * 0.001 + (g_createdBitCoins['1'].length) * 1;	
		g_bitValue = g_bitValue.toFixed(3);		
		this.bitCoinValueTextShow(g_bitValue);
	},
	lossGame : function () {
		this.hideBitcoin(g_createdBitCoins['1'].length,g_createdBitCoins['1']);
		this.hideBitcoin(g_createdBitCoins['0.1'].length,g_createdBitCoins['0.1']);
		this.hideBitcoin(g_createdBitCoins['0.01'].length,g_createdBitCoins['0.01']);
		this.hideBitcoin(g_createdBitCoins['0.001'].length,g_createdBitCoins['0.001']);
		this.bitCoinValueText.setVisible(false);
	},
	setBitCoins : function (coinlen,rebetimg) {
		
		if(coinlen == 0) {
			return;
		}
		
		for(var i=0; i<coinlen; i++) {
			g_bitcoinPos = g_bitcoinPos + g_bitPosChange;
			this.setBitCoinPos = this.setBitCoinPos + g_bitPosChange;
			var bitcoins = cc.Sprite.createWithSpriteFrameName(rebetimg);
			bitcoins.setPosition(new cc.Point(g_bitcoinPositions.origin.x, this.setBitCoinPos));
			this.addChild(bitcoins);
			g_winCoins.push(bitcoins);
			
		}
		//console.log(g_winCoins);
	},
	addAndRemoveBitCoins : function (bval) {
		g_bitcoinPos = 0;
		this.setBitCoinPos = g_bitcoinPositions.origin.y;
		
		this.removeBitcoin(g_createdBitCoins['1'].length,g_createdBitCoins['1']);
		this.removeBitcoin(g_createdBitCoins['0.1'].length,g_createdBitCoins['0.1']);
		this.removeBitcoin(g_createdBitCoins['0.01'].length,g_createdBitCoins['0.01']);
		this.removeBitcoin(g_createdBitCoins['0.001'].length,g_createdBitCoins['0.001']);
		this.removeBitcoin(g_winCoins.length,g_winCoins);
		g_winCoins = [];
		if(bval == '0.1') {
			g_createdBitCoins['0.1'] = [];
			g_createdBitCoins['1'].push(this.bitCoinFourth);
		} else if(bval == '0.01') {
			g_createdBitCoins['0.01'] = [];
			
			g_createdBitCoins['0.1'].push(this.bitCoinThird);
		} else {
			g_createdBitCoins['0.001'] = [];
			//this.addChild(this.bitCoinSecond);
			g_createdBitCoins['0.01'].push(this.bitCoinSecond);
		}
		this.setBitCoins(g_createdBitCoins['1'].length,"bitcoin_1.png");
		this.setBitCoins(g_createdBitCoins['0.1'].length,"bitcoin_.1.png");
		this.setBitCoins(g_createdBitCoins['0.01'].length,"bitcoin_.01.png");
		this.setBitCoins(g_createdBitCoins['0.001'].length,"bitcoin_.001.png");
	},

        splitPlayerCards: function() {
            var dealerFiveCards = g_delearFiveCards;
            var delearTwoCards  = g_delearTwoCards;
            var playerCards = g_playerSelectedCards; 
            delearCards.init(g_playerSelectedCards);
            var playerFiveCards = g_delearFiveCards;
            var playerTwoCards  = g_delearTwoCards;
            g_delearFiveCards  =  dealerFiveCards ;
            g_delearTwoCards = delearTwoCards  ;

            var cardObjFirst = g_selectedPlayerCardsObj[playerTwoCards[0]];
            var cardObjSec = g_selectedPlayerCardsObj[playerTwoCards[1]];

            
            var actualKeyPos = 0;
            for (idx in playerCards) {
               actualKeyPos = parseInt(idx) + 1;
               if (playerCards[idx] ==  playerTwoCards[0] ) {
                    var cardPositionObjFirst = eval('g_cardsPositions.playerCardSlot'+actualKeyPos);
               }
               else if (playerCards[idx] ==  playerTwoCards[1] ) {
                    var cardPOsitionObjSec = eval('g_cardsPositions.playerCardSlot'+actualKeyPos);
               }
            }

            
            this.movePlayerCard(cardObjFirst, cardPositionObjFirst);
            var classObj = this;
            setTimeout(function(){classObj.movePlayerCard(cardObjSec, cardPOsitionObjSec);}, 300);  
            
        }
	

});
cocosScope.GameLayer.create = function() {
       var gameLayer = new cocosScope.GameLayer();
       if (gameLayer && gameLayer.init()) {
               return gameLayer;
       }
       return null;
};


cocosScope.GameLayer.scene = function() {
	  var scene = cc.Scene.create();
	  scene.addChild(background.create());
	  scene.addChild(cocosScope.GameLayer.create());
	  return scene;
	//var scene = cc.Scene.create();
	//scene.addChild(background.create());
	//return scene;
};

