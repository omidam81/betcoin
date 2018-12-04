'use strict';

module.exports = function(grunt) {
    // @TODO
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-i18n');

    grunt.registerTask('apiconfig', 'Configure api url', function() {
        var apiConfig;
        var prod = grunt.config.get('prod');
        try {
            apiConfig = require('./config/' + prod + '-api.local');
        } catch (err) {
            apiConfig = require('./config/' + prod + '-api.dist');
        }
        var filename = grunt.config.get('build') + '/js/services/resources.js';
        grunt.log.writeln(filename, apiConfig);
        var resourcesJs = grunt.file.read(filename);
        var processed = grunt.template.process(resourcesJs, {data: apiConfig});
        grunt.file.write(filename, processed);
    });

    grunt.initConfig({
        prod: grunt.option('prod'),
        loc: grunt.option('loc'),
        build: 'build/' + grunt.option('loc')+'/'+grunt.option('prod'),
        less: {
            bootstrap: {
                src: 'src/bootstrap/less/bootstrap.less',
                dest: '<%= build %>/css/bootstrap.css'
            },
            app: {
                src: 'src/<%= prod %>/less/app.less',
                dest: '<%= build %>/css/app.css'
            },
            print: {
                src: 'src/<%= prod %>/less/print.less',
                dest: '<%= build %>/css/print.css'
            },
            ie: {
                src: 'src/<%= prod %>/less/ie.less',
                dest: '<%= build %>/css/ie.css'
            }
        },
        concat: {
            bootstrap: {
                src: [
                    'src/bootstrap/js/transition.js',
                    'src/bootstrap/js/alert.js',
                    'src/bootstrap/js/button.js',
                    'src/bootstrap/js/carousel.js',
                    'src/bootstrap/js/collapse.js',
                    'src/bootstrap/js/dropdown.js',
                    'src/bootstrap/js/modal.js',
                    'src/bootstrap/js/tooltip.js',
                    'src/bootstrap/js/popover.js',
                    'src/bootstrap/js/scrollspy.js',
                    'src/bootstrap/js/tab.js',
                    'src/bootstrap/js/affix.js'
                ],
                dest: '<%= build %>/js/lib/bootstrap.js'
            },
        },
        copy: {
            html: {
                files: [
                    /* Copy files */
                    {expand: true, cwd: 'src/<%= prod %>/html', src: '**/**/*', dest: '<%= build %>/'},
                    {expand: true, cwd: 'src/<%= prod %>/', src: 'img/**/**/*', dest: '<%= build %>/'},
                    {expand: true, cwd: 'src/<%= prod %>', src: 'favicon.ico', dest: '<%= build %>/'},
                    {expand: true, cwd: 'tpl/<%= prod %>/'+grunt.option('loc'), src: '**/**/**/**/*.*', dest: '<%= build %>/'},
                    {expand: true, cwd: 'tpljs/<%= prod %>/'+grunt.option('loc'), src: '**/**/**/**/*.*', dest: '<%= build %>/js/templates/'}
                ]
            },
            lib: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        cwd: 'bower_components/',
                        filter: function(filename) {
                            return (/\.min/).test(filename) || (/\.map/).test(filename);
                        },
                        src: '**/**/*',
                        dest: '<%= build %>/js/lib'
                    },
                    {expand: true, cwd: 'src/bootstrap/', src:'fonts/*', dest: '<%= build %>/'}
                ]
            },
            app: {
                files: [
                    {expand: true, cwd: 'src/<%= prod %>', src: 'js/**/**/*.js', dest: '<%= build %>/'}
                ]
            }
        },
        i18n: {
            index: {
                src: ['src/<%= prod %>/html/index.html'],
                options: {
                    locales: 'src/<%= prod %>/locales/*',
                    output: 'tpl/<%= prod %>',
                    base: 'src/<%= prod %>/html'
                }
            },
            templates: {
                src: ['src/<%= prod %>/html/tpl/**/**/*.html'],
                options: {
                    locales: 'src/<%= prod %>/locales/*',
                    output: 'tpl/<%= prod %>',
                    base: 'src/<%= prod %>/html'
                }
            },
            ngdirectives: {
                src: ['src/<%= prod %>/js/templates/**/**/*.html'],
                options: {
                    locales: 'src/<%= prod %>/locales/*',
                    output: 'tpljs/<%= prod %>',
                    base: 'src/<%= prod %>/js/templates'
                }
            }
        },
        clean: ['build/<%= prod %>',"tpl/<%= prod %>","tpljs/<%= prod %>"],
        jshint: {
            files: ['src/<%= prod %>/js/**/*.js'],
            options: {
                ignores: ['src/<%= prod %>/js/vendor/**'],
                jshintrc: true
            }
        },
        watch: {
            bootstrap: {
                files: ['src/<%= prod %>/bootstrap/less/*.less'],
                tasks: ['less:bootstrap']
            },
            appless: {
                files: ['src/<%= prod %>/less/*.less'],
                tasks: ['less:app']
            },
            appjs: {
                files: ['src/<%= prod %>/js/**/**/*'],
                tasks: ['jshint', 'copy:app', 'apiconfig']
            },
            appimg: {
                files: ['src/<%= prod %>/img/**/**/*'],
                tasks: ['copy:html']
            },
            apphtml: {
                files: ['src/<%= prod %>/html/index.html', 'src/<%= prod %>/html/tpl/**/**/*.html', 'src/<%= prod %>/js/templates/**/**/*.html'],
                tasks: ['i18n', 'copy:html']
            },
            locales: {
                files: ['src/<%= prod %>/locales/**/*'],
                tasks: ['i18n', 'copy:html'],
            }
        }
    });
    grunt.registerTask('dist', ['clean', 'i18n', 'less', 'concat', 'jshint', 'copy']);
    grunt.registerTask('default', ['clean', 'jshint', 'i18n', 'less', 'concat', 'copy', 'apiconfig']);



};

