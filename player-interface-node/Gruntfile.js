'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.initConfig({
        jshint: {
            files: [
                '*.js',
                '*.json'
            ],
            options: {
                jshintrc: true
            }
        },
        watch: {
            scripts: {
                files: ['test/*.js', 'lib/*.js'],
                tasks: ['simplemocha']
            },
        }
    });

    // Default task.
    grunt.registerTask('test', ['jshint']);
};

