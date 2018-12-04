'use strict';

/* global BaseGameDetailsController */

var GameDetailsController = function($scope, $routeParams, $window, BCSession, BCPlayer, Game) {
    GameDetailsController.super_.call(this, $scope, $routeParams, $window, BCSession, BCPlayer, Game);

    $(window).resize(function(){
        if($(window).width()>$(window).height()) {
            $("#g-sicbo-history").removeClass("vertical");
            $("#g-sicbo-history").addClass("horizontal");
        }
        else {
            $("#g-sicbo-history").removeClass("horizontal");
            $("#g-sicbo-history").addClass("vertical");
        }
    });

    $(document).ready(function(){
        if($(window).width()>$(window).height()) {
            $("#g-sicbo-history").removeClass("vertical");
            $("#g-sicbo-history").addClass("horizontal");
        }
        else {
            $("#g-sicbo-history").removeClass("horizontal");
            $("#g-sicbo-history").addClass("vertical");
        }
    });
};

angular.inherits(GameDetailsController, BaseGameDetailsController);
Application.Controllers.controller('GameDetailsController', ["$scope", "$routeParams", "$window", "BCSession", "BCPlayer", "Game", GameDetailsController]);

