'use strict';
//   g_strings.intro_text[en_US] is the the text value 
// var g_cards = {};
/*g_cards.ca = {src:'clubs_08.png', rank:'14', suit:'c'};
g_cards.c2 = {src:'clubs_08.png', rank:'2', suit:'c'};
g_cards.c3 = {src:'clubs_08.png', rank:'3', suit:'c'};
g_cards.c4 = {src:'clubs_08.png', rank:'4', suit:'c'};
g_cards.c5 = {src:'clubs_08.png', rank:'5', suit:'c'};
g_cards.c6 = {src:'clubs_08.png', rank:'6', suit:'c'};
g_cards.c7 = {src:'clubs_08.png', rank:'7', suit:'c'};
g_cards.c8 = {src:'clubs_08.png', rank:'8', suit:'c'};
g_cards.c9 = {src:'clubs_08.png', rank:'9', suit:'c'};
g_cards.c10 = {src:'clubs_08.png', rank:'10', suit:'c'};
g_cards.cj = {src:'clubs_08.png', rank:'11', suit:'c'};
g_cards.cq = {src:'clubs_08.png', rank:'12', suit:'c'};
g_cards.ck = {src:'clubs_08.png', rank:'13', suit:'c'};*/

var g_cards = [];
g_cards['c14'] = {src:'clubs_ass.png', rank:14, suit:'c'};
g_cards['c2'] = {src:'clubs_02.png', rank:2, suit:'c'};
g_cards['c3'] = {src:'clubs_03.png', rank:3, suit:'c'};
g_cards['c4'] = {src:'clubs_04.png', rank:4, suit:'c'};
g_cards['c5'] = {src:'clubs_05.png', rank:5, suit:'c'};
g_cards['c6'] = {src:'clubs_06.png', rank:6, suit:'c'};
g_cards['c7'] = {src:'clubs_07.png', rank:7, suit:'c'};
g_cards['c8'] = {src:'clubs_08.png', rank:8, suit:'c'};
g_cards['c9'] = {src:'clubs_09.png', rank:9, suit:'c'};
g_cards['c10'] = {src:'clubs_10.png', rank:10, suit:'c'};
g_cards['c11'] = {src:'clubs_jack.png', rank:11, suit:'c'};
g_cards['c12'] = {src:'clubs_queen.png', rank:12, suit:'c'};
g_cards['c13'] = {src:'clubs_king.png', rank:13, suit:'c'};

g_cards['d14'] = {src:'diamonds_ass.png', rank:14, suit:'d'};
g_cards['d2'] = {src:'diamonds_02.png', rank:2, suit:'d'};
g_cards['d3'] = {src:'diamonds_03.png', rank:3, suit:'d'};
g_cards['d4'] = {src:'diamonds_04.png', rank:4, suit:'d'};
g_cards['d5'] = {src:'diamonds_05.png', rank:5, suit:'d'};
g_cards['d6'] = {src:'diamonds_06.png', rank:6, suit:'d'};
g_cards['d7'] = {src:'diamonds_07.png', rank:7, suit:'d'};
g_cards['d8'] = {src:'diamonds_08.png', rank:8, suit:'d'};
g_cards['d9'] = {src:'diamonds_09.png', rank:9, suit:'d'};
g_cards['d10'] = {src:'diamonds_10.png', rank:10, suit:'d'};
g_cards['d11'] = {src:'diamonds_jack.png', rank:11, suit:'d'};
g_cards['d12'] = {src:'diamonds_queen.png', rank:12, suit:'d'};
g_cards['d13'] = {src:'diamonds_king.png', rank:13, suit:'d'};

g_cards['h14'] = {src:'heart_ass.png', rank:14, suit:'h'};
g_cards['h2'] = {src:'heart_02.png', rank:2, suit:'h'};
g_cards['h3'] = {src:'heart_03.png', rank:3, suit:'h'};
g_cards['h4'] = {src:'heart_04.png', rank:4, suit:'h'};
g_cards['h5'] = {src:'heart_05.png', rank:5, suit:'h'};
g_cards['h6'] = {src:'heart_06.png', rank:6, suit:'h'};
g_cards['h7'] = {src:'heart_07.png', rank:7, suit:'h'};
g_cards['h8'] = {src:'heart_08.png', rank:8, suit:'h'};
g_cards['h9'] = {src:'heart_09.png', rank:9, suit:'h'};
g_cards['h10'] = {src:'heart_10.png', rank:10, suit:'h'};
g_cards['h11'] = {src:'hearts_jack.png', rank:11, suit:'h'};
g_cards['h12'] = {src:'hearts_queen.png', rank:12, suit:'h'};
g_cards['h13'] = {src:'hearts_king.png', rank:13, suit:'h'};

