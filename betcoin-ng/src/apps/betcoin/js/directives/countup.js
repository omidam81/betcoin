(function(angular) {
	'use strict';
    var module;
    try {
        module = angular.module('app.directives');
    } catch (e) {
        module = angular.module('app.directives', []);
    }

	var DU_DELAY	= 75;	// DOM Update Delay (milliseconds) - how often do we update DOM
	var DURATION	= 3000; // Count Duration (milliseconds) - how long we should take to count up to the new target
	var EXP_EASE	= 5;  // Easing Exponent (exponent) - slow down as we approach target

	var stack = [];
	var tstak = [];

	function update() {
		var scope, delta;
		tstak = stack;
		stack = [];
		while( (scope = tstak.pop()) ) {
			delta = (scope.endTime-Date.now())/DURATION;
			if(delta < 0 || scope.diff <= 0) {
				scope.curVal = scope.tgtVal;
				scope.isCounting = false;
			} else {
				scope.curVal = scope.tgtVal - Math.pow(delta,EXP_EASE) * scope.diff;
				stack.push(scope);
			}

			scope.update();
		}
		if(stack.length) {
			setTimeout(update, DU_DELAY);
		}
	}

	function parseInput(str) {
        if (str === undefined) {
            return str;
        }
		var r = parseFloat(str);
		return isNaN(r) ? 0 : r;
	}

	module.directive('bcCountup', [
		'$filter',
		function($filter) {
			return {
				replace: true,
				restrict: 'E',
				scope: {
					value:		'=',
					symbol:		'@',
					filter:		'@',
					decimals:	'@',
					zeropad:	'='
				},
				link: function(scope, el) {
					scope.el = el[0];
					scope.curVal = parseInput(scope.value);
					scope.tgtVal = scope.curVal;
					scope.diff = 0;
					scope.isCounting = false;
					scope.filterFunc = $filter(scope.filter);
					scope.update = function() {
						var html = scope.symbol;
                        if (scope.curVal === undefined) {
                            html += 0;
                        } else {
						    if(scope.filter) {
							    html += scope.filterFunc(scope.curVal, scope.decimals, scope.zeropad);
						    } else {
							    html += scope.curVal;
						    }
                        }
						scope.el.innerHTML = html;
					};
					scope.update();
					scope.$watch('value', function(newVal) {
						if(newVal !== undefined) {
                            if (scope.curVal === undefined) {
                                scope.curVal = parseInput(newVal);
                                update();
                                return;
                            }
							newVal = parseInput(newVal);
							scope.tgtVal	= newVal;
							scope.diff		= scope.tgtVal - scope.curVal;
							scope.endTime	= Date.now()+DURATION;
							if(!scope.isCounting) {
								scope.isCounting = true;
								stack.push(scope);
								if(stack.length === 1) {
									update();
								}
							}
						}
					});
				}
			};
		}
	]);

})(window.angular);
