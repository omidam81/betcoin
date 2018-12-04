'use strict';

var util = require('util');
var extend = require('deep-extend');
module.exports = function(grunt) {
    grunt.registerTask('unifyLocales', 'Merge common and app locale files', function () {
        var appDir = grunt.config.get('appDir');
        var srcDir = grunt.config.get('srcDir');
        var tmpDir = grunt.config.get('tmpDir');
        var loc = grunt.config.get('loc');

        var output = tmpDir + '/' + loc + '.json';

        var common = require(util.format('%s/locales/%s.json', srcDir, loc));
        common.baseHref = grunt.config.get('baseHref');

        common.baseHrefMarkup = grunt.config.get('baseHrefMarkup');

        console.log(common.baseHref);
        console.log(common.baseHrefMarkup);

        common.prod = grunt.config.get('prod');
        var app;
        try {
            app = require(util.format('%s/locales/%s.json', appDir, loc));
        } catch (ex) {
            grunt.log.warn(util.format('no locale file at %s/locales/%s.json', appDir, loc));
            app = {};
        }
        var unified = extend(common, app);
        grunt.file.write(output, JSON.stringify(unified, null, 2));
    });
};
