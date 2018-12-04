'use strict';

var fs = require('fs');
var path = require('path');
var extend = require('deep-extend');
var merge = require('merge-stream');
var uglify = require('gulp-uglify');
var minifyHtml = require("gulp-minify-html");
var gulp = require('gulp');
var gulpif = require('gulp-if');
var html2js = require('gulp-ng-html2js');
// var insert = require('gulp-insert');
var LessPluginCleanCSS = require("less-plugin-clean-css");
var cleancss = new LessPluginCleanCSS({advanced: true});
var gutil = require('gulp-util');
var ejs = require('gulp-ejs');
var less = require('gulp-less');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var argv = require('yargs')
    .default({
        'build-env': process.env.BUILD_ENV || process.env.NODE_ENV || 'dev',
        'loc': process.env.LOC || 'en_US',
        'conf': process.env.CONF || 'dev',
        'app': process.env.APP || 'betcoin'
    })
    .argv;

var SRC_DIR = './src';

var APP = argv.app;

var COMMON_UNIT_DIR = path.join(SRC_DIR, 'units/common');

var UNIT_DIR = path.join(SRC_DIR, 'units', APP);

var APP_DIR = path.join(SRC_DIR, 'apps', APP);

var BUILD_ENV = argv.buildEnv;
var LOC = argv.loc;

var localeData;
try {
    localeData = require('./' + APP_DIR + '/locales/' + LOC + '.json');
} catch(ex) {
    gutil.log("No locale found for " + APP + " " + LOC);
    localeData = {};
}

var BUILD_DIR = path.join(__dirname, 'build', APP, LOC);

var CONF = argv.conf;

var API_SUBDOMAIN = CONF;
if (CONF === 'live') {
    API_SUBDOMAIN = 'api';
}

// util functions

// test if this is a production build, convenience method for using
// gulp-if
var isProduction = function() {
    return BUILD_ENV === 'production' ||
        BUILD_ENV    === 'prod' ||
        BUILD_ENV    === 'dist' ||
        BUILD_ENV    === 'live'; };

