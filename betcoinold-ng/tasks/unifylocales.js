'use strict';

var util = require('util');
var extend = require('deep-extend');
module.exports = function(grunt) {
    grunt.registerTask('unifyLocales', 'Merge common and app locale files', function () {
        var tmpDir = grunt.config.get('tmpDir');
        var loc = grunt.config.get('loc');
        var prodArray = grunt.config.get('prodArray').split(",");
        var unified = {};

        var commonDir = grunt.config.get('srcDir');
        var unified = require(util.format('%s/locales/%s.json', commonDir, loc));

        for(var i=0;i<prodArray.length;i++) {
            var prod = prodArray[i];
            var srcDir = grunt.config.get('srcDir')+"/modules/"+prod;
            var app;
            try {
                app = require(util.format('%s/locales/%s.json', srcDir, loc));
            } catch (ex) {
                grunt.log.warn(util.format('no locale file at %s/locales/%s.json', srcDir, loc));
                app = {};
            }
            unified = extend(common, app);
        }
        var output = tmpDir + '/' + loc + '.json';
        grunt.file.write(output, JSON.stringify(unified, null, 2));
    });
};
