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

    var hiveApp = process.env.HIVEAPP ? true : false;

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
        prod: prod,
        baseHref: baseHref,
        srcDir: '<%= rootDir %>/src',
        bowerDir: '<%= rootDir %>/bower_components',
        buildDir: '<%= rootDir %>/build/<%= loc %>/<%= baseHref %>',
        tmpDir: 'tmp',
        commonDir: '<%= rootDir %>/node_modules/common-ng/src',
        hiveApp: hiveApp,
        less: {
            bootstrap: {
                src: '<%= commonDir %>/bootstrap/less/bootstrap.less',
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
                    '<%= commonDir %>/bootstrap/js/transition.js',
                    '<%= commonDir %>/bootstrap/js/alert.js',
                    '<%= commonDir %>/bootstrap/js/button.js',
                    '<%= commonDir %>/bootstrap/js/carousel.js',
                    '<%= commonDir %>/bootstrap/js/collapse.js',
                    '<%= commonDir %>/bootstrap/js/dropdown.js',
                    '<%= commonDir %>/bootstrap/js/modal.js',
                    '<%= commonDir %>/bootstrap/js/tooltip.js',
                    '<%= commonDir %>/bootstrap/js/popover.js',
                    '<%= commonDir %>/bootstrap/js/scrollspy.js',
                    '<%= commonDir %>/bootstrap/js/tab.js',
                    '<%= commonDir %>/bootstrap/js/affix.js'
                ],
                dest: '<%= buildDir %>/js/vendor/bootstrap.js'
            },
            lessvars: {
                src: [
                    '<%= commonDir %>/bootstrap/less/variables.less',
                    '<%= commonDir %>/less/*.less',
                    '<%= srcDir %>/less/*.less',
                ],
                dest: '<%= tmpDir %>/less/grunt-build.less'
            },
            ie: {
                src: [
                    '<%= commonDir %>/less/ie.less',
                    '<%= srcDir %>/ess/ie.less'
                ],
                dest: '<%= tmpDir %>/less/grunt-build-ie.less'
            },
            css: {
                src: [
                    '<%= tmpDir %>/css/boostrap.css',
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
            common: {
                files: [
                    {expand: true, cwd: '<%= tmpDir %>/common/html/<%= loc %>', src: '**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= commonDir %>', src: 'img/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= commonDir %>/bootstrap', src: 'fonts/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= commonDir %>', src: 'fonts/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= commonDir %>', src: 'sounds/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= commonDir %>', src: 'swf/**/*', dest: '<%= buildDir %>/'}
                ]
            },
            assets: {
                files: [
                    {expand: true, cwd: '<%= srcDir %>/html', src: '**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= srcDir %>', src: 'img/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= tmpDir %>/html/<%= loc %>', src: '**/*', dest: '<%= buildDir %>/'},
                ]
            },
            bower: {files: '<%= bowerFiles %>'},
            commonApp: {
                files: [
                    {expand: true, cwd: '<%= commonDir %>/js', src: '**/*.js', dest: '<%= buildDir %>/js/app'}
                ]
            },
            commonVendor: {
                files: [
                    {expand: true, cwd: '<%= commonDir %>/vendor', src: '**/*.js', dest: '<%= buildDir %>/js/vendor'},
                    {expand: true, cwd: '<%= bowerDir %>/zeroclipboard', src: '*.swf', dest: '<%= buildDir %>/'}
                ]
            },
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
                    {expand: true, cwd: '<%= commonDir %>/js', src: '**/*.js', dest: '<%= tmpDir %>/js/app'},
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
            hiveapp: {
                files: [
                    { expand: true, cwd: '<%= srcDir %>/hiveapp', src: '*', dest: '<%= buildDir %>/' }
                ]
            },
            dist: {
                files: [
                    {expand: true, cwd: '<%= buildDir %>/', src: '**/*', dest: 'dist/<%= loc %>/<%= baseHref %>'}
                ]
            },
            locales: {
                files: [
                    {expand: true, cwd: '<%= srcDir %>/locales/', src: '<%= loc %>.json', dest: '<%= buildDir %>/locales/app/', rename: function(desc){return desc + '/locales.json';}},
                    {expand: true, cwd: '<%= commonDir %>/locales/', src: '<%= loc %>.json', dest: '<%= buildDir %>/locales/common/', rename: function(desc){return desc + '/locales.json';}}
                ]
            },
            provablyFairCode: {
                files: [
                    {expand: true, cwd: '<%= srcDir %>/js/directives', src: 'provably-fair.js', dest: '<%= buildDir %>/js/app/directives'}
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
            commonIndex: {
                src: ['<%= commonDir %>/html/index.html'],
                options: {
                    locales: '<%= tmpDir %>/<%= loc %>.json',
                    output: '<%= tmpDir %>/common/html',
                    base: '<%= commonDir %>/html'
                }
            },
            index: {
                src: ['<%= srcDir %>/html/*.html'],
                options: {
                    locales: '<%= tmpDir %>/<%= loc %>.json',
                    output: '<%= tmpDir %>/html',
                    base: '<%= srcDir %>/html'
                }
            },
            commonTemplates: {
                src: ['<%= commonDir %>/html/tpl/**/*.html'],
                options: {
                    locales: '<%= tmpDir %>/<%= loc %>.json',
                    output: '<%= tmpDir %>/common/html',
                    base: '<%= commonDir %>/html'
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
                '<%= commonDir %>/js/**/*.js',
                '<%= srcDir %>/locales/**/*.json',
                '<%= commonDir %>/locales/**/*.json'
            ],
            options: {
                ignores: ['js/vendor/**', '<%= commonDir %>/js/vendor/**'],
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
                files: ['<%= srcDir %>/js/**/**/*', '<%= commonDir %>/js/**/**/*'],
                tasks: ['jshint', 'i18n:ngdirectives', 'preprocess:ngtemplates', 'copy:commonApp', 'copy:app', 'copy:appTpl', 'apiconfig']
            },
            appimg: {
                files: ['<%= srcDir %>/img/**/**/*'],
                tasks: ['copy:assets']
            },
            apphtml: {
                files: [
                    '<%= srcDir %>/html/*.html',
                    '<%= commonDir %>/html/*.html',
                    '<%= srcDir %>/html/tpl/**/**/*.html',
                    '<%= srcDir %>/html/tpl/*.html',
                    '<%= commonDir %>/html/tpl/**/**/*.html',
                    '<%= srcDir %>/js/templates/**/**/*.html'
                ],
                tasks: ['i18n', 'preprocess:html', 'copy:common', 'copy:assets', 'includeSource']
            },
            locales: {
                files: ['<%= srdDir %>/locales/**/*', '<%= commonDir %>/locales/**/*'],
                tasks: ['i18n', 'copy:common', 'copy:assets']
            }
        },
        ngtemplates: {
            options: {
                module: "application",
                url: function(url) { return url.replace(grunt.config.get('loc') + '/', ''); }
            },
            common: {
                cwd: '<%= tmpDir %>/common/html/<%= loc %>',
                src: [
                    'tpl/**/*.html',
                ],
                dest: '<%= tmpDir %>/js/common.templates.js'
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
        compress: {
            main: {
                options: {
                    mode: 'zip',
                    archive: 'tm.betcoin.<%= prod %>',
                    pretty:  true
                },
                files: [
                    {expand: true, cwd: '<%= buildDir %>/', src: ['**'], dest: './'}, // makes all src relative to cwd
                ]
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
                    '<%= tmpDir %>/html/<%= loc %>/**/*.html',
                    '<%= tmpDir %>/common/html/<%= loc %>/**/*.html'
                ],
                options: {inline: true}
            },
            ngtemplates: {
                src: [
                    '<%= tmpDir %>/js/templates/<%= loc %>/**/*.html',
                    '<%= tmpDir %>/common/js/templates/<%= loc %>/**/*.html'
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
        'copy:common',
        'copy:locales',
        'copy:assets',
        'copy:bower',
        'copy:jqueryui',
        'copy:commonVendor',
        'copy:vendor'
    ]);

    grunt.registerTask('uni-finish', 'Universal finishing operations', [
        'apiconfig',
        'includeSource',
        // 'clean:postBuild',
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
        'ie10fixconsole',
        'copy:provablyFairCode'
    ];

    var defaultTasks = [
        'uni-prep',
        'uni-copy',
        // copy all app files so debugging is sane
        'copy:commonApp',
        'copy:app',
        'copy:appTpl',
        'copy:locales',
        // finish up
        'uni-finish',
        'gadev'
    ];

    if (process.env.HIVEAPP) {
        distTasks.push('copy:hiveapp');
        distTasks.push('compress');
        grunt.registerTask('default', distTasks);
    } else {
        distTasks.push('clean:dist', 'copy:dist');
        grunt.registerTask('default', defaultTasks);
    }

    grunt.registerTask('dist', distTasks);

    grunt.registerTask('exotic', [
        'uni-prep',
        'uni-copy',
        // copy all app files so debugging is sane
        'copy:exoticCommonApp',
        'copy:app',
        'copy:appTpl',
        // finish up
        'uni-finish',
        'preprocess:webapp'
    ]);

    grunt.registerTask('test', [
        'connect:testserver',
        'karma:unit',
        'karma:midway'
    ]);

    grunt.registerTask('testauto', ['connect:testserver', 'karma:unitauto']);
};

