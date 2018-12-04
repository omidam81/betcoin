'use strict';

/* global BaseGameDetailsController */

var GameDetailsController = function($scope, $routeParams, $window, BCSession, BCPlayer, Game) {
    GameDetailsController.super_.call(this, $scope, $routeParams, $window, BCSession, BCPlayer, Game);

    $(window).resize(function(){
        if($(window).width()>$(window).height()) {
            $("#g-fantan-history").removeClass("vertical");
            $("#g-fantan-history").addClass("horizontal");
        }
        else {
            $("#g-fantan-history").removeClass("horizontal");
            $("#g-fantan-history").addClass("vertical");
        }
    });

    $(document).ready(function(){
        if($(window).width()>$(window).height()) {
            $("#g-fantan-history").removeClass("vertical");
            $("#g-fantan-history").addClass("horizontal");
        }
        else {
            $("#g-fantan-history").removeClass("horizontal");
            $("#g-fantan-history").addClass("vertical");
        }
    });
};

angular.inherits(GameDetailsController, BaseGameDetailsController);
Application.Controllers.controller('GameDetailsController', ["$scope", "$routeParams", "$window", "BCSession", "BCPlayer", "Game", GameDetailsController]);

