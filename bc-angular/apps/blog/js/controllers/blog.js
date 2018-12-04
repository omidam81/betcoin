'use strict';

var originTitle = window.document.title;
Application.Controllers.controller('BlogController', ['$scope', 'BlogFactory', '$window', function ($scope, BlogFactory, $window) {
    $window.document.title = originTitle;
    BlogFactory.reads(function(response){
        response.forEach(function(blog, index) {
            response[index].summary = blog.content.substr(0, 500).replace(/<[^>]*$/, '').replace(/(<\/p>)?\n*<p class=".+">$/, '') + '...';
        });
        $scope.blogs = response;
    });
}]);

Application.Controllers.controller('ListBlogController', ['$scope', 'BlogFactory', '$location', function ($scope, BlogFactory, $location) {
    $scope.blogs = [];
    $scope.templateUrl = "tpl/list-blog.html";
    BlogFactory.reads(function(response){
        $scope.blogs = response;
    });

    $scope.viewBlog = function (id) {
        $location.path('/edit/'+id);
    };

}]);


var ViewBlogController = function($scope, BlogFactory, $location, $routeParams, $window) {
    var id = $routeParams.id;
    $scope.blog = {};
    BlogFactory.read(id, function(response) {
        $scope.blog = response;
        $window.document.title = $scope.blog.title;
    });

    $scope.back = function() { $location.path('/'); };
};

Application.Controllers.controller('ViewBlogController', [
    '$scope',
    'BlogFactory',
    '$location',
    '$routeParams',
    '$window',
    ViewBlogController
]);



