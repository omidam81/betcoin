'use strict';

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-simple-mocha');

    grunt.initConfig({
        jshint: {
            files: [
                'src/**/*.js',
                'src/**/*.json'
            ],
            options: {
                jshintrc: true
            }
        },
        simplemocha: {
            backend: {
                src: 'test/*.js',
                options: {
                    log:true,
                    reporter: 'spec',
                    timeout: 2000
                }
            }
        }
    });

    grunt.registerTask('test', [
        'jshint', 'simplemocha'
    ]);
};
