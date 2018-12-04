'use strict';

module.exports = function(grunt) {
    var addCode = function(code) {
        var filename = grunt.config.get('buildDir') + '/index.html';
        var indexHtml = grunt.file.read(filename);
        var processed = indexHtml.replace('</head>', code + '</head>');
        grunt.file.write(filename, processed);
    };

    grunt.registerTask('ie10fixconsole', 'What the actual fuck microsoft', function () {
        var code = '<script type="text/javascript">' +
                'var consoleNoop = function(){};' +
                'if(typeof console === "undefined") { ' +
                'console = {log:consoleNoop,error:consoleNoop,debug:consoleNoop,warn:consoleNoop};}' +
                '</script>';
        addCode(code);
    });
};
