'use strict';
/* exported BaseGameHistoryController */
var BaseGameHistoryController = function($scope, $routeParams, BCSession, BCPlayer, GameResource) {
    var controller_ = this;
    this.$scope = $scope;
    $scope.tableType = $routeParams.type || 'global';
    this.getGameListScopeVariableName = 'games';

    $scope.getRecentSpinsTabClass = function(tabName) {
        if (tabName === $scope.tableType) {
            return "active";
        } else {
            return "";
        }
    };

    if ($scope.tableType === 'player') {
        $scope.$watch('player', function(newVal, oldVal) {
            if (newVal && newVal._id && oldVal === undefined) {
                $scope.loadTable();
            }
        });
    }

    $scope.loadTable = function() {
        $scope.loadingCircles = true;
        var query = {};
        if ($scope.tableType === 'player') {
            if (!BCSession.user) {
                $scope[controller_.getGameListScopeVariableName] = [];
                return;
            }
            query.player_id = BCSession.user._id;
        }
        $scope[controller_.getGameListScopeVariableName] = GameResource.query(query, function() {
            $scope.loadingCircles = false;
        });
    };

    var newGames = [];
    $scope.updateGames = function() {
        if(BCSession.isGameInProgress || newGames.length === 0){
            return;
        }
        for(var i = 30; i < $scope[controller_.getGameListScopeVariableName].length + newGames.length; i++){
            $scope[controller_.getGameListScopeVariableName].pop();
        }
        newGames.forEach(function(newGame){
            $scope[controller_.getGameListScopeVariableName].unshift(newGame);
        });
        newGames = [];
    };

    $scope.$on('game finished', function(){
        $scope.updateGames();
    });

    $scope.$on(controller_.getNewGameEventName(), function(event, newGame) {
        if($scope[controller_.getGameListScopeVariableName] && $scope[controller_.getGameListScopeVariableName].length >= 1 && $scope[controller_.getGameListScopeVariableName][0]._id === newGame._id){
            return;
        }
        newGames.push(newGame);
        $scope.$apply(function(){
            $scope.updateGames();
        });
    });

    $scope.loadTable();

    BCPlayer.$on('login', function() {
        if ($scope.tableType === 'player') {
            $scope.loadTable();
        }
    });
};

BaseGameHistoryController.prototype.getNewGameEventName = function() {
    return this.$scope.tableType + ' game added';
};
