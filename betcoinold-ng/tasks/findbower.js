'use strict';

var EventEmitter = require('events').EventEmitter;

module.exports = function(grunt) {
    grunt.registerTask('getBower', function() {
        var rootDir = grunt.config.get('rootDir');
        var done = this.async();
        var ready = new EventEmitter();

        grunt.util.spawn({
            cmd: 'bower',
            args: ['install', '-F'],
            opts: {
                cwd: rootDir
            }
        }, function(err, result, code) {
            if (code !== 0) {
                throw '`bower list\' exited with status ' + code;
            }
            ready.emit('hasdeps');
        });

        ready.on('hasdeps', function() {
            grunt.util.spawn({
                cmd: 'bower',
                args: ['list', '--paths'],
                opts: {
                    cwd: rootDir
                }
            }, function(err, result, code) {
                if (code !== 0) {
                    throw '`bower list\' exited with status ' + code;
                }
                var bowerMap = JSON.parse(result);
                var bowerFiles = {};
                for (var component in bowerMap) {
                    if (bowerMap.hasOwnProperty(component)) {
                        var file = bowerMap[component];
                        if (Array.isArray(file)) {
                            file = file[0];
                        }
                        file = rootDir + '/' + file;
                        if (!(/\.(js|css)$/).test(file) || !grunt.file.exists(file)) {
                            if (grunt.file.exists(file + '/' + component + ".js")) {
                                file = file + "/" + component + ".js";
                            } else {
                                var files = grunt.file.expand(rootDir + '/bower_components/' + component + '/**/*.js');
                                file = files[0];
                            }
                        }
                        var re = new RegExp(rootDir + '/bower_components/' + component);
                        var replace = (/\.css$/).test(file) ? '<%= buildDir %>' : '<%= buildDir %>/js/vendor';
                        grunt.log.writeln(component);
                        if (component === 'angular') {
                            replace = '<%= buildDir %>/js/angular';
                        } else if(component === 'jquery') {
                            replace = '<%= buildDir %>/js/jquery';
                        } else if((/^jquery-/).test(component)) {
                            replace = '<%= buildDir %>/js/jquery-plugin';
                        }
                        var destFile = file.replace(re, replace);
                        if ((/\.js$/).test(file)) {
                            var minfile = file.replace(/\.js$/, '.min.js');
                            var mindest = destFile.replace(/\.js$/, '.min.js');
                            var mapfile, mapdest;
                            if (grunt.file.exists(minfile)) {
                                bowerFiles[mindest] = minfile;
                                if (grunt.file.exists(minfile + '.map')) {
                                    bowerFiles[mindest + '.map'] = minfile + '.map';
                                } else {
                                    mapfile = file.replace(/\.js$/, '.min.map');
                                    mapdest = destFile.replace(/\.js$/, '.min.map');
                                    if (grunt.file.exists(mapfile)) {
                                        bowerFiles[mapdest] = mapfile;
                                    }
                                }
                            } else {
                                minfile = file.replace(/\.js$/, '-min.js');
                                mapfile = file.replace(/\.js$/, '-min.map');
                                mindest = destFile.replace(/\.js$/, '-min.js');
                                mapdest = destFile.replace(/\.js$/, '-min.map');
                                if (grunt.file.exists(minfile)) {
                                    bowerFiles[mindest] = minfile;
                                    if (grunt.file.exists(mapfile)) {
                                        bowerFiles[mapdest] = mapfile;
                                    }
                                } else {
                                    bowerFiles[destFile] = file;
                                }
                            }
                        } else {
                            bowerFiles[destFile] = file;
                        }
                    }
                }
                for (var dest in bowerFiles) {
                    if (bowerFiles.hasOwnProperty(dest)) {
                        bowerFiles[dest] = bowerFiles[dest].replace(rootDir, '<%= rootDir %>');
                    }
                }
                grunt.log.writeln(JSON.stringify(bowerFiles, null, 2));
                grunt.config.set('bowerFiles', bowerFiles);
                done();
            });
        });
    });
};
