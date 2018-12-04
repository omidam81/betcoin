(function(angular) {
    'use strict';
    var module;
    try {
        module = angular.module('agent.controllers');
    } catch (e) {
        module = angular.module('agent.controllers', []);
    }

    var AgentController = function() {
    };

    module.controller('AgentController', [
        '$scope',
        AgentController
    ]);
})(window.angular);
