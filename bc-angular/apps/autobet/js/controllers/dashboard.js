'use strict';

/* global async */
/*jslint evil: true */

var DashboardController = function($scope, $http, $base64, PlayerApi, Autobet, BCPlayer, BCSession, GameConfigs) {
    var serverUrl = PlayerApi.protocol + '://' + PlayerApi.hostname;
    $scope.saveRobot = function(playerConfig) {
        var params = {};
        for(var i in playerConfig){
            if(playerConfig.hasOwnProperty(i)){
                params[i] = playerConfig[i];
            }
        }
        var self = this;
        Autobet.saveRobotPlayer(params, {player_id: $scope.player._id}, function(data){
            self.playerConfig = data;
        });
    };
    $scope.addRobot = function() {
        $scope.players[$scope.robotUserId] = {username: $scope.robotUsername};
        $scope.current_user_id = $scope.robotUserId;
    };
    $scope.addNewRobot = function() {
        var autobet = new Autobet({username: $scope.newRobotUsername});
        autobet.$save({
            command: 'player'
        }, function(data) {
            $scope.players[data.userid] = {username: $scope.newRobotUsername};
            $scope.current_user_id = data.userid;
        });
    };
    $scope.creditUser = function() {
        $http.get(serverUrl + '/autobet/credit/' + $scope.current_user_id).success(function() {
        }).error(function(err) {
            $scope.error = err;
            console.error(err);
        });
    };
    $scope.addGameAutobet = function(gameType) {
        if(!gameType || gameType === ''){
            return;
        }
        if(gameType === 'custom') {
            $scope.addCustomGameAutobet($scope.players[$scope.current_user_id]);
        }else{
            $scope.addDefaultGameAutobet(gameType, $scope.players[$scope.current_user_id]);
        }
    };
    $scope.addDefaultGameAutobet = function(gameType, playerConfig) {
        playerConfig.games = playerConfig.games || [];
        playerConfig.games.push({
            name: gameType,
            actions: GameConfigs[gameType],
            type: gameType,
            frequency: 10,
            player_id: $scope.player._id,
            player_username: $scope.players[$scope.current_user_id].username,
            wager: 0.00001,
            wager_max: 0.00001,
            max_runs: 1000,
            restart_after_hours: 16,
            restart_after_mins: 0
        });
    };
    $scope.addCustomGameAutobet = function(playerConfig) {
        playerConfig.games = playerConfig.games || [];
        playerConfig.games.push({
            name:'new game',
            type:'custom',
            frequency: 10,
            wager: 0.00001,
            wager_max: 0.00001,
            max_runs: 1000,
            restart_after_hours: 16,
            restart_after_mins: 0
        });
    };
    $scope.saveGameAutobet = function() {
        delete this.game.error;
        var self = this;
        // this.game.username = this.playerConfig.username;
        delete this.game.results;
        delete this.game.runCounts;
        this.game.enabled = false;
        var params = {
            _id: this.game._id,
            name: this.game.name,
            frequency: this.game.frequency,
            actions: this.game.type === 'custom'?this.game.actions:null,
            enabled: this.game.type==='custom'?false:this.game.enabled,
            type: this.game.type,
            player_id: $scope.current_user_id,
            player_username: $scope.players[$scope.current_user_id].username,
            wager: this.game.wager,
            wager_max: this.game.wager_max,
            currency: this.game.currency,
            max_runs: this.game.max_runs,
            restart_after_hours: this.game.restart_after_hours,
            restart_after_mins: this.game.restart_after_mins
        };
        if(params.wager > params.wager_max) {
            this.game.error = {message:'Min Wager not allowed to be smaller than Max Wager'};
            return;
        }
        if(this.game._id){
            Autobet.updateGameConfig(params);
        }else{
            Autobet.addGameConfig(params, function(data){
                Object.keys(data).forEach(function(prop){
                    self.game[prop] = data[prop];
                });
            });
        }
    };
    $scope.addAction = function(game, type) {
        if(!type||type === ''){
            return;
        }
        var action;
        if(['get','post','put'].indexOf(type) !== -1){
            action = {type: 'http', httpType: type};
        }else{
            action = {type: type};
        }

        game.actions = game.actions||[];
        game.actions.push(action);
    };
    $scope.removeAction = function(index) {
        this.game.actions.splice(index, 1);
    };
    $scope.doActions = function(playerConfig, game) {
        var actions = game.actions.slice();
        actions.unshift({endpoint: '/account/auth'});
        game.previousResponse = {};
        game.totals = {};
        game.convertedParams = game.convertedParams || {};
        $scope.processWorkflowQueue(actions, game, playerConfig);
    };
    var recursive = function(game, player, actionIndex) {
        var slicedActions = game.actions.slice(actionIndex);
        $scope.processWorkflowQueue(slicedActions, game, player);
    };
    $scope.processWorkflowQueue = function(actionsToRun, game, player) {
        if(!game.enabled){
            return;
        }
        game.waitToRun = true;
        if(game.runCounts && actionsToRun.length === game.actions.length){
            if(game.runCounts < game.max_runs){
                setTimeout(function(){
                    $scope.executeWorkflowQueue(actionsToRun, game, player);
                }, game.frequency * 1000);
            }
        }else{
            $scope.executeWorkflowQueue(actionsToRun, game, player);
        }
    };
    $scope.executeWorkflowQueue = function(actionsToRun, game, player) {
        game.runCounts = game.runCounts||0;
        game.runCounts ++;
        game.wagerCount = game.wagerCount||0;
        game.wagerCount ++;
        if(game.wagerCount > game.maxWagerCount||!game.maxWagerCount){
            game.wagerCount = 0;
            game.maxWagerCount = Math.random()*100/2;
            game.lastWager = game.wager.toSatoshi()+(Math.random()*(game.wager_max-game.wager).toSatoshi());
        }
        game.convertedParams.wager = game.lastWager;
        game.waitToRun = false;
        var actionIndex = 0;
        async.eachSeries(actionsToRun, function(action, done){
            actionIndex ++;
            if(action.endpoint && action.endpoint.indexOf('/account/auth') !== -1){
                player.data = BCSession.user;
                done();
            }
            if(action.type === 'convert'){
                $scope.convertAction(game, action, done);
            }else if(action.type === 'js'){
                var customLogic = new Function(['game', 'action', 'player', 'done'], action.body);
                customLogic(game, action, player, done);
            }else {
                if(action.httpType === 'get'){
                    $scope.getAction(game, action, player, done);
                }
                if(action.httpType === 'post'){
                    $scope.postAction(game, action, player, done);
                }
                if(action.httpType === 'put'){
                    $scope.putAction(game, action, player, done);
                }
            }
        }, function(err){
            if(!err && game.enabled){
                $scope.processWorkflowQueue(game.actions, game, player);
            }else if(err){
                if(!err.action_type){
                    $scope.updateGameResults(game, err, actionsToRun[actionIndex - 1]);
                    game.enabled = false;
                }else{
                    if(err.action_type.indexOf('recursive') !== -1){
                        recursive(game, player, err.action_type.split('_')[1] - 1);
                    }
                }
            }
        });
    };
    $scope.convertAction = function(game, action, callback) {
        try{
            var convertFormula = JSON.parse(action.body);
            for(var i in convertFormula){
                if(convertFormula.hasOwnProperty(i)){
                    game.convertedParams[convertFormula[i]] = game.previousResponse[i];
                }
            }
        }catch(ex){
            return callback(ex);
        }
        callback();
    };
    var getHttpConfig = function(game, player) {
        var config = {
            headers: {
                Authorization: 'Bearer ' + player.data.token
            }
        };
        config.headers['X-Currency'] = game.currency||'bitcoin';
        return config;
    };
    $scope.getAction = function(game, action, player, callback) {
        $http.get(serverUrl + action.endpoint, getHttpConfig(game, player)).success(function(data, status){
            if(status !== 200){
                return callback(data);
            }
            game.previousResponse = data;
            $scope.updateGameResults(game, data, action);
            callback();
        }).error(function(data){
            callback(data);
        });
    };
    $scope.postAction = function(game, action, player, callback) {
        var params = {};
        var config = getHttpConfig(game, player);
        if(action.body){
            var jsonbody = $scope.resolveJsonBody(action, game);
            try{
                params = JSON.parse(jsonbody);
            }catch(ex){
                callback(ex);
            }
        }
        params.player_id = player.data._id;
        params.token = player.data.token;
        var endpoint = $scope.resolveEndpointUrl(action, game);
        $http.post(serverUrl + endpoint, params, config).success(function(data, status){
            if(status !== 200 || data.code){
                return callback(data);
            }
            game.previousResponse = data;
            $scope.updateGameResults(game, data, action);
            callback();
        }).error(function(data){
            game.enabled = false;
            game.convertedParams = {};
            callback(data);
        });
    };
    $scope.putAction = function(game, action, player, callback) {
        var params = {};
        var config = getHttpConfig(game, player);
        if(action.body){
            var jsonbody = $scope.resolveJsonBody(action, game);
            try{
                params = JSON.parse(jsonbody);
            }catch(ex){
                return callback(ex);
            }
        }
        var endpoint = $scope.resolveEndpointUrl(action, game);
        params.player_id = player.data._id;
        params.token = player.data.token;
        $http.put(serverUrl + endpoint, params, config).success(function(data, status){
            if(status !== 200 || data.code){
                return callback(data);
            }
            game.previousResponse = data;
            $scope.updateGameResults(game, data, action);
            callback();
        }).error(function(data){
            game.enabled = false;
            game.convertedParams = {};
            callback(data);
        });
    };
    $scope.resolveEndpointUrl = function(action, game){
        if(!game.convertedParams || !action.endpoint){
            return;
        }
        var endpoint = action.endpoint;
        for(var i in game.convertedParams){
            if(game.convertedParams.hasOwnProperty(i)){
                if(endpoint.indexOf('{{'+ i +'}}') !== -1){
                    endpoint = endpoint.replace('{{'+ i +'}}', game.convertedParams[i]);
                }
            }
        }
        return endpoint;
    };
    $scope.resolveJsonBody = function(action, game){
        if(!game.convertedParams || !action.body){
            return;
        }
        var body = action.body;
        for(var i in game.convertedParams){
            if(game.convertedParams.hasOwnProperty(i)){
                if(body.indexOf('{{'+ i +'}}') !== -1){
                    body = body.replace(new RegExp('{{'+ i +'}}','g'), game.convertedParams[i]);
                }
            }
        }
        return body;
    };
    $scope.toggleAutobet = function(player, game) {
        game.enabled = !game.enabled;
        game.error = null;
        game.player_id = $scope.current_user_id;
        Autobet.updateGameConfig(game, function(updatedGame){
            updatedGame.results = [];
            if(game.type === 'custom'){
                if(!game.enabled){
                    return;
                }
                $scope.doActions(player, game);
            }
        });
    };
    $scope.removeGame = function(gameIndex, game) {
        if(!game._id){
            $scope.players[$scope.current_user_id].games.splice(gameIndex, 1);
            return;
        }
        Autobet.removeGameConfig({},{_id: game._id, player_id: $scope.player._id}, function(){
            $scope.players[$scope.current_user_id].games.splice(gameIndex, 1);
        });
    };
    $scope.updateGameResults = function(game, result, action){
        game.results = game.results || [];
        if(game.results.length >= 30){
            game.results.pop();
        }
        result = JSON.stringify(result, null, "  ");
        game.results.unshift({text:result, action:action, time:new Date()});
    };
    $scope.exportActions = function(game) {
        game.actionsJsonString = JSON.stringify(angular.copy(game.actions), null, "  ");
    };
    $scope.importActions= function(game) {
        try{
            game.actions = JSON.parse(game.actionsJsonString);
            delete game.actionsJsonString;
        }catch(ex){
            console.log(ex);
        }
    };
    $scope.switchPlayerTab = function(player_id) {
        $scope.current_user_id = player_id;
        if($scope.current_user_id === BCSession.user._id && $scope.defaultAutobets.indexOf('custom') === -1){
            $scope.defaultAutobets.unshift('custom');
        }
        if($scope.current_user_id !== BCSession.user._id && $scope.defaultAutobets.indexOf('custom') !== -1){
            $scope.defaultAutobets.shift();
        }
    };
    $scope.aceOption = {
        theme:'twilight',
        // mode: 'javascript',
        showGutter: false
    };
    Autobet.getDefaultAutobets({}, function(autobets){
        $scope.defaultAutobets = autobets;
        $scope.defaultAutobets.unshift('custom');
    });
    $scope.players = {};
    BCPlayer.$on('valid wallet', function(event, user){
        console.debug(user, BCSession);
        $scope.player = user;
        if(!$scope.init){
            Autobet.getPlayerConfig({}, {player_id: user._id}, function(data){
                $scope.wallets = data.wallets;
                if(data.games){
                    $scope.current_user_id = data.games[0].player_id;
                    data.games.forEach(function(game){
                        if(game.type !== 'custom'){
                            game.actions = GameConfigs[game.type];
                        }
                        game.convertedParams = {wager: game.wager||0};
                        $scope.players[game.player_id] = $scope.players[game.player_id]||{_id: game.player_id};
                        $scope.players[game.player_id].username = game.player_username||BCSession.user.username;
                        $scope.players[game.player_id].games = $scope.players[game.player_id].games||[];
                        $scope.players[game.player_id].games.push(game);
                    });
                }
                $scope.init = true;
            });
            // AutobetSocket.emit('subscribe', '5462f2aadaa7e6c1009d9080');
            // AutobetSocket.on('new autobet action result', function(data){
            //     console.log(data);
            // });
        }
    });
    $scope.$on('new action result', function(event, data){
        if(!$scope.players[data.player_id] || !$scope.players[data.player_id].games){
            return;
        }
        if(data.result.balance >= 0){
            $scope.$broadcast('balance update', {player_id: data.player_id, balance: data.result.balance, currency: data.result.currency});
        }
        $scope.players[data.player_id].games.forEach(function(game){
            if(game._id === data.game_id){
                $scope.$apply(function(){
                    $scope.updateGameResults(game, data.result, data.action);
                });
            }
        });
    });
    $scope.$on('new autobet totals', function(event, data){
        if(!$scope.players[data.player_id] || !$scope.players[data.player_id].games){
            return;
        }
        $scope.players[data.player_id].games.forEach(function(game){
            if(game._id === data.game_id){
                game.totals = game.totals || {};
                $scope.$apply(function(){
                    Object.keys(data.game_stats).forEach(function(prop){
                        game.totals[prop] = data.game_stats[prop];
                    });
                    game.runCounts = data.game_stats.runCounts;
                });
            }
        });
    });
    $scope.$on('balance update', function(event, data){
        $scope.wallets[data.player_id||$scope.BCSession.user._id][data.currency].balance = data.balance;
    });
    $scope.$on('autobet game error', function(event, data){
        $scope.players[data.player_id].games.forEach(function(game){
            if(game._id === data.config._id){
                $scope.$apply(function(){
                    game.error = data.error;
                    game.enabled = false;
                });
            }
        });
    });
};

Application.Controllers.controller('DashboardController', [
    '$scope',
    '$http',
    '$base64',
    'PlayerApi',
    'Autobet',
    'BCPlayer',
    'BCSession',
    'GameConfigs',
    'AutobetSocket',
    DashboardController
]);
