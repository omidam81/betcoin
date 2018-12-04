'use strict';

var SavedSearchController = function($scope, $http, Api, MongoQuery) {
    $scope.loading = true;

    $scope.loadSearches = function() {
        $scope.loading = true;
        MongoQuery.get({
            collection: 'saved_search',
            pageSize: 100,
            page: 1,
            __sort: 'index__asc',
            or_q_adminId: $scope.BCAdminSession.user._id,
            or_q_global: true
        }, function(data) {
            $scope.error = null;
            $scope.loading = false;
            data.result.forEach(function(search) {
                var queryArr = search.query
                    .replace(/^[^?]+\?/, '')
                    .replace(/&$/, '')
                    .split('&');
                var queryObj = {};
                var fields = [];
                queryArr.forEach(function(condition) {
                    var parts = condition.split('=');
                    var isBool = (condition.indexOf('=') === -1);
                    var key = parts[0];
                    var val = parts[1] ? decodeURIComponent(parts[1]) : isBool ? true : "";
                    if (queryObj[key] !== undefined) {
                        if (!Array.isArray(queryObj[key])) {
                            queryObj[key] = [queryObj[key]];
                        }
                        queryObj[key].push(val);
                    } else {
                        queryObj[key] = val;
                    }
                });
                ['label', 'field', 'filter'].forEach(function(prop) {
                    var queryName = 'c_' + prop;
                    if (queryObj.hasOwnProperty(queryName)) {
                        var val = queryObj[queryName];
                        if (!Array.isArray(val)) {
                            val = [val];
                        }
                        val.forEach(function(val, index) {
                            if (!fields[index]) {
                                fields.push({});
                            }
                            fields[index][prop] = val;
                        });
                        delete queryObj[queryName];
                    }
                });
                search.queryObj = queryObj;
                search.fields = fields;
            });
            $scope.savedSearches = data.result;
        }, function(err) {
            $scope.error = err;
        });
    };

    $scope.$watchCollection('BCAdminSession', function(newVal) {
        console.debug("the BCAdminSession has loaded", newVal);
        if (newVal && newVal.user) {
            $scope.loadSearches();
        }
    });

    $scope.editFormVisible = false;
    $scope.searchParams = {};

    $scope.editSearch = function(index) {
        var search = $scope.savedSearches[index];
        $scope.searchParams = {
            _id: search._id,
            name: search.name,
            queryObj: angular.copy(search.queryObj),
            fields: angular.copy(search.fields),
            global: search.global,
            index: search.index
        };
        $scope.editFormVisible = true;
    };

    $scope.addQueryParam = function() {
        var paramName = window.prompt("The key must be prefixed with either 'q_' or 'or_q_' depending on how you want to use it.\n" +
                                      "You man also set a '__sort' option, the default is '__sort=updatedAt__desc' (Note that the game " +
                                      "records do not have an updatedAt field, so if you are searching specifically for a game, you muist supply a __sort option)");
        $scope.searchParams.queryObj[paramName] = "";
    };

    $scope.removeQueryParam = function(key) {
        delete $scope.searchParams.queryObj[key];
    };

    $scope.addField = function() {
        $scope.searchParams.fields.push({
            label: "",
            field: "",
            filter: ""
        });
    };

    $scope.removeField = function(index) {
        $scope.searchParams.fields.splice(index, 1);
    };

    $scope.promoteField = function(index) {
        var tmp = $scope.searchParams.fields[index - 1];
        $scope.searchParams.fields[index - 1] = $scope.searchParams.fields[index];
        $scope.searchParams.fields[index] = tmp;
    };

    $scope.demoteField = function(index) {
        var tmp = $scope.searchParams.fields[index + 1];
        $scope.searchParams.fields[index + 1] = $scope.searchParams.fields[index];
        $scope.searchParams.fields[index] = tmp;
    };

    $scope.saveSearch = function() {
        var queryObj = $scope.searchParams.queryObj;
        var query = "search/" + queryObj.collection + '?' ;
        Object.keys(queryObj).forEach(function(key) {
            query += key + '=' + encodeURIComponent(queryObj[key]) + '&';
        });
        $scope.searchParams.fields.forEach(function(field) {
            ['label', 'field', 'filter'].forEach(function(key) {
                if (field.hasOwnProperty(key)) {
                    query += 'c_' + key + '=' + encodeURIComponent(field[key]) + '&';
                }
            });
        });
        $scope.searchParams.query = query;
        delete $scope.searchParams.queryObj;
        var searchToSave = angular.copy($scope.searchParams);
        $http.put(Api.httpUrl + '/save/search/' + searchToSave._id, searchToSave)
            .success(function() {
                $scope.setMessage("Search saved");
                $scope.cancelEdit();
            })
            .error(function(error) {
                $scope.error = error;
            });
    };

    $scope.cancelEdit = function() {
        $scope.error = null;
        $scope.editFormVisible = false;
        $scope.searchParams = {};
        $scope.loadSearches();
    };

    $scope.deleteSearch = function(searchId) {
        if (window.confirm("Are you sre you want to delete this search?")) {
            $http.delete(Api.httpUrl + '/save/search/' + searchId)
                .success(function() {
                    $scope.setMessage("Search removed");
                    $scope.error = null;
                    $scope.editFormVisible = false;
                    $scope.searchParams = {};
                    $scope.loadSearches();
                })
                .error(function(error) {
                    $scope.error = error;
                });
        }
    };

};

Application.Controllers.controller('SavedSearchController', [
    '$scope',
    '$http',
    'Api',
    'MongoQuery',
    SavedSearchController
]);
