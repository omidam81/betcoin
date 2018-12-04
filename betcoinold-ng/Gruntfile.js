'use strict';
var path = require('path');
module.exports = function (grunt) {
    var rootDir = path.resolve(process.cwd());
    var pjson = require(rootDir + '/package.json');
    var location = grunt.option('loc');
    if (location === undefined) {
        location = 'en_US';
        grunt.log.writeln('No --loc specified, using en_US');
    }
    var prod = grunt.option('prod');
    if (prod === undefined) {
        prod = pjson.name.replace(/-ng$/, '');
    }
    var baseHref = grunt.option('base-href');
    if (baseHref === undefined) {
        baseHref = prod;
        grunt.log.writeln('no --base-href, using ' + prod);
    }

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-include-source');
    grunt.loadNpmTasks('grunt-i18n');
    grunt.loadNpmTasks('grunt-preprocess');
    grunt.loadNpmTasks('grunt-angular-templates');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadTasks(__dirname + '/tasks');
    grunt.initConfig({
        loc: location,
        rootDir: rootDir,
        prodArray: "home,circle",
        baseHref: baseHref,
        srcDir: '<%= rootDir %>/src',
        bowerDir: '<%= rootDir %>/bower_components',
        buildDir: '<%= rootDir %>/build/<%= loc %>/<%= baseHref %>',
        tmpDir: 'tmp',
        less: {
            bootstrap: {
                src: '<%= srcDir %>/bootstrap/less/bootstrap.less',
                dest: '<%= buildDir %>/css/bootstrap.css'
            },
            app: {
                src: '<%= tmpDir %>/less/grunt-build.less',
                dest: '<%= buildDir %>/css/app.css'
            },
            print: {
                src: '<%= srcDir %>/less/print.less',
                dest: '<%= buildDir %>/css/print.css'
            },
            ie: {
                src: '<%= tmpDir %>/less/grunt-build-ie.less',
                dest: '<%= buildDir %>/css/ie.css'
            }
        },
        uglify: {
            app: {
                src:'<%= tmpDir %>/js/concatted.js',
                dest: '<%= buildDir %>/js/app/app.js'
            }
        },
        concat: {
            bootstrap: {
                src: [
                    '<%= srcDir %>/bootstrap/js/transition.js',
                    '<%= srcDir %>/bootstrap/js/alert.js',
                    '<%= srcDir %>/bootstrap/js/button.js',
                    '<%= srcDir %>/bootstrap/js/carousel.js',
                    '<%= srcDir %>/bootstrap/js/collapse.js',
                    '<%= srcDir %>/bootstrap/js/dropdown.js',
                    '<%= srcDir %>/bootstrap/js/modal.js',
                    '<%= srcDir %>/bootstrap/js/tooltip.js',
                    '<%= srcDir %>/bootstrap/js/popover.js',
                    '<%= srcDir %>/bootstrap/js/scrollspy.js',
                    '<%= srcDir %>/bootstrap/js/tab.js',
                    '<%= srcDir %>/bootstrap/js/affix.js'
                ],
                dest: '<%= buildDir %>/js/vendor/bootstrap.js'
            },
            lessvars: {
                src: [
                    '<%= srcDir %>/bootstrap/less/variables.less',
                    '<%= srcDir %>/less/*.less'
                ],
                dest: '<%= tmpDir %>/less/grunt-build.less'
            },
            ie: {
                src: [
                    '<%= srcDir %>/less/ie.less'
                ],
                dest: '<%= tmpDir %>/less/grunt-build-ie.less'
            },
            css: {
                src: [
                    '<%= tmpDir %>/css/bootstrap.css',
                    '<%= tmpDir %>/css/app.css',
                    '<%= tmpDir %>/css/print.css'
                ],
                dest: '<%= buildDir %>/css/app.css'
            },
            app: {
                src: [
                    '<%= tmpDir %>/js/app.js',
                    '<%= tmpDir %>/js/**/*.js'
                ],
                dest: '<%= tmpDir %>/js/concatted.js'
            },
        },
        copy: {
            assets: {
                files: [
                    {expand: true, cwd: '<%= srcDir %>/bootstrap', src: 'fonts/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= srcDir %>', src: 'fonts/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= srcDir %>/html', src: '**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= srcDir %>', src: 'img/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= tmpDir %>/html/<%= loc %>', src: '**/*', dest: '<%= buildDir %>/'},
                ]
            },
            bower: {files: '<%= bowerFiles %>'},
            app: {
                files: [
                    {expand: true, cwd: '<%= srcDir %>/js/', src: '**/*.js', dest: '<%= buildDir %>/js/app'}
                ]
            },
            vendor: {
                files: [
                    {expand: true, cwd: '<%= srcDir %>/vendor/', src: '**/*.js', dest: '<%= buildDir %>/js/vendor'}
                ]
            },
            appTmp: {
                files: [
                    {expand: true, cwd: '<%= srcDir %>/js/', src: '**/*.js', dest: '<%= tmpDir %>/js/app'}
                ]
            },
            appTpl: {
                files: [
                    {expand: true, cwd: '<%= tmpDir %>/js/templates/<%= loc %>', src: '**/*', dest: '<%= buildDir %>/js/templates'},
                ]
            },
            jqueryui: {
                files: [
                    {expand: true, cwd: '<%= bowerDir %>/jquery-ui/themes/ui-darkness', src: 'jquery-ui.css', dest: '<%= buildDir %>/css'},
                    {expand: true, cwd: '<%= bowerDir %>/jquery-ui/themes/ui-darkness', src: 'images/**', dest: '<%= buildDir %>/css'}
                ]
            },
            dist: {
                files: [
                    {expand: true, cwd: '<%= buildDir %>/', src: '**/*', dest: 'dist/<%= loc %>/<%= baseHref %>'}
                ]
            },
            locales: {
                files: [
                    {expand: true, cwd: '<%= srcDir %>/locales/', src: '<%= loc %>.json', dest: '<%= buildDir %>/locales/app/', rename: function(desc){return desc + '/locales.json';}}
                ]
            }
        },
        cssmin: {
            dist: {
                expand: true,
                cwd: '<%= buildDir %>/css',
                src: ['*.css', '!*.min.css'],
                dest: '<%= buildDir %>/css'
            }
        },
        includeSource: {
            all: {
                options: {
                    basePath: '<%= buildDir %>/js',
                    baseUrl: 'js/'
                },
                files: {
                    '<%= buildDir %>/index.html': '<%= buildDir %>/index.html'
                }
            }
        },
        i18n: {
            index: {
                src: ['<%= srcDir %>/html/index.html'],
                options: {
                    locales: '<%= tmpDir %>/<%= loc %>.json',
                    output: '<%= tmpDir %>/html',
                    base: '<%= srcDir %>/html'
                }
            },
            templates: {
                src: ['<%= srcDir %>/html/tpl/**/*.html'],
                options: {
                    locales: '<%= tmpDir %>/<%= loc %>.json',
                    output: '<%= tmpDir %>/html',
                    base: '<%= srcDir %>/html'
                }
            },
            ngdirectives: {
                src: ['<%= srcDir %>/js/templates/**/*.html'],
                options: {
                    locales: '<%= tmpDir %>/<%= loc %>.json',
                    output: '<%= tmpDir %>/js/templates',
                    base: '<%= srcDir %>/js/templates'
                }
            }
        },
        clean: {
            preBuild: ['<%= tmpDir %>/','tpljs/','<%= buildDir %>'],
            postBuild: ['<%= tmpDir %>/','tpljs/'],
            dist: ['dist/<%= loc %>']
        },
        jshint: {
            files: [
                '<%= srcDir %>/js/**/*.js',
                '<%= srcDir %>/locales/**/*.json',
                '<%= srcDir %>/modules/*/js/**/*.js',
                '<%= srcDir %>/modules/*/locales/**/*.json'
            ],
            options: {
                ignores: ['js/vendor/**'],
                jshintrc: true
            }
        },
        watch: {
            bootstrap: {
                files: ['<%= rootDir %>/src/bootstrap/less/*.less'],
                tasks: ['less:bootstrap']
            },
            appless: {
                files: ['<%= srcDir %>/less/*.less'],
                tasks: ['concat:lessvars', 'less:app']
            },
            appjs: {
                files: ['<%= srcDir %>/js/**/**/*'],
                tasks: ['jshint', 'i18n:ngdirectives', 'preprocess:ngtemplates', 'copy:app', 'copy:appTpl', 'apiconfig']
            },
            appimg: {
                files: ['<%= srcDir %>/img/**/**/*'],
                tasks: ['copy:assets']
            },
            apphtml: {
                files: [
                    '<%= srcDir %>/html/index.html',
                    '<%= srcDir %>/html/tpl/**/**/*.html',
                    '<%= srcDir %>/html/tpl/*.html',
                    '<%= srcDir %>/js/templates/**/**/*.html'
                ],
                tasks: ['i18n', 'preprocess:html', 'copy:assets', 'includeSource']
            },
            locales: {
                files: ['<%= srcDir %>/locales/**/*'],
                tasks: ['i18n', 'copy:assets']
            }
        },
        ngtemplates: {
            options: {
                module: "application",
                url: function(url) { return url.replace(grunt.config.get('loc') + '/', ''); }
            },
            app: {
                cwd: '<%= tmpDir %>/html/<%= loc %>',
                src: [
                    'tpl/**/*.html',
                    'tpl/**/*.html',
                    'js/templates/<%= loc %>/**/*.html'
                ],
                dest: '<%= tmpDir %>/js/application.templates.js'
            },
            directives: {
                cwd: '<%= tmpDir %>',
                src: [
                    'js/templates/<%= loc %>/**/*.html'
                ],
                dest: '<%= tmpDir %>/js/directive.templates.js'
            }
        },
        preprocess: {
            options: {
                context: {
                    LOC: location
                }
            },
            html: {
                src: [
                    '<%= tmpDir %>/html/<%= loc %>/**/*.html'
                ],
                options: {inline: true}
            },
            ngtemplates: {
                src: [
                    '<%= tmpDir %>/js/templates/<%= loc %>/**/*.html'
                ],
                options: {inline: true}
            },
            less: {
                src: [
                    '<%= tmpDir %>/less/grunt-build.less'
                ],
                options: { inline: true }
            }
        },
        karma: {
            unit: {
                configFile: '<%= srcDir %>/test/karma-unit.conf.js',
                autoWatch: false,
                singleRun: true
            },
            unitauto: {
                configFile: '<%= srcDir %>/test/karma-unit.conf.js',
                autoWatch: true,
                singleRun: false
            },
            midway: {
                configFile: '<%= srcDir %>/test/karma-midway.conf.js',
                autoWatch: false,
                singleRun: true
            }
        },
        connect: {
            options: {
                base: './'
            },
            testserver: {
                options: {
                    port: 9999
                }
            }
        }
    });
    grunt.registerTask('uni-prep', 'Universal preprocessing tasks', [
        // setup and lint
        'clean:preBuild',
        'clean:postBuild',
        'getBower',
        'jshint',
        // localize, all html moved into tmp
        'unifyLocales',
        'i18n',
        'preprocess:html',
        'preprocess:ngtemplates',
        // concat bootstrap js
        'concat:bootstrap',
        // concat and compile less
        'concat:lessvars',
        'concat:ie',
        'preprocess:less',
        'less',
    ]);
    grunt.registerTask('uni-copy', 'Universal copy operations', [
        'copy:assets',
        'copy:locales',
        'copy:bower',
        'copy:jqueryui',
        'copy:vendor'
    ]);
    grunt.registerTask('uni-finish', 'Universal finishing operations', [
        'apiconfig',
        'includeSource',
    ]);
    var distTasks = [
        'uni-prep',
        // minify css
        'cssmin',
        'uni-copy',
        // copy the app to tmp for minification
        'copy:appTmp',
        'ngtemplates',
        // concat all app files and minify
        'concat:app',
        'uglify:app',
        // finish up
        'uni-finish',
        'googleanalytics',
        'ie10fixconsole'
    ];
    var defaultTasks = [
        'uni-prep',
        'uni-copy',
        // copy all app files so debugging is sane
        'copy:app',
        'copy:appTpl',
        // finish up
        'uni-finish',
        'gadev'
    ];
    distTasks.push('clean:dist', 'copy:dist');
    grunt.registerTask('default', defaultTasks);
    grunt.registerTask('dist', distTasks);
    grunt.registerTask('test', [
        'connect:testserver',
        'karma:unit',
        'karma:midway'
    ]);
    grunt.registerTask('testauto', ['connect:testserver', 'karma:unitauto']);
};