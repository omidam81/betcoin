'use strict';

module.exports = function (grunt) {
    var REPORTER = grunt.option('reporter') || 'spec';
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.option('stack', true);

    grunt.initConfig({
        jshint: {
            files: [
                'src/**/*.js',
                'src/**/*.json',
                'test/**/*.js'
            ],
            options: {
                jshintrc: true
            }
        },
        simplemocha: {
            // testfiles: {
            //     src: 'src/**/test.js',
            //     options: {
            //         log:true,
            //         reporter: REPORTER,
            //         timeout: 15000
            //     }
            // },
            // containertestfiles: {
            //     src: 'src/**/container-test.js',
            //     options: {
            //         log: true,
            //         reporter: REPORTER,
            //         timeout: 15000
            //     }
            // },
            models: {
                src: 'test/models/*.js',
                options: {
                    log:true,
                    reporter: REPORTER,
                    timeout: 15000
                }
            },
            api: {
                src: 'test/api.js',
                options: {
                    log:true,
                    reporter: REPORTER,
                    timeout: 15000
                }
            }
        },
        watch: {
            scripts: {
                files: ['src/**/*.js', 'test/**.js'],
                tasks: ['jshint', 'simplemocha']
            },
        }
    });

    // Default task.
    grunt.registerTask('default', ['jshint', 'simplemocha']);
    grunt.registerTask('test', ['jshint', 'simplemocha']);
    grunt.registerTask('testwatch', ['jshint', 'simplemocha', 'watch']);
};
