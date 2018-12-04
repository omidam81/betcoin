'use strict';

Application.Directives.directive('bcPopover', [
    function() {
        return {
            restrict:'A',
            link: function(scope, element, attrs) {
                var init = false;
                var timer = 0;

                attrs.$observe('bcPopover', function(val){
                    var content;
                    if(val === 'true'){
                        setTimeout(function() {
                            if(attrs.bcPopoverContent){
                                content = attrs.bcPopoverContent;
                            }else{
                                content = $(element).siblings('.errors').html();
                            }
                            if (!init) {
                                $(element).popover({
                                    trigger: 'manual',
                                    html: true,
                                    placement: attrs.bcPopoverDirection === undefined ? 'bottom' : attrs.bcPopoverDirection,
                                    content: content
                                });
                            }
                            $(element).popover('show');
                            init = true;
                            if (attrs.noTimeout === 'true') {
                                $(element).popover('show');
                            } else {
                                timer = setTimeout(function () {
                                    if (init) {
                                        $(element).popover('destroy');
                                        init = false;
                                    }
                                }, 5000);
                            }
                        }, 100);
                    }
                    if(val !== 'true' && init){
                        $(element).popover('destroy');
                        init = false;
                        if(timer) {
                            clearTimeout(timer);
                            timer = 0;
                        }
                    }
                });
            }
        };
    }
]);
