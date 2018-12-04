'use strict';

module.exports = function(grunt) {
    grunt.registerTask('apiconfig', 'Configure api url', function () {
        var rootDir = grunt.config.get('rootDir');
        var apiConfig;
        try {
            apiConfig = require(rootDir + '/config/api.local');
        } catch (err) {
            apiConfig = require(rootDir + '/config/api.dist');
        }
        var filename = grunt.config.get('buildDir') + '/js/app/services/resources.js';
        var singleFilename = grunt.config.get('buildDir') + '/js/app/app.js';
        var resourcesJs, processed;
        if (grunt.file.exists(filename)) {
            grunt.log.writeln(filename, apiConfig);
            resourcesJs = grunt.file.read(filename);
            processed = grunt.template.process(resourcesJs, {data: apiConfig});
            grunt.file.write(filename, processed);
        } else if (grunt.file.exists(singleFilename)) {
            grunt.log.writeln(filename, apiConfig);
            resourcesJs = grunt.file.read(singleFilename);
            processed = grunt.template.process(resourcesJs, {data: apiConfig});
            grunt.file.write(singleFilename, processed);
        } else {
            grunt.log.writeln("No file found at " + filename);
            grunt.log.writeln("using templates in js/services/resources.js is the preferred method of setting api endpoints for these projects.");
            grunt.log.writeln("Consult the dice project's setup for an example");
        }
    });
};
