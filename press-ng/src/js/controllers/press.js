'use strict';

Application.Controllers.controller('PressController', ['$scope', 'PressFactory', function ($scope, PressFactory) {
    PressFactory.reads(function(response){
        response.forEach(function(press, index) {
            response[index].summary = press.content.substr(0, 500).replace(/<[^>]*$/, '').replace(/(<.+>)+$/, '').replace(/(<\/.+>)?\n*$/, '') + '...';
        });
        $scope.presss = response;
    });
}]);


Application.Controllers.controller('ListPressController', ['$scope', 'PressFactory', '$location', function ($scope, PressFactory, $location) {
    $scope.presss = [];
    $scope.templateUrl = "tpl/list-press.html";
    PressFactory.reads(function(response){
        $scope.presss = response;
    });

    $scope.viewPress = function (id) {
        $location.path('/edit/'+id);
    };

}]);

Application.Controllers.controller('ViewPressController', ['$scope', 'PressFactory', '$location', '$routeParams',function ($scope, PressFactory, $location, $routeParams) {
    var id = $routeParams.id;
    $scope.press = {};
    PressFactory.read(id, function(response){
        $scope.press = response;
    });

    $scope.back = function (){
        $location.path('/');
    };
}]);