// get folders will return a list of folders in a directory, for
// building apps
var getFolders = function(dir) {
    return fs.readdirSync(dir)
        .filter(function(file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
};

var COMMON_UNITS = getFolders(COMMON_UNIT_DIR);

var getUnits = function() {
    return getFolders(COMMON_UNIT_DIR).concat(getFolders(UNIT_DIR));
};

var getSrcPattern = function(unit, pattern) {
    var dir;
    if (pattern === undefined) {
        dir = path.join(SRC_DIR, unit);
    } else if (unit === 'app') {
        dir = path.join(APP_DIR, pattern);
    } else if (COMMON_UNITS.indexOf(unit) >= 0) {
        dir = path.join(COMMON_UNIT_DIR, unit, pattern);
    } else {
        dir = path.join(UNIT_DIR, unit, pattern);
    }
    return dir;
};

var getDestination = function() {
    var args = Array.prototype.slice.apply(arguments);
    if (args[0] === 'app') {
        args[0] = 'js';
    } else {
        args.unshift('units');
        args.unshift('js');
    }
    args.unshift(BUILD_DIR);
    return path.join.apply(path, args);
};

var getUnitLocale = function(unit) {
    try {
        var unitLocale = require('./' + getSrcPattern(unit, 'locales/' + LOC + '.json'));
        return extend(localeData, unitLocale);
    } catch(e) {
        return localeData;
    }
};

// generators for unit based tasks
var unitTaskGenerators = {
    scripts: function(unit) {
        var tasks = [
            gulp.src([
                getSrcPattern(unit, '/js/**/*.js')
            ])
                .pipe(jshint())
                .pipe(jshint.reporter('default'))
        ];
        // do the module file by itself
        var moduleTask = gulp.src([
            getSrcPattern(unit, '/js/main.js'),
        ])
        // uglify if this is production
            .pipe(gulpif(isProduction(), uglify()))
            .pipe(gulp.dest(getDestination(unit)));
        // push that task to the tasks array
        tasks.push(moduleTask);
        var modules = gulp.src(getSrcPattern(unit, 'js/modules/*.js'))
            .pipe(gulpif(isProduction(), uglify()))
            .pipe(gulp.dest(getDestination(unit, 'modules')));
        tasks.push(modules);
        // concat directories and possibly uglify
        [
            'controllers',
            'directives',
            'filters',
            'services',
            'resources'
        ].forEach(function(type) {
            var task = gulp.src([
                getSrcPattern(unit, '/js/' + type + '/*.js'),
            ])
                .pipe(concat(type + '.js'))
            // uglify if this is production
                .pipe(gulpif(isProduction(), uglify()))
                .pipe(gulp.dest(getDestination(unit)));
            // add tasks to be merged
            tasks.push(task);
        });

        var vendorTask = gulp.src([
            getSrcPattern(unit, '/vendor/*.js'),
        ])
        // uglify if this is production
            .pipe(gulpif(isProduction(), uglify()))
            .pipe(gulp.dest(getDestination(unit, 'vendor')));
        tasks.push(vendorTask);

        return tasks;
    },
    html: function(unit) {
        var task = gulp.src(getSrcPattern(unit, '/html/*.html'))
            .pipe(ejs(getUnitLocale(unit)).on('error', gutil.log))
            .pipe(minifyHtml({
                empty: true,
                spare: true,
                quotes: true
            }))
            .pipe(html2js({
                moduleName: unit + '.templates',
                prefix: '/' + unit + '/'
            }))
            .pipe(concat('templates.js'))
            .pipe(gulpif(isProduction(), uglify()))
            .pipe(gulp.dest(getDestination(unit)));
        return [task];
    },
    modals: function(unit) {
        var task = gulp.src(getSrcPattern(unit, '/html/modals/*.html'))
            .pipe(ejs(getUnitLocale(unit)).on('error', gutil.log))
            .pipe(minifyHtml({
                empty: true,
                spare: true,
                quotes: true
            }))
            .pipe(html2js({
                moduleName: unit + '.templates',
                prefix: '/' + unit + '/modals/'
            }))
            .pipe(concat('modals.js'))
            .pipe(gulpif(isProduction(), uglify()))
            .pipe(gulp.dest(getDestination(unit)));
        return [task];
    },
    directives: function(unit) {
        var task = gulp.src(getSrcPattern(unit, '/html/directives/*.html'))
            .pipe(ejs(getUnitLocale(unit)).on('error', gutil.log))
            .pipe(minifyHtml({
                empty: true,
                spare: true,
                quotes: true
            }))
            .pipe(html2js({
                moduleName: unit + '.templates',
                prefix: '/' + unit + '/directives/'
            }))
            .pipe(concat('directives.js'))
            .pipe(gulpif(isProduction(), uglify()))
            .pipe(gulp.dest(getDestination(unit)));
        return [task];
    },
    less: function(unit) {
        var task = gulp.src(getSrcPattern(unit, '/module.less'))
            .pipe(concat(unit + '.less'))
            .pipe(less({plugins: [cleancss]}))
            .pipe(gulp.dest(path.join(BUILD_DIR, 'css')));
        return [task];
    },
    images: function(unit) {
        var task = gulp.src(getSrcPattern(unit, '/images/**/*'))
            .pipe(gulp.dest(path.join(BUILD_DIR, 'img', unit)));
        return [task];
    }
};

function getUnitTasks(unit, taskGenerator) {
    return taskGenerator(unit);
}

// generate a function for a task
function getUnitsTask(type) {
    if (!unitTaskGenerators[type]) {
        throw new Error("Invalid task generator type: " + type);
    }
    return function() {
        var tasks = [];
        getUnits().forEach(function(unit) {
            tasks.concat(getUnitTasks(unit, unitTaskGenerators[type]));
        });
        return merge(tasks);
    };
}

// these will be the tasks that become dependencies of the 'units'
// psuedo task
var unitTasks = [];
// go through each type of unit task
[
    'scripts',
    'html',
    'directives', // the html part of the directives
    'modals',
    'less',
    'images'
].forEach(function(type) {
    // get a name for the task
    var taskname = 'unit' + type;
    // generate the task type for all of the units
    gulp.task(taskname, getUnitsTask(type));
    // generate a task of this type for each unit
    getUnits().forEach(function(unit) {
        gutil.log("setting up " + unit + type);
        gulp.task(unit + type, function() {
            return merge(getUnitTasks(unit, unitTaskGenerators[type]));
        });
    });
    // push the task name to the psuedo task dependency list
    unitTasks.push(taskname);
});

// units psuedo task
gulp.task('units', unitTasks);


// all application routes get loaded into a single script
gulp.task('routes', function() {
    return gulp.src([
        path.join(UNIT_DIR, '**/js/routes.js')
    ])
        .pipe(concat('routes.js'))
    // uglify if this is production
        .pipe(gulpif(isProduction(), uglify()))
        .pipe(gulp.dest(path.join(BUILD_DIR, 'js')));
});

gulp.task('lib', function() {
    return gulp.src('./src/lib/*.js')
        .pipe(gulpif(isProduction(), uglify()))
        .pipe(gulp.dest(path.join(BUILD_DIR, 'js/lib')));
});

// move an possibly uglify main application scripts
gulp.task('appscripts', function() {
    var tasks = getUnitTasks('app', unitTaskGenerators.scripts);

    var mainScripts = gulp.src([
        getSrcPattern('app', 'js/main.js'),
        getSrcPattern('app', 'js/app.js')
    ])
    // uglify if this is production
        .pipe(gulpif(isProduction(), uglify()))
        .pipe(gulp.dest(path.join(BUILD_DIR, 'js')));
    tasks.push(mainScripts);

    var apiSubdomain = gulp.src(getSrcPattern('app', 'js/server.js'))
        .pipe(ejs({apiSubdomain: API_SUBDOMAIN}, {ext: '.js'}))
        .pipe(gulpif(isProduction(), uglify()))
        .pipe(gulp.dest(path.join(BUILD_DIR, 'js')));
    tasks.push(apiSubdomain);

    var modules = gulp.src(getSrcPattern('app', 'js/modules/*.js'))
        .pipe(gulpif(isProduction(), uglify()))
        .pipe(gulp.dest(path.join(BUILD_DIR, 'js/modules')));
    tasks.push(modules);

    return merge(tasks);

});

gulp.task('apphtml', function() {
    return merge(getUnitTasks('app', unitTaskGenerators.html));
});

gulp.task('appmodals', function() {
    return merge(getUnitTasks('app', unitTaskGenerators.modals));
});

gulp.task('appdirectives', function() {
    return merge(getUnitTasks('app', unitTaskGenerators.directives));
});

gulp.task('indexHtml', function() {
    gulp.src(getSrcPattern('app', '/index.html'))
        .pipe(ejs(localeData).on('error', gutil.log))
        .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('appless', function() {
    var plugins = [];
    // only minify the css if we are doing a production build
    if (isProduction()) {
        plugins.push(cleancss);
    }
    gulp.src(getSrcPattern('app', 'less/main.less'))
        .pipe(less({
            plugins: plugins
        }).on('error', gutil.log))
        .pipe(gulp.dest(path.join(BUILD_DIR, 'css')));
});

gulp.task('appimages', function() {
    gulp.src(getSrcPattern('app', 'images/**/*'))
        .pipe(gulp.dest(path.join(BUILD_DIR, 'img')));
});

// core psuedo task
gulp.task('core', [
    'routes',
    'lib',
    'indexHtml',
    'appscripts',
    'apphtml',
    'appmodals',
    'appdirectives',
    'appless',
    'appimages'
]);

// by default, run core then units
gulp.task('default', [
    'core',
    'units'
]);

gulp.task('watch', function() {
    var units = getUnits();
    units.unshift('app');
    units.forEach(function(unit) {
        gutil.log('generating watch tasks for ' + unit);
        gulp.watch([
            getSrcPattern(unit, 'js/**/*'),
            getSrcPattern(unit, 'vendor/*.js')
        ], [unit + 'scripts', 'routes']);
        gulp.watch(getSrcPattern(unit, 'html/*.html'), [unit + 'html']);
        gulp.watch(getSrcPattern(unit, 'html/directives/*.html'), [unit + 'directives']);
        gulp.watch(getSrcPattern(unit, 'html/modals/*.html'), [unit + 'modals']);
        gulp.watch(getSrcPattern(unit, 'less/**/*.less'), [unit + 'less']);
        gulp.watch(getSrcPattern(unit, 'images/**/*'), [unit + 'images']);
    });
    gutil.log('generating watch tasks for core');
    gulp.watch('./src/lib/*.js', ['lib']);
    gulp.watch(getSrcPattern('app', 'locales/*.json'), [
        'indexHtml',
        'apphtml',
        'appdirectives',
        'appmodals',
        'unithtml',
        'unitdirectives',
        'unitmodals'
    ]);
});
