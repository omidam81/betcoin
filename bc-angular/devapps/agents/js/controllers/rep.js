(function(angular, Application) {
    'use strict';

    var RepController = function($scope, $routeParams) {
        console.debug($routeParams);
        var repId = $routeParams.id;
        if (repId) {
            $scope.templateUrl = 'tpl/rep/detail.html';
        } else {
            $scope.templateUrl = 'tpl/rep/list.html';
        }
    };

    var RepListController = function($scope, $location, Rep, WelcomePack) {
        $scope.reps = Rep.query({}, function() {
            $scope.welcomePacks = WelcomePack.query({}, function () {
                $scope.reps.forEach(function(rep) {
                    rep.income = {};
                    $scope.welcomePacks.forEach(function(wp) {
                        Object.keys(wp.income).forEach(function(currency) {
                            console.debug(wp.income, currency);
                            if (!rep.income[currency]) {
                                rep.income[currency] = 0;
                            }
                            if (rep._id === wp.repId) {
                                rep.income[currency] += wp.income[currency];
                            }
                        });
                    });
                });
            });
        });
        $scope.newRep = new Rep();

        $scope.errorVisible = {};

        $scope.validatePassword = function () {
            if ($scope.errorVisible.isNotEqual) {
                $('.password-notmatch').removeClass('hide');
            } else {
                $('.password-notmatch').addClass('hide');
            }
            console.debug($scope);
            $scope.errorVisible.isNotEqual = ($scope.newRep.password !== $scope.newRep.passwordConfirm) ? true : false;
            $scope.passwordPopup = ($scope.affForm.password.$invalid&&$scope.affForm.password.$dirty);
            $scope.confirmPasswordPopup = $scope.affForm.passwordConfirm.$dirty&&$scope.errorVisible.isNotEqual;
        };

        $scope.formatPhoneNumber = function() {
            var phone = $scope.newRep.phone;
            if (!phone) {return;}
            phone = phone.replace(/[^0-9]+/g, '');
            var result = "";
            var length = phone.length;
            console.debug(phone, length);
            if (length >= 4) {
                // we have at least 4 digits
                result = '-' + phone.slice(length - 4);
                if (length >= 7) {
                    result = phone.slice(length - 7, length - 4) + result;
                    if (length >= 10) {
                        result = '(' + phone.slice(length - 10, length - 7) + ') ' + result;
                    } else {
                        result = phone.slice(0, length - 7) + result;
                    }
                    if (length >= 11) {
                        // we have a full number with country code
                        result = '+' + phone.slice(0, length - 10) + ' ' + result;
                    }
                } else {
                    result = phone.slice(0, length - 4) + result;
                }
            } else {
                result = phone;
            }
            $scope.newRep.phone = result;
        };

        $scope.checkEmail = function() {
            $scope.emailPopup = $scope.affForm.email.$invalid&&$scope.affForm.email.$dirty;
        };

        $scope.saveRep = function() {
            $scope.newRep.phone = $scope.newRep.phone.replace(/[^0-9]+/g, '');
            $scope.newRep.$save(function() {
                $location.path('/rep/' + $scope.newRep._id);
            });
        };
    };

    var RepDetailController = function($scope, $routeParams, Rep, WelcomePack) {
        var repId = $routeParams.id;
        $scope.welcomePacks = WelcomePack.query({
            repId: $routeParams.id,
        }, function() {
            $scope.income = {};
            $scope.affiliates = $scope.welcomePacks.filter(function(wp) {
                Object.keys(wp.income).forEach(function(currency) {
                    if (!$scope.income[currency]) {
                        $scope.income[currency] = 0;
                    }
                    if (repId === wp.repId) {
                        $scope.income[currency] += wp.income[currency];
                    }
                });
                return wp.userId;
            }).length;
        });
        $scope.unassignedWelcomePacks = WelcomePack.unassigned();
        $scope.rep = Rep.get({_id: $routeParams.id});
        $scope.registerPack = function(index) {
            var welcomePack = $scope.unassignedWelcomePacks.splice(index, 1)[0];
            welcomePack.repId = repId;
            welcomePack.$save(function() {
                $scope.welcomePacks.push(welcomePack);
            });
        };
    };

    Application.Controllers.controller('RepController', [
        '$scope',
        '$routeParams',
        RepController
    ]);

    Application.Controllers.controller('RepListController', [
        '$scope',
        '$location',
        'Rep',
        'WelcomePack',
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
