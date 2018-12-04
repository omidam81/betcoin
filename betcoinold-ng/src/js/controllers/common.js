'use strict';

Application.Controllers.controller('NavController', [ function () {

}]);
Application.Controllers.controller('TermsAndConditionsController', ['$scope', '$location', function ($scope, $location) {
	$scope.supportDomain = $location.host();
}]);

