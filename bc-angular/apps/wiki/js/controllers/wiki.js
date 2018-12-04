'use strict';

var originTitle = window.document.title;
Application.Controllers.controller('WikiController', ['$scope', 'WikiFactory', '$window', function ($scope, WikiFactory, $window) {
    $window.document.title = originTitle;
    WikiFactory.reads(function(response){
        response.forEach(function(wiki, index) {
            response[index].summary = wiki.content.substr(0, 500).replace(/<[^>]*$/, '').replace(/(<.+>)+$/, '').replace(/(<\/.+>)?\n*$/, '') + '...';
        });
        $scope.wikis = response;
    });
}]);

Application.Controllers.controller('NewWikiController', ['$scope', 'WikiFactory', '$location', function ($scope, WikiFactory, $location) {
    $scope.templateUrl = "tpl/new-wiki.html";
    $scope.wiki = {};
    $scope.saveWiki = function () {
        WikiFactory.create($scope.wiki, function(response){
            if(response.result) {
                $location.path('/list');
            }
        });
    };

    $scope.previewWiki = function () {
        WikiFactory.previewWiki = $scope.wiki;
        $location.path('/preview');
    };

    $scope.slug = function () {
        $scope.wiki.slug = $scope.wiki.slug.replace(/\s+/, '-').replace(/[^a-z0-9-]/i, '').toLowerCase();
    };

}]);

Application.Controllers.controller('ListWikiController', ['$scope', 'WikiFactory', '$location', function ($scope, WikiFactory, $location) {
    $scope.wikis = [];
    $scope.templateUrl = "tpl/list-wiki.html";
    WikiFactory.reads(function(response){
        $scope.wikis = response;
    });

    $scope.viewWiki = function (id) {
        $location.path('/edit/'+id);
    };

}]);

Application.Controllers.controller('TempWikiController', ['$scope', 'WikiFactory', '$location', function ($scope, WikiFactory, $location) {
    $scope.templateUrl = "tpl/temp-wiki.html";
    $scope.wiki = WikiFactory.previewWiki;
    $scope.saveWiki = function () {
        WikiFactory.create($scope.wiki, function(response){
            if(response.result) {
                $location.path('/list');
            }
        });
    };

    $scope.previewWiki = function () {
        WikiFactory.previewWiki = $scope.wiki;
        $location.path('/preview');
    };
}]);

Application.Controllers.controller('ViewWikiController', ['$scope', 'WikiFactory', '$location', '$routeParams', '$window', function ($scope, WikiFactory, $location, $routeParams, $window) {
    var id = $routeParams.id;
    $scope.wiki = {};
    WikiFactory.read(id, function(response){
        $scope.wiki = response;
        $window.document.title = $scope.wiki.title;
    });

    $scope.back = function (){
        $location.path('/');
    };
}]);


