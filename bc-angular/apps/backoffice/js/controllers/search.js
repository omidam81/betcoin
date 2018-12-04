'use strict';

var SearchController = function($scope, $routeParams, $location, $http, MongoQuery, Api) {
    $scope.loading = true;
    $scope.collection = $routeParams.searchType;
    $scope.searchTemplate = 'tpl/search/' + $scope.collection + '.html';
    $scope.tableTemplate = 'tpl/search/' + $scope.collection + '-table.html';
    $scope.queryGo = true;

    $scope.toggleUserSelect = function(userId) {
        var index = $scope.selectedUsers.indexOf(userId);
        if (index < 0) {
            $scope.selectedUsers.push(userId);
            if ($scope.listData && $scope.listData.result) {
                $scope.listData.result.forEach(function(record) {
                    if (record._id === userId) {
                        record.selected = true;
                    }
                    if (record.user && record.user._id === userId) {
                        record.user.selected = true;
                    }
                });
            }
        } else {
            $scope.selectedUsers.splice(index, 1);
            if ($scope.listData && $scope.listData.result) {
                $scope.listData.result.forEach(function(record) {
                    if (record._id === userId) {
                        record.selected = false;
                    }
                    if (record.user && record.user._id === userId) {
                        record.user.selected = false;
                    }
                });
            }
        }
        if ($scope.selectedUsers.length === $scope.listData.result.length) {
            $scope.selectAll = true;
        } else {
            $scope.selectAll = false;
        }
    };

    $scope.$watchCollection('range', function(range) {
        console.debug(range);
        if (range && range.start && range.end) {
            if ($scope.collection === 'transaction') {
                $scope.query.q_createdAt = [
                    '__gte_' + range.start.toISOString(),
                    '__lt_' + range.end.toISOString()
                ];
            }
        }
    });

    $scope.toggleSelectAll = function() {
        $scope.selectAll = !$scope.selectAll;
        if ($scope.listData && $scope.listData.result) {
            $scope.listData.result.forEach(function(record) {
                var user;
                if (record.user) {
                    user = record.user;
                } else if ($scope.collection === 'user') {
                    user = record;
                }
                if (user) {
                    user.selected = $scope.selectAll;
                    var index = $scope.selectedUsers.indexOf(user._id);
                    if (user.selected) {
                        if (index < 0) {
                            $scope.selectedUsers.push(user._id);
                        }
                    } else {
                        $scope.selectedUsers.splice(index, 1);
                    }
                }
            });
        }
    };

    $scope.$watchCollection('BCAdminSession', function(newVal) {
        console.debug("the BCAdminSession has loaded", newVal);
        if (newVal && newVal.user) {
            MongoQuery.get({
                collection: 'saved_search',
                pageSize: 100,
                page: 1,
                __sort: ['index__asc', 'createdAt_asc'],
                or_q_adminId: $scope.BCAdminSession.user._id,
                // q_adminId: $scope.BCAdminSession.user._id,
                or_q_global: true
            }, function(data) {
                $scope.error = null;
                $scope.savedSearches = data.result;
            }, function(err) {
                $scope.error = err;
            });
        }
    });

    var DEFAULT_QUERY = {
        'collection': $scope.collection,
        'pageSize': 100,
        'page': 1,
        '__sort': 'updatedAt__desc',
        'showIgnored': false
    };

    if ($scope.collection !== 'user') {
        DEFAULT_QUERY.mapUsers = true;
    }

    $scope.getSchema = function() {
        $http.get(Api.httpUrl + '/schema/' + $scope.collection).success(function(data) {
            $scope.schema = data;
            $scope.sortOptions = Object.keys(data);
        }).error(function(err) {
            $scope.error = err;
        });
    };

    $scope.query = angular.extend({}, $location.search());
    $scope.query = angular.extend(angular.extend({}, DEFAULT_QUERY), $scope.query);
    $scope.query.page = parseInt($scope.query.page, 10);
    $scope.query.pageSize = parseInt($scope.query.pageSize, 10);
    $scope.query.showIgnored = ($scope.query.showIgnored === "true" || $scope.query.showIgnored === true) ? true : false;
    $scope.range = {};
    if (angular.isArray($scope.query.q_createdAt)) {
        console.debug(JSON.stringify($scope.query.q_createdAt));
        $scope.query.q_createdAt.forEach(function(condition) {
            var matches = (/(__gte_|__lt_)(.*)/).exec(condition);
            if (matches.length) {
                if (matches[1] === "__gte_") {
                    $scope.range.start = new Date(matches[2]);
                } else if(matches[1] === "__lt_"){
                    $scope.range.end = new Date(matches[2]);
                }
            }
        });
    }
    console.debug("collection", $scope.collection);
    $scope.searchName = $scope.query.searchName;
    delete $scope.query.searchName;
    $scope.fields = [];

    $scope.showJson = function(data) {
        $scope.currentJson = data;
    };

    $scope.hideJson = function() {
        $scope.currentJson = null;
    };

    var sortParts = $scope.query.__sort.split("__");
        $scope.sortForm = {
            field: sortParts[0],
            direction: sortParts[1]
        };
        if ($scope.collection) {
            ['label', 'field', 'filter'].forEach(function(prop) {
                var queryName = 'c_' + prop;
                if ($scope.query.hasOwnProperty(queryName)) {
                    var val = $scope.query[queryName];
                    if (!Array.isArray(val)) {
                        val = [val];
                    }
                    val.forEach(function(val, index) {
                        if (!$scope.fields[index]) {
                            $scope.fields.push({});
                        }
                        $scope.fields[index][prop] = val;
                    });
                }
            });
            $scope.getSchema();
        } else {
            console.debug("no collection, showing query builder");
            $scope.showQueryBuilder =  true;
            $scope.queryBuilderStep = 0;
            $scope.queryGo = false;
        }

        $scope.hasTableTemplate = ([
            'user',
            'transaction',
            'logs',
            'bet',
            'reel'
        ].concat($scope.GAMES).indexOf($scope.collection) >= 0) && $scope.fields.length === 0;

        // if this is a game, use the game table template if no fields are
        // defined in the query
        if (['bet', 'reel'].concat($scope.GAMES).indexOf($scope.collection) >= 0) {
            $scope.tableTemplate = 'tpl/search/game-table.html';
            if ($scope.query.__sort === DEFAULT_QUERY.__sort) {
                $scope.query.__sort = 'createdAt__desc';
            }
            $scope.searchTemplate = 'tpl/search/game.html';
            $scope.gameName = $scope.collection;
            if ($scope.collection === 'bet') {
                $scope.gameName = 'lottery';
            } else if ($scope.collection === 'reel') {
                $scope.gameName = 'reels';
            } else if ($scope.collection === 'threecard') {
                $scope.gameName = '3card';
            }
        }

    // Query Builder Functions
    $scope.queryBuilderStep0 = function() {
        $scope.getSchema();
        $scope.query.collection = $scope.collection;
        $scope.queryBuilderStep = 1;
        $scope.qForm = {key:'', value: ''};
        $scope.tmpQuery = {};
        // catch for games to add/change some defaults
        if (['bet', 'reel'].concat($scope.GAMES).indexOf($scope.collection) >= 0) {
            $scope.tableTemplate = 'tpl/search/game-table.html';
            if ($scope.query.__sort === DEFAULT_QUERY.__sort) {
                $scope.query.__sort = 'createdAt__desc';
            }
            $scope.tmpQuery.q_client_seed = "__exists_true";
        }
    };

    $scope.addQueryTerm = function() {
        $scope.tmpQuery[$scope.qForm.key] = $scope.qForm.value;
        $scope.qForm = {key:'', value: ''};
    };

    $scope.removeQueryTerm = function(key) {
        delete $scope.tmpQuery[key];
    };

    $scope.queryBuilderStep1 = function() {
        $scope.query = angular.extend($scope.query, $scope.tmpQuery);
        $scope.fields = [];
        $scope.tForm = {
            label: '',
            field: '',
            filter: ''
        };
        $scope.queryBuilderStep = 2;
    };

    $scope.addTableColumn = function() {
        $scope.fields.push(angular.copy($scope.tForm));
        $scope.tForm = {
            label: '',
            field: '',
            filter: ''
        };
    };

    $scope.removeTableColumn = function(index) {
        $scope.fields.splice(index, 1);
    };

    $scope.queryBuilderStep2 = function() {
        $scope.query.c_label = [];
        $scope.query.c_field = [];
        $scope.query.c_filter = [];
        $scope.fields.forEach(function(tableColumn) {
            $scope.query.c_label.push(tableColumn.label);
            $scope.query.c_field.push(tableColumn.field);
            $scope.query.c_filter.push(tableColumn.filter);
        });
        $location.path('search/' + $scope.collection).search($scope.query);
    };

    $scope.updateSort = function() {
        $scope.query.__sort = $scope.sortForm.field + "__" + $scope.sortForm.direction;
    };

    // search function, will change page if passed an argument
    $scope.submitSearch = function(page) {
        if (page !== undefined) {
            $scope.query.page = page;
        } else {
            $scope.query.page = 1;
        }
        $scope.currentPage = $scope.query.page;
        $scope.error = null;
        console.log($scope.collection, 'search submitted');
        // change the query here so we can use the browser back button
        // to get back to the same search
        $location.search($scope.query);
    };

    $scope.pageChange = function(page) {
        $scope.currentPage = page;
        console.debug("page change ", $scope.query.page, " -> ", $scope.currentPage);
        if ($scope.loading || $scope.currentPage === $scope.query.page) { return; }
        console.debug("page change", $scope.currentPage);
        $scope.submitSearch($scope.currentPage);
    };

    $scope.reset = function() {
        $scope.query = angular.copy(DEFAULT_QUERY);
    };

    $scope.cryptoTransform = function(value) {
        return parseFloat(value).toSatoshi();
    };

    $scope.currencyOptions = [{name: "all", value: false}];
    $scope.CURRENCIES.forEach(function(currency) {
        $scope.currencyOptions.push({name: currency, value: currency});
    });

    $scope.resetEmailAlert = function() {
        $scope.alertFormVisible = false;
        $scope.emailAlert = {
            name: $scope.collection + " search",
            condition: 'is empty',
            collection: $scope.collection,
            interval: '15 minutes'
        };
    };

    $scope.resetEmailAlert();

    $scope.saveEmailAlert = function() {
        if ($location.url().indexOf('?') < 0 || $location.url().replace(/^.*\?/, '').length < 10) {
            $scope.error = {message:"You cannot save this search, get a query string up there"};
            return;
        }
        if (!$scope.alertFormVisible) {
            $scope.alertFormVisible = true;
            return;
        }
        var emailAlert = angular.copy($scope.emailAlert);
        console.log($location.url());
        emailAlert.query = $location.url();
        $http.post(Api.httpUrl + '/save/alert', emailAlert)
            .success(function() {
                console.debug(arguments);
                $scope.setMessage("Email alert saved");
                $scope.error = null;
                $scope.resetEmailAlert();
            })
            .error(function(error) {
                $scope.error = error;
            });
    };

    $scope.resetSearchForm = function() {
        $scope.saveFormVisible = false;
        $scope.searchParams = {
            name: $scope.searchName || '',
            global: false,
        };
    };

    $scope.resetSearchForm();

    $scope.saveSearch = function() {
        if ($location.url().indexOf('?') < 0 || $location.url().replace(/^.*\?/, '').length < 10) {
            $scope.error = {message:"You cannot save this search, get a query string up there"};
            return;
        }
        if (!$scope.saveFormVisible) {
            $scope.saveFormVisible = true;
            return;
        }
        var searchToSave = angular.copy($scope.searchParams);
        console.log($location.url());
        searchToSave.query = $location.url();
        $http.post(Api.httpUrl + '/save/search', searchToSave)
            .success(function() {
                console.debug(arguments);
                $scope.setMessage("Search saved");
                $scope.error = null;
                $scope.resetSearchForm();
            })
            .error(function(error) {
                $scope.error = error;
            });
    };


    $scope.cancelMessage = function() {
        $scope.messageFormVisible = false;
        $scope.selectedUsers = [];
        if ($scope.listData && $scope.listData.result) {
            $scope.listData.result.forEach(function(record) {
                record.selected = false;
                if (record.user) {
                    record.user.selected = false;
                }
            });
        }
        $scope.messageForm = {
            subject: '',
            message: '',
            sendEmail: true
        };
    };

    $scope.cancelMessage();

    $scope.sendMessage = function() {
        if (!$scope.selectedUsers.length) {
            $scope.error = {message:"You must select some users"};
            return;
        }
        if (!$scope.messageFormVisible) {
            $scope.messageFormVisible = true;
            return;
        }
        var message = angular.copy($scope.messageForm);
        message.userIds = $scope.selectedUsers.slice();
        $http.post(Api.httpUrl + '/message', message)
            .success(function() {
                console.debug(arguments);
                $scope.setMessage("Message sent");
                $scope.error = null;
                $scope.cancelMessage();
            })
            .error(function(error) {
                $scope.error = error;
            });
    };




    // now at the end, if there is a query, do it
    if ($scope.queryGo) {
        MongoQuery.get($scope.query, function(data) {
            $scope.listData = data;
            $scope.loading = false;
            $scope.currentPage = $scope.query.page;
        }, function(err) {
            $scope.error = err;
        });
    }

};

Application.Controllers.controller('SearchController', [
    '$scope',
    '$routeParams',
    '$location',
    '$http',
    'MongoQuery',
    'Api',
    SearchController
]);