g_cards['s14'] = {src:'spades_ass.png', rank:14, suit:'s'};
g_cards['s2'] = {src:'spades_02.png', rank:2, suit:'s'};
g_cards['s3'] = {src:'spades_03.png', rank:3, suit:'s'};
g_cards['s4'] = {src:'spades_04.png', rank:4, suit:'s'};
g_cards['s5'] = {src:'spades_05.png', rank:5, suit:'s'};
g_cards['s6'] = {src:'spades_06.png', rank:6, suit:'s'};
g_cards['s7'] = {src:'spades_07.png', rank:7, suit:'s'};
g_cards['s8'] = {src:'spades_08.png', rank:8, suit:'s'};
g_cards['s9'] = {src:'spades_09.png', rank:9, suit:'s'};
g_cards['s10'] = {src:'spades_10.png', rank:10, suit:'s'};
g_cards['s11'] = {src:'spades_jack.png', rank:11, suit:'s'};
g_cards['s12'] = {src:'spades_queen.png', rank:12, suit:'s'};
g_cards['s13'] = {src:'spades_king.png', rank:13, suit:'s'};
g_cards['jo15'] = {src:'jocker.png', rank:15, suit:'j'}

var g_cardValues = ['c2','d2','h2','s2','c3','d3','s3','h3','c4','d4','h4','s4','c5','d5','s5','h5','c6','d6','h6','s6','c7','d7','s7','h7','c8','d8','h8','s8','d9','c9','s9','h9','c10','d10','h10','s10','c11','d11','h11','s11','d12','c12','s12','h12','c13','d13','h13','s13','c14','d14','h14','s14','jo15'];


var g_playerSelectedCards = [];
var g_delearSelectedCards = [];
var g_randomCards = [];

var g_playerTwoCards = [];
var g_delearTwoCards = [];
var g_playerFiveCards = [];
var g_delearFiveCards = [];
var g_delearFiveRankObj = [];
var g_playerFiveRankObj = [];
var g_delearTwoRankObj = [];
var g_playerTwoRankObj = [];
var g_langObj = [];


var g_rankOrder = [];
g_rankOrder['five_of_a_kind'] = {rank:1};
g_rankOrder['royal_flush'] = {rank:2};
g_rankOrder['straight_flush'] = {rank:3};
g_rankOrder['four_of_a_kind'] = {rank:4};
g_rankOrder['full_house'] = {rank:5};
g_rankOrder['flush'] = {rank:6};
g_rankOrder['straight'] = {rank:7};
g_rankOrder['three_of_a_kind'] = {rank:8};
g_rankOrder['two_pairs'] = {rank:9};
g_rankOrder['one_pair'] = {rank:10};
g_rankOrder['no_pair'] = {rank:11};

// var g_rankTwoCardOrder = [];
// g_rankTwoCardOrder['pair'] = {rank:1};
// g_rankTwoCardOrder['no_pair'] = {rank:2};


// var g_selectedFiveCards = [];
// var g_selectedTwoCards = [];
var g_selectedPlayerCardsObj = []; 
var g_selectedDelearCardsObj = []; 
var g_createdBitCoins = [];
	 g_createdBitCoins['1'] = [];
     g_createdBitCoins['0.1'] = [];
     g_createdBitCoins['0.01'] = [];
     g_createdBitCoins['0.001'] = [];
     
var g_cardsPositions = {};
g_cardsPositions.blinkCardBotton = {width:560, height:600, downWidth:560, downHeight:560};
g_cardsPositions.playerCardOrigin = {width:560, height:560};
g_cardsPositions.playerCardSlot1 = {width:90.00, height:264};
g_cardsPositions.playerCardSlot2 = {width:167.00, height:248};
g_cardsPositions.playerCardSlot3 = {width:244.50, height:236};
g_cardsPositions.playerCardSlot4 = {width:321.00, height:220};
g_cardsPositions.playerCardSlot5 = {width:397.50, height:236};
g_cardsPositions.playerCardSlot6 = {width:474.50, height:248};
g_cardsPositions.playerCardSlot7 = {width:551.50, height:264};
/*g_cardsPositions.playerCardSlot8 = {width:1411.5, height:695.5};*/
g_cardsPositions.playerFlipCardOrigin = {width:551.50, height:358};
g_cardsPositions.playerTwoCardFlipOrigin = {width:320, height:499.5};
g_cardsPositions.playerCardSlectedLeft = {width:282.00, height:358};
g_cardsPositions.playerCardSlectedRight = {width:358.00, height:358};
g_cardsPositions.flippedTwoHandCard = {width:320, height:499.5};

