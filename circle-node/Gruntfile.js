'use strict';


module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

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
        watch: {
            jshint: {
                files: ['src/**/*.js', 'src/**/*.json'],
                tasks: ['jshint']
            }
        }
    });

    grunt.registerTask('test', [
        'jshint'
    ]);
};
