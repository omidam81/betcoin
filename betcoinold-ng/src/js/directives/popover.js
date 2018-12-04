'use strict';

Application.Directives.directive('bcPopover', [
    function() {
        return {
            restrict:'A',
            scope: true,
            link: function(scope, element, attrs) {
                var init = false;
                attrs.$observe('bcPopover', function(val){
                    if(val === 'true'){
                        $(element).popover({
                            trigger: 'manual',
                            html: true,
                            placement: attrs.bcPopoverDirection === undefined?'bottom':attrs.bcPopoverDirection,
                            content: $(element).siblings('.errors').html()
                        });
                        $(element).popover('show');
                        init = true;
                    }
                    if(val !== 'true' && init){
                        $(element).popover('destroy');
                        init = false;
                    }
                });
            }
        };
    }
]);