g_cardsPositions.blinkCardDelear = {width:570, height:690, downWidth:570, downHeight:670};
g_cardsPositions.delearCardOrigin = {width:570, height:670};
g_cardsPositions.delearCardSlot1 = {width:90.00, height:637};
g_cardsPositions.delearCardSlot2 = {width:167.00, height:637};
g_cardsPositions.delearCardSlot3 = {width:244.50, height:637};
g_cardsPositions.delearCardSlot4 = {width:321.00, height:637};
g_cardsPositions.delearCardSlot5 = {width:397.50, height:637};
g_cardsPositions.delearCardSlot6 = {width:474.50, height:637};
g_cardsPositions.delearCardSlot7 = {width:551.50, height:637};
g_cardsPositions.delearCardSlotSelectedLeft = {width:282.00, height:499.5};
g_cardsPositions.delearCardSlotSelectedRight = {width:358.00, height:499.5};
g_cardsPositions.backcard = {src:'back_card.png'};
g_cardsPositions.playerCardMoveDist = 50;

var g_resultPositions = {};
g_resultPositions.fiveCardStatusText = {width:539.12, height:200.66};
g_resultPositions.twoCardStatusText = {width:420.45, height:404.26};
g_resultPositions.twoCardValidationText = {width:321.39, height:508.26};
g_resultPositions.resultText = {width:79.12, height:522.77};
g_resultPositions.resultWinText = {width:77.74, height:494.4};

var g_messagePositions = {};
g_messagePositions.placeYourBetCoinMessage = {width:350, height:8};


var g_bitcoinPositions ={};
/*g_bitcoinPositions.bitcoin1 = {x:35, y:200};
g_bitcoinPositions.bitcoin2 = {x:150, y:200};
g_bitcoinPositions.bitcoin3 = {x:265, y:200};
g_bitcoinPositions.bitcoin4 = {x:380, y:200};*/

g_bitcoinPositions.newbtn   = {x:77};
//g_bitcoinPositions.bitcoin  = {x:270, y:240};
g_bitcoinPositions.bitcoin  = {x:120.50, y:77};
//g_bitcoinPositions.bitcoin_0001 = {x:120, y:280};
g_bitcoinPositions.bitcoin_0001 = {x:45.00, y:77.00};
g_bitcoinPositions.bitcoin_001 = {x:100.50, y:77.00};
g_bitcoinPositions.bitcoin_01 = {x:156.00, y:77.00};
g_bitcoinPositions.bitcoin_1 = {x:212.00, y:77.00};
g_bitcoinPositions.origin = {x:55.00, y:161.00};
g_bitcoinPositions.text = {x:120.00, y:161.00};

var g_bitcoinCount = 0;
var g_bitconinCont1 = 0;
var g_bitconinCont2 = 0;
var g_bitconinCont3 = 0;
var g_bitconinCont4 = 0;
var g_bitcoinPos = 0;
var g_bitValue = 0;
var g_bitcoin = null;
var g_bitValue1 = 0.001;
var g_bitValue2 = 0.01;
var g_bitValue3 = 0.1;
var g_bitValue4 = 1;
var g_bitMovePos =0;
var g_bitPosChange = 5;
var g_bitPosReduce = 75;
var g_bitPosAdd = 85;

var g_gameStatus = false;
var g_rebetcoinPositions ={};
g_rebetcoinPositions.y = 200;
g_rebetcoinPositions.x = 55;
g_rebetcoinPositions.diff = 5;

var g_newgame = false;
var g_soundMenu = 742.00;
var audioPlaying = true;
var g_moveProgress = false;
var g_wincoinPositions = {};
g_wincoinPositions.bitcoin = {x:77.50, y:538.5, diff:5};

var g_winCoins = [];
var g_bitSelectedVal = 0;
var g_bitCoinRoundPostion = 157;
var g_cardShuflingStatus = false; 




