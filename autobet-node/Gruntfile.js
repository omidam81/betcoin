'use strict';


module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
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
        watch: {
            jshint: {
                files: ['src/**/*.js', 'src/**/*.json', 'test/*.js'],
                tasks: ['jshint', 'simplemocha']
            }
        },
        simplemocha: {
            backend: {
                src: 'test/*.js',
                options: {
                    log:true,
                    reporter: 'spec',
                    timeout: 20000
                }
            }
        }
    });

    grunt.registerTask('test', [
        'jshint', 'simplemocha'
    ]);
};
