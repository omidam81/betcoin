'use strict';

module.exports = function(grunt) {
    grunt.registerTask('apiconfig', 'Configure api url', function () {
        var rootDir = grunt.config.get('rootDir');
        var apiConfig = grunt.config.get('confOptions');
        var filename = grunt.config.get('tmpDir') + '/js/base/services/resources.js';
        var resourcesJs, processed;
        if (grunt.file.exists(filename)) {
            grunt.log.writeln(filename, apiConfig);
            resourcesJs = grunt.file.read(filename);
            apiConfig.lang = grunt.option('loc')||'en_US';
            processed = grunt.template.process(resourcesJs, {data: apiConfig});
            grunt.file.write(filename, processed);
        } else {
            grunt.log.writeln("No file found at " + filename);
            grunt.log.writeln("using templates in js/services/resources.js is the preferred method of setting api endpoints for these projects.");
            grunt.log.writeln("Consult the dice project's setup for an example");
        }
    });
    grunt.registerTask('gameconfig', 'Configure game socket', function () {
        var rootDir = grunt.config.get('rootDir');
        var apiConfig = grunt.config.get('confOptions');
        var gameResourceFilename = grunt.config.get('tmpDir') + '/js/app/services/resources.js';
        var gameControllerFilename = grunt.config.get('tmpDir') + '/js/base/inherited/basegame.js';
        var resourcesJs, processed;
        [gameResourceFilename, gameControllerFilename].forEach(function(filename){
            if (grunt.file.exists(filename)) {
                grunt.log.writeln(filename, apiConfig);
                resourcesJs = grunt.file.read(filename);
                processed = grunt.template.process(resourcesJs, {data: apiConfig});
                grunt.file.write(filename, processed);
            } else {
                grunt.log.writeln("No file found at " + filename);
                grunt.log.writeln("using templates in js/services/resources.js is the preferred method of setting api endpoints for these projects.");
                grunt.log.writeln("Consult the dice project's setup for an example");
            }
        })
    });
};
