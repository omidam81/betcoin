'use strict';

/* global _ */

Application.Directives.directive('btcWager', ['$filter', function($filter){
    return {
        require: 'ngModel',
        link: function(scope, element, attrs, ngModel) {
            var inputParser = function (inputValue) {
                // this next if is necessary for when using ng-required on your input.
                // In such cases, when a letter is typed first, this parser will be called
                // again, and the 2nd time, the value will be undefined
                if (inputValue === undefined) {
                    return '';
                }
                if (inputValue === '') {
                    return "";
                }
                var transformedInput = inputValue.replace(/[^0-9.]/g, '');
                if (transformedInput !== inputValue) {
                    ngModel.$setViewValue(transformedInput);
                    ngModel.$render();
                }
                var inputFloat = parseFloat(transformedInput);
                // console.log('translating from input', inputValue, ' -> ', inputFloat.toSatoshi());
                var retval = inputFloat.toSatoshi();
                if(isNaN(retval)) { retval = "0"; }
                return retval;
            };

            var modelToView = function(modelValue) {
                // console.log('translating from model', modelValue, ' -> ', $filter('btc')(modelValue));
                return $filter('btc')(modelValue);
            };

            ngModel.$parsers.push(inputParser);
            ngModel.$formatters.push(modelToView);
        }
    };
}]);

Application.Directives.directive('percentSlider', function() {
    return {
        restrict:'E',
        templateUrl: 'tpl/directives/percent-slider.html',
        scope:{
            percentSliderValue: '=',
            onSliderValueChange: '&'
        },
        link: function(scope, element, attrs) {
            // Linking function.
            var children = element.children();
            var $element = $(children[0]);
            var $bar = $(children[0].children[0].children[0]);
            var $button = $(children[0].children[0].children[1]);
            var step = attrs.step;
            var width;
            var offset;
            var mouseDown = false;
            function calculate(evt) {
                // Calculate distance of the cursor/finger from beginning of slider
                var diff;
                if (evt.pageX) {
                    diff = evt.pageX - offset;
                } else {
                    diff = evt.originalEvent.touches[0].pageX - offset;
                }
                // Allow dragging past the limits of the slider, but impose min/max values.
                if (diff < 0) {
                    scope.percentSliderValue = attrs.min;
                    $bar.width('0%');
                    $button.css('left',"0%");
                } else if (diff > width) {
                    scope.percentSliderValue = attrs.max;
                    $bar.width('100%');
                    $button.css('left',"100%");

                    // Set the value to percentage of slider filled against a max value.
                } else {
                    var percent = diff / width;
                    $bar.width(percent * 100 + '%');
                    $button.css('left',percent * 100 + '%');
                    scope.percentSliderValue = Math.round(percent * attrs.max / step) * step;
                }
                // Let all the watchers know we have updated the slider value.
                scope.$apply();

            }
            if(attrs.disabled === undefined){
                element.on('mousedown touchstart', function() {
                    mouseDown = true;
                    if (!width) {
                        width = $element.width();
                    } if (!offset) {
                        offset = $bar.offset().left;
                    }
                });
                element.on('mouseleave', function() {
                    mouseDown = false;
                });
                element.on('mouseup touchend', function() {
                    mouseDown = false;
                });
                element.on('click', _.throttle(function(evt) {
                    calculate(evt);
                },25));
                // Throttle function to 1 call per 25ms for performance.
                element.on('mousemove touchmove', _.throttle(function(evt) {
                    if (!mouseDown) {
                        // Don't drag the slider on mousemove hover, only on click-n-drag.
                        return;
                    }
                    calculate(evt);
                }, 25));
            }
            scope.$watch('percentSliderValue', function(sliderValue) {
                if(sliderValue > parseInt(attrs.max)) {
                    scope.percentSliderValue = attrs.max;
                    sliderValue = attrs.max;
                }
                if(sliderValue < parseInt(attrs.min)) {
                    scope.percentSliderValue = "0.0";
                    sliderValue = attrs.min;
                }
                $bar.width(sliderValue / attrs.max * 100 + '%');
                $button.css('left', sliderValue / attrs.max * 100 + '%');
                if(scope.onSliderValueChange){
                    scope.onSliderValueChange({newValue: sliderValue});
                }
            });

        }
    };
});
