'use strict';

module.exports = function(grunt) {
    var addCode = function(gacode) {
        var filename = grunt.config.get('buildDir') + '/index.html';
        var indexHtml = grunt.file.read(filename);
        var processed = indexHtml.replace('</head>', gacode + '</head>');
        grunt.file.write(filename, processed);
    };

    grunt.registerTask('googleanalytics', 'Configure api url', function () {
        var gacode = '<script>  (function(i,s,o,g,r,a,m){i[\'GoogleAnalyticsObject\']=r;i[r]=i[r]||function(){' +
                '(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),' +
                'm=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)' +
                '})(window,document,\'script\',\'//www.google-analytics.com/analytics.js\',\'googleanalytics\');' +
                'googleanalytics(\'create\', \'UA-48610546-1\', \'betcoin.tm\');' +
                'googleanalytics(\'send\', \'pageview\');';
        if (grunt.config.get('hiveApp')) {
            gacode += 'googleanalytics(\'send\', \'event\', \'hiveapp\', \'' + grunt.config.get('prod') + '\');';
        }
        gacode += '</script>';
        addCode(gacode);
    });

    // add a googleanalytics global object that replaces the production one
    grunt.registerTask('gadev', 'Add ga object for dev purposes', function() {
        var gacode = '<script> window.googleanalytics = function() { console.log(\'google analytics\', arguments); }; </script>';
        addCode(gacode);
    });
};
