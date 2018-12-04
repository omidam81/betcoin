(function(angular, Application) {
    'use strict';

    var AgentsController = function($scope, $routeParams, Agent) {
        if (!$routeParams.section) {
            $scope.section = 'new';
        } else {
            $scope.section = $routeParams.section;
        }
        $scope.templateUrl = 'tpl/agents/' + $scope.section + '.html';

        $scope.newAgent = {};

        $scope.saveNewAgent = function() {
            var agent = new Agent($scope.newAgent);
            agent.$save(function() {
                console.debug(arguments);
                $scope.newAgent = {};
            });
        };
    };

    var AgentListController = function($scope, Agent) {
        $scope.agentList = Agent.query();
    };

    var AgentDetailController = function($scope, $routeParams, Agent, WelcomePack) {
        var agentId = $scope.agentId = $routeParams.id;
        $scope.agent = Agent.get({_id: agentId});
        $scope.welcomePacks = WelcomePack.query({agentId: agentId});
        $scope.newWelcomePack = new WelcomePack({agentId: agentId});

        $scope.saveAgent = function() {
            $scope.agent.$save();
        };

        $scope.registerPack = function() {
            $scope.newWelcomePack.$save(function() {
                $scope.welcomePacks.push($scope.newWelcomePack);
                $scope.newWelcomePack = new WelcomePack({agentId: agentId});
            });
        };
    };

    Application.Controllers.controller('AgentsController', [
        '$scope',
        '$routeParams',
        'Agent',
        AgentsController
    ]);

    Application.Controllers.controller('AgentListController', [
        '$scope',
        'Agent',
        AgentListController
    ]);

    Application.Controllers.controller('AgentDetailController', [
        '$scope',
        '$routeParams',
        'Agent',
        'WelcomePack',
        AgentDetailController
    ]);

})(window.angular, window.Application);
