(function(angular) {
	'use strict';
    var module;
    try {
        module = angular.module('app.directives');
    } catch (e) {
        module = angular.module('app.directives', []);
    }

    var activeModal;

    var ModalController = function($scope, $modal) {
        $scope.open = function(modal) {
            var modalConf = {
                templateUrl: '/app/modals/' + modal + '.html',
                controller: $scope.controller,
                size: $scope.size
            };
            if ($scope.resolve) {
                modalConf.resolve = $scope.resolve;
            }
            // if there is an active modal up, dismiss it first
            if (activeModal) {
                activeModal.dismiss('new modal');
            }

            var modalInstance = $modal.open(modalConf);
            activeModal = modalInstance;

            modalInstance.result.then(function(result) {
                if ($scope.onOk) {
                    $scope.onOk({result: result});
                }
            }, function(reason) {
                activeModal = null;
                if (reason !== 'new modal') {
                    if ($scope.onCancel) {
                        $scope.onCancel({reason: reason});
                    }
                }
            });
        };
    };

    module.directive('bcModal', [
		function() {
			return {
				replace: true,
				restrict: 'A',
                transclude: true,
				scope: {
                    modal: '@bcModal',
                    onOk: '&',
                    onCancel: '&',
                    controller: '@',
                    size: '@',
                    resolve: '='
				},
                template: '<a ng-click="open(modal)" ng-transclude></a>',
                controller: [
                    '$scope',
                    '$modal',
                    ModalController
                ]
			};
		}
	]);

})(window.angular);
