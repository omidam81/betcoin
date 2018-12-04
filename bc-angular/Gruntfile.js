'use strict';

var path = require('path');

var extend = require('deep-extend');
module.exports = function (grunt) {

    var rootDir = path.resolve(process.cwd());


    var conf;
    var confOption = grunt.option('conf');
    if(!confOption) {
        confOption = "live";
        grunt.log.writeln('--conf OPTION NOT SPECIFIC, using "live"');
    }
    var confFile = rootDir + '/config/' + confOption;
    try {
        conf = require(confFile);
    } catch (ex) {
        grunt.log.writeln('ERROR could not find conf file ' + confFile);
        return;
    }


    var folderOption;

    var prod = grunt.option('prod');
    if (prod === undefined) {
        grunt.log.writeln('ERROR YOU MUST SPECIFY --prod OPTION (ex: home,circle,dice)');
        return;
    }

    var configs;
    try{
        configs = require(rootDir + '/devapps/'+prod+'/config');
        folderOption = 'devapps';
    }catch(ex){
        configs = require(rootDir + '/apps/'+prod+'/config');
        folderOption = 'apps';
    }

    var confOptions = extend(conf,configs);
    var location = grunt.option('loc');
    if (location === undefined) {
        location = 'en_US';
        grunt.log.writeln('No --loc specified, using en_US');
    }

    var baseHref = configs.appname[location];
    if (baseHref === undefined) {
        grunt.log.writeln('FATAL config is missing appname for this language');
        return;
    }

    var cdnRootUrl = "/";
    var cdnAppUrl = "../";
    var cdnRootTplUrl = "";
    var cdnAppTplUrl = prod;
    var cdn = grunt.option('cdn');
    if (cdn) {
        if( location === "en_US") {

        grunt.log.writeln('ENGLISH CDN');
            cdnRootUrl = "https://luck.betcoin.tm/";
            cdnRootTplUrl = "https://luck.betcoin.tm/";
            cdnAppUrl = "https://luck.betcoin.tm/" + baseHref + '/';
            cdnAppTplUrl = "https://luck.betcoin.tm/" + baseHref + '/';
        } else if (location === "zh_CN") {
        grunt.log.writeln('CHINESE CDN');
            cdnRootUrl = "https://s.caishentang.com/";
            cdnRootTplUrl = "https://s.caishentang.com/";
            cdnAppUrl = "https://s.caishentang.com/" + baseHref + '/';
            cdnAppTplUrl = "https://s.caishentang.com/" + baseHref + '/';
        }
    }

    var baseHrefMarkup = baseHref+'/';
    if(baseHrefMarkup === "home/") {
        baseHrefMarkup = "";
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
    grunt.loadNpmTasks('grunt-sed');

    grunt.loadTasks(__dirname + '/tasks');

    grunt.initConfig({
        loc: location,
        rootDir: rootDir,
        folderOption: folderOption,
        prod: prod,
        cdnRootUrl: cdnRootUrl,
        cdnAppUrl: cdnAppUrl,
        baseHref: baseHref,
        baseHrefMarkup: baseHrefMarkup,
        appDir: '<%= rootDir %>/<%= folderOption %>/<%= prod %>',
        srcDir: '<%= rootDir %>/src',
        // bowerDir: '<%= rootDir %>/bower_components',
        buildDir: '<%= rootDir %>/build/<%= loc %>/<%= baseHref %>',
        tmpDir: 'tmp',
        hiveApp: hiveApp,
        confOptions:confOptions,
        less: {
            bootstrap: {
                src: '<%= srcDir %>/bootstrap/less/bootstrap.less',
                dest: '<%= buildDir %>/css/bootstrap.css'
            },
            app: {
                files: {
                    '<%= buildDir %>/css/app.css': '<%= tmpDir %>/less/grunt-build.less'
                }
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
                    '<%= srcDir %>/bootstrap/js/spin.js',
                    '<%= srcDir %>/bootstrap/js/ladda.js',
                    '<%= srcDir %>/bootstrap/js/affix.js'
                ],
                dest: '<%= tmpDir %>/js/base/vendor/bootstrap.js'
            },
            lessvars: {
                src: [
                    '<%= srcDir %>/bootstrap/less/variables.less',
                    '<%= srcDir %>/less/common.less',
                    '<%= srcDir %>/less/*.less',
                    '<%= appDir %>/less/*.less'
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
            js: {
                src: [
                    "<%= tmpDir %>/js/base/vendor/**/*.js",
                    "<%= tmpDir %>/js/base/inherited/**/*.js",
                    "<%= tmpDir %>/js/app/app-vendor/**/*.js",
                    "<%= tmpDir %>/js/base/app.js",
                    "<%= tmpDir %>/js/app/app.js",
                    "<%= tmpDir %>/js/base/lib/*.js",
                    "<%= tmpDir %>/js/base/controllers/*.js",
                    "<%= tmpDir %>/js/base/directives/*.js",
                    "<%= tmpDir %>/js/base/filters/*.js",
                    "<%= tmpDir %>/js/base/services/*.js",
                    "<%= tmpDir %>/js/base/navigation/*.js",
                    "<%= tmpDir %>/js/app/services/*.js",
                    "<%= tmpDir %>/js/app/controllers/*.js",
                    "<%= tmpDir %>/js/app/directives/*.js",
                    "<%= tmpDir %>/js/app/filters/*.js",
                    "<%= tmpDir %>/js/application.templates.js"
                ],
                dest: '<%= tmpDir %>/js/app.js'
            }
        },
        uglify: {
            app: {
                src:'<%= tmpDir %>/js/app.js',
                dest: '<%= buildDir %>/js/app/app.js'
            }
        },
        copy: {
            assets: {
                files: [
                    {expand: true, cwd: '<%= srcDir %>/html', src: '**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= appDir %>/html', src: '**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= srcDir %>/bootstrap', src: 'fonts/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= srcDir %>', src: 'img/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= appDir %>', src: 'img/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= srcDir %>', src: 'fonts/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= srcDir %>', src: 'sounds/**/*', dest: '<%= buildDir %>/'},
                    {expand: true, cwd: '<%= tmpDir %>/html/<%= loc %>', src: '**/*', dest: '<%= buildDir %>/'},
                ]
            },
            // bower: {files: '<%= bowerFiles %>'},
            appFiles: {
                files: [
                    {expand: true, cwd: '<%= srcDir %>/js/', src: '**/*.js', dest: '<%= tmpDir %>/js/base/'},
                    {expand: true, cwd: '<%= appDir %>/js/', src: '**/*.js', dest: '<%= tmpDir %>/js/app/'}
                ]
            },
            js: {
                files: [
                    {expand: true, cwd: '<%= tmpDir %>/js/', src: '**/*.js', dest: '<%= buildDir %>/js/'}
                ]
            },
            appTpl: {
                files: [
                    {expand: true, cwd: '<%= tmpDir %>/js/templates/<%= loc %>', src: '**/*', dest: '<%= buildDir %>/js/templates'},
                ]
            },
            // jqueryui: {
            //     files: [
            //         {expand: true, cwd: '<%= bowerDir %>/jquery-ui/themes/ui-darkness', src: 'jquery-ui.css', dest: '<%= buildDir %>/css'},
            //         {expand: true, cwd: '<%= bowerDir %>/jquery-ui/themes/ui-darkness', src: 'images/**', dest: '<%= buildDir %>/css'}
            //     ]
            // },
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
                    {expand: true, cwd: '<%= appDir %>/locales/', src: '<%= loc %>.json', dest: '<%= buildDir %>/locales/app/', rename: function(desc){return desc + '/locales.json';}},
                    {expand: true, cwd: '<%= srcDir %>/locales/', src: '<%= loc %>.json', dest: '<%= buildDir %>/locales/common/', rename: function(desc){return desc + '/locales.json';}}
                ]
            },
            provablyFairCode: {
                files: [
                    {expand: true, cwd: '<%= appDir %>/js/directives', src: 'provably-fair.js', dest: '<%= buildDir %>/js/app/directives'}
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
                    basePath: '<%= buildDir %>',
                    baseUrl: ''
                },
                files: {
                    '<%= buildDir %>/index.html': '<%= buildDir %>/index.html'
                }
            }
        },
        i18n: {
            index: {
                src: ['<%= srcDir %>/html/*.html'],
                options: {
                    locales: '<%= tmpDir %>/<%= loc %>.json',
                    output: '<%= tmpDir %>/html',
                    base: '<%= srcDir %>/html'
                }
            },
            baseTemplates: {
                src: ['<%= srcDir %>/html/tpl/**/*.html'],
                options: {
                    locales: '<%= tmpDir %>/<%= loc %>.json',
                    output: '<%= tmpDir %>/html',
                    base: '<%= srcDir %>/html'
                }
            },
            appTemplates: {
                src: ['<%= appDir %>/html/tpl/**/*.html'],
                options: {
                    locales: '<%= tmpDir %>/<%= loc %>.json',
                    output: '<%= tmpDir %>/html',
                    base: '<%= appDir %>/html'
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
                '<%= appDir %>/js/**/*.js',
                '<%= srcDir %>/locales/**/*.json',
            ],
            options: {
                ignores: ['<%= appDir %>/js/app-vendor/**','<%= srcDir %>/js/vendor/**'],
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
                tasks: ['jshint', 'i18n:ngdirectives', 'preprocess:ngtemplates', 'copy:inherited', 'copy:vendor', 'copy:base', 'copy:app', 'copy:appTpl', 'apiconfig', 'gameconfig']
            },
            appimg: {
                files: ['<%= srcDir %>/img/**/**/*'],
                tasks: ['copy:assets']
            },
            apphtml: {
                files: [
                    '<%= srcDir %>/html/*.html',
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
            app_zh_CN: {
                cwd: '<%= tmpDir %>/html/<%= loc %>',
                src: [
                    'tpl/**/*.html'
                ],
                dest: '<%= tmpDir %>/js/application.templates.js',
                filter: function(f) { return f.indexOf("-en.html") < 0; }
            },
            app_en_US: {
                cwd: '<%= tmpDir %>/html/<%= loc %>',
                src: [
                    'tpl/**/*.html'
                ],
                dest: '<%= tmpDir %>/js/application.templates.js',
                filter: function(f) { return f.indexOf("-cn.html") < 0; }
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
                    LOC: location,
                    cdnRootUrl: cdnRootUrl,
                    cdnAppUrl: cdnAppUrl
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
        },
        sed: {
            cdnroot: {
                path: '<%= buildDir %>',
                pattern: 'src="img',
                replacement: 'src="' + cdnAppUrl + 'img',
                recursive: true
            },
            cdnapp: {
                path: '<%= buildDir %>',
                pattern: 'src="../img',
                replacement: 'src="' + cdnAppUrl + 'img',
                recursive: true
            },
            cdnjs: {
                path: '<%= buildDir %>/index.html',
                pattern: 'src="js',
                replacement: 'src="' + cdnAppUrl + 'js'
            }
        }
    });

    var localesFile = rootDir + '/src/locales/' + location + '.json';

    grunt.registerTask('localesUpdate', function () {
        if (!grunt.file.exists(localesFile)) {
            grunt.log.error("file " + localesFile + " not found");
            return true;
        }
        var locale = grunt.file.readJSON(localesFile);

        locale.cdnRootUrl = cdnRootTplUrl;
        locale.cdnAppUrl = cdnAppTplUrl;

        grunt.file.write(localesFile, JSON.stringify(locale, null, 2));

    });

    grunt.registerTask('uni-prep', 'Universal preprocessing tasks', [
        // setup and lint
        // 'localesUpdate',
        'clean:preBuild',
        'clean:postBuild',
        // 'getBower',
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
        'less'
    ]);

    grunt.registerTask('uni-copy', 'Universal copy operations', [
        'copy:locales',
        'copy:assets',
        'copy:appFiles',
        'apiconfig',
        'gameconfig'
    ]);

    var unifinishTasks = [
        'includeSource'
    ];

    if (cdn) {
        unifinishTasks.push('sed');
    }

    grunt.registerTask('uni-finish', 'Universal finishing operations', unifinishTasks);

    var distTasks = [
        'uni-prep',
        // minify css
        'cssmin',
        'sitemap',
        'uni-copy',
        // copy the app to tmp for minification
        // 'copy:baseTmp',
        // 'copy:appTmp',
        'ngtemplates:app_'+location,
        // concat all app files and minify
        // 'concat:app',
        // 'uglify:app',
        // finish up
        'concat:js',
        'uglify:app',
        'copy:appTpl',
        'copy:locales',
        'uni-finish',
        'copy:provablyFairCode',
        'googleanalytics',
        'ie10fixconsole'
    ];

    var defaultTasks = [
        'uni-prep',
        'uni-copy',
        // copy all app files so debugging is sane
        'copy:js',
        'copy:appTpl',
        'copy:locales',
        // finish up
        'uni-finish',
        'gadev'
    ];
    grunt.registerTask('default', defaultTasks);

    grunt.registerTask('dist', distTasks);

    grunt.registerTask('test', [
        'connect:testserver',
        'karma:unit',
        'karma:midway'
    ]);

    grunt.registerTask('testauto', ['connect:testserver', 'karma:unitauto']);
};
