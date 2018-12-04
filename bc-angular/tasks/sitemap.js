'use strict';

var fs = require('fs');
var xml2js = require('xml2js');

module.exports = function(grunt) {
    var hosts = {
        en_US: 'https://www.betcoin.tm/',
        zh_CN: 'https://www.caishentang.com/'
    };
    grunt.registerTask('sitemap', 'Generate sitemaps for apps', function () {
        var done = this.async();
        var locale = grunt.option('loc')||'en_US';
        var rootDir = grunt.config.get('rootDir');
        var apps = grunt.file.expand('apps/*/js/app.js');
        var ignores = ['backoffice'];
        var nonlocaleApps = ['wiki', 'blog', 'press'];
        var urls = [];

        apps.forEach(function(appFile){
            var appName = appFile.split('/')[1];
            try{
                if(ignores.indexOf(appName) !== -1){
                    return;
                }
                var appName = appFile.split('/')[1];
                var localePath;
                if(appName === 'home'){
                    localePath = '';
                }else if (nonlocaleApps.indexOf(appName) !== -1){
                    localePath = appName;
                }else{
                    var localeJsonPath = grunt.config.get('rootDir') + '/apps/' + appName + '/locales/' + locale + '.json';
                    var localeJson = grunt.file.readJSON(localeJsonPath);
                    var fullurl;
                    if(!localeJson.locales){
                        grunt.log.error('missing locales property of the locale json, using default app url', localeJsonPath);
                        localePath = appName;
                    }else{
                        fullurl = localeJson.locales[locale.split('_')[0]].url;
                        localePath = fullurl.split('/')[3];
                    }
                }
                var appsrc = grunt.file.read(appFile);
                var matches = appsrc.match(/when\('.*'/g);
                matches.forEach(function(matchString){
                    var match = matchString.match(/\'.*\'/g);
                    var route = match[0].replace(/\\\'|:.*\?|\'|,.*$/g,'');
                    if(route.indexOf(':') !== -1){
                        return;
                    }
                    var url;
                    if(localePath === ''){
                        url = hosts[locale] + route.replace(/^\//,'');
                    }else{
                        url = hosts[locale] + localePath + route;
                    }
                    urls.push(url);
                });
            }catch(ex){
                grunt.log.error('error generating sitemap for app', appName, ex);
            }
        });

        var parser = new xml2js.Parser();
        var baseSitemap = grunt.file.read(rootDir + '/apps/home/html/sitemap-' + locale + '.xml');
        parser.parseString(baseSitemap, function (err, result) {
            urls.forEach(function(url){
                result.urlset.url.push({loc: [url], lastmod: [new Date().toISOString().slice(0, 10)]});
            });
            var builder = new xml2js.Builder();
            var xml = builder.buildObject(result);
            fs.writeFile(grunt.config.get('tmpDir') + '/html/' + locale + '/sitemap.xml', xml, function(){
                done();
            });
        });
    });
};
