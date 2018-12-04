'use strict';

module.exports = function (grunt) {
    var specFile = grunt.option('spec');
    var matchTest = grunt.option('match');
    var REPORTER = grunt.option('reporter') || 'spec';
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-nodemon');

    grunt.initConfig({
        env:{
            test:{
                NODE_ENV: 'test'
            }
        },
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
                src: specFile == null?'test/*.js':specFile,
                options: {
                    log:true,
                    reporter: REPORTER,
                    timeout: 2000,
                    grep: matchTest
                }
            }
        },
        watch: {
            scripts: {
                files: ['routes/*.js', 'controllers/*.js', 'lib/*.js', 'test/*.js', '*.js'],
                tasks: ['simplemocha']
            },
        },
        nodemon: {
            dev: {
                script: 'app.js',
                options: {
                    // args: ['development'],
                    nodeArgs: ['--debug'],
                    ignoredFiles: ['README.md', 'node_modules/**'],
                    watchedExtensions: ['js'],
                    delayTime: 10,
                    legacyWatch: true,
                    env: {
                        PORT: '8443'
                    },
                    cwd: __dirname
                }
            }
        }
    });

    // Default task.
    grunt.registerTask('default', ['env:test', 'simplemocha']);
    grunt.registerTask('test-monitor', ['env:test', 'watch']);
    grunt.registerTask('dev', ['nodemon']);
    grunt.registerTask('test', ['jshint']);
};

