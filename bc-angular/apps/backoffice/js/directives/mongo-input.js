'use strict';

var MONGO_INPUT_MODIFIERS = {
    text: [
        {name: "Matches", modifier: ""},
        {name: "Starts With", modifier: "__startswith_"},
        {name: "Contains", modifier: "__contains_"},
        {name: "Exists", modifier: "__exists_"}
    ],
    number: [
        {name: "At least", modifier: "__gte_"},
        {name: "At most", modifier: "__lte_"},
        {name: "Matches", modifier: ""}
    ],
    date: [
        {name: "On or After", modifier: "__gte_"},
        {name: "Before", modifier: "__lt_"}
    ]
};

var MONGO_INPUT_OPTIONS = {
    exists: [
        {name: "Either", value: false},
        {name: "Yes", value: "__exists_true"},
        {name: "No", value: "__exists_false"}
    ]
};

var MongoInput = function($scope) {
    // to name these what we want, we have to hack around angular a
    // bit
    var getQueryKey = function(fieldName) {
        if ($scope.fieldAlias && $scope.selectedModifier.modifier === "__exists_") {
            return ($scope.prefix || 'q') + '_' +
            (fieldName || $scope.field);
        }
        return ($scope.fieldAlias ? 'or_' : '') +
            ($scope.prefix || 'q') + '_' +
            (fieldName || $scope.field);
    };

    var getValue = function() {
        if (!$scope.inputValue) {
            return undefined;
        }
        var valModifier = "";
        if ($scope.selectedModifier.modifier) {
            valModifier = $scope.selectedModifier.modifier;
        } else if (/\|\|/.test($scope.inputValue)) {
            valModifier = '__or_';
        }
        var value = $scope.inputValue;
        if ($scope.transform && 'function' === typeof $scope.transform()) {
            value = $scope.transform()(value);
        }
        return valModifier + value;
    };

    var setQueryObject = function() {
        $scope.queryObject[getQueryKey()] = getValue();
        if ($scope.fieldAlias) {
            $scope.queryObject[getQueryKey($scope.fieldAlias)] = getValue();
        }
    };

    $scope.$watch('inputValue', function(newVal, oldVal) {
        if (newVal) {
            setQueryObject();
        } else if (!newVal && oldVal) {
            $scope.inputValue = "";
            setQueryObject();
        }
    });

    $scope.$watch('selectedOption', function(newVal) {
        if (newVal && newVal.value !== undefined) {
            $scope.inputValue = newVal.value;
        }
    });

    $scope.$watch('selectedModifier', function(newVal) {
        if (newVal && $scope.inputValue) {
            setQueryObject();
        }
    });

    // get and supplied modifiers
    $scope.modifiers = $scope.qModifiers;
    if (!$scope.modifers) {
        // otherwise use the default ones
        $scope.modifiers = MONGO_INPUT_MODIFIERS[$scope.type] || [{name:"Matches", modifier:""}];
    }
    $scope.selectedModifier = $scope.modifiers[0];

    // if options are supplied for a select field, get them
    if (typeof $scope.sOptions === 'string')  {
        $scope.options = MONGO_INPUT_OPTIONS[$scope.sOptions];
    } else {
        $scope.options = $scope.sOptions;
    }
    if (!$scope.options) {
        // otherwise look for defaults
        $scope.options = MONGO_INPUT_OPTIONS[$scope.type] || [];
    }
    $scope.selectedOption = $scope.options[0];

    $scope.$watch('queryObject', function(newVal) {
        if (newVal) {
            if (!$scope.queryObject[getQueryKey()]) {
                $scope.inputValue = "";
                $scope.selectedModifier = $scope.modifiers[0];
                $scope.selectedOption = $scope.options[0];
            } else {
                var value = newVal[getQueryKey()];
                if ($scope.type === 'select') {
                    $scope.options.forEach(function(option, index) {
                        if (option.value === value) {
                            $scope.selectedOption = $scope.options[index];
                        }
                    });
                } else {
                    $scope.modifiers.forEach(function(mod) {
                        var regexp = new RegExp(mod.modifier + "(.*)");
                        var matches = regexp.exec(value);
                        if (!matches) {
                            return;
                        }
                        if (matches[1] && matches[1] !== matches.input) {
                            value = matches[1];
                            $scope.selectedModifier = mod;
                        }
                    });
                    if ($scope.parse && 'function' === typeof $scope.parse()) {
                        value = $scope.parse()(value);
                    }
                    if ('string' === typeof value) {
                        $scope.inputValue = value.replace(/^__or_/, '');
                    } else {
                        $scope.inputValue = value;
                    }
                }
            }
        }
    });
};


var basicTypes  = [
    'text',
    'number',
    'date'
];

Application.Directives.directive('mongoInput', function() {
    return {
        restrict: 'A',
        scope: {
            type: '@',
            field: '@',
            fieldAlias: '@',
            prefix: '@',
            label: '@',
            queryObject: '=',
            sOptions: '=options',
            qModifiers: '=modifiers',
            transform: '&',
            parse: '&'
        },
        templateUrl: function($elem, $attrs) {
            if (basicTypes.indexOf($attrs.type) >= 0) {
                return 'tpl/directives/mongo-input-basic.html';
            } else {
                return 'tpl/directives/mongo-input-' + $attrs.type + '.html';
            }
        },
        controller: [
            '$scope',
            MongoInput
        ]
    };
});
