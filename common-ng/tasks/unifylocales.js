'use strict';

var util = require('util');
var extend = require('deep-extend');
module.exports = function(grunt) {
    grunt.registerTask('unifyLocales', 'Merge common and app locale files', function () {
        var commonDir = grunt.config.get('commonDir');
        var srcDir = grunt.config.get('srcDir');
        var tmpDir = grunt.config.get('tmpDir');
        var loc = grunt.config.get('loc');

        var output = tmpDir + '/' + loc + '.json';

        var common = require(util.format('%s/locales/%s.json', commonDir, loc));
        common.baseHref = grunt.config.get('baseHref');
        var app;
        try {
            app = require(util.format('%s/locales/%s.json', srcDir, loc));
        } catch (ex) {
            grunt.log.warn(util.format('no locale file at %s/locales/%s.json', srcDir, loc));
            app = {};
        }
        var unified = extend(common, app);
        grunt.file.write(output, JSON.stringify(unified, null, 2));
    });
};
