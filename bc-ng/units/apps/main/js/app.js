(function() {

	'use strict';

	var app = angular.module('app',[]);

	/*app.config(['$routeProvider', function($routeProvider){

		

	}]);*/

	app.config(['$routeProvider', function($routeProvider) {
		
		$routeProvider.when('/*theurl', getTemplateAndControllerFromPath(theUrl));

	}]);

	app.controller("AppCtrl", function($scope) {
		$scope.model = {
			message: "This is my app!!!"
		}
	});
		
})();