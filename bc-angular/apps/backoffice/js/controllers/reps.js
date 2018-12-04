(function(angular, Application) {
    'use strict';

    var RepsController = function($scope, $routeParams) {
        if (!$routeParams.section) {
            $scope.section = 'list';
        } else {
            $scope.section = $routeParams.section;
        }
        $scope.templateUrl = 'tpl/reps/' + $scope.section + '.html';
    };

    var RepListController = function($scope, Rep) {
        $scope.repList = Rep.query();
    };

    var RepDetailController = function($scope, $routeParams, Rep, WelcomePack) {
        var repId = $scope.repId = $routeParams.id;
        $scope.rep = Rep.get({_id: repId});
        $scope.welcomePacks = WelcomePack.query({repId: repId});
        $scope.newWelcomePack = new WelcomePack({repId: repId});

        $scope.saveRep = function() {
            $scope.rep.$save();
        };

        $scope.registerPack = function() {
            $scope.newWelcomePack.$save(function() {
                $scope.welcomePacks.push($scope.newWelcomePack);
                $scope.newWelcomePack = new WelcomePack({repId: repId});
            });
        };
    };

    Application.Controllers.controller('RepsController', [
        '$scope',
        '$routeParams',
        'Rep',
        RepsController
    ]);

    Application.Controllers.controller('RepListController', [
        '$scope',
        'Rep',
        RepListController
    ]);

    Application.Controllers.controller('RepDetailController', [
        '$scope',
        '$routeParams',
        'Rep',
        'WelcomePack',
        RepDetailController
    ]);

})(window.angular, window.Application);
