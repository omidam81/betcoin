'use strict';

var ejs = require('ejs');
var fs= require('fs');
var logger = require('logger-npm')();

module.exports = function(res) {
    var filename = __dirname + '/../templates/home.ejs';
    logger.info('getting template file %s', filename);
    fs.readFile(filename, {encoding: 'utf8'}, function(err, template) {
        if (err) {
            res.statusCode = 400;
            return res.end();
        }
        logger.debug('read template file');
        try {
            var html = ejs.render(template);
            logger.debug('processed template successfully');
            return res.end(html);
        } catch (ex) {
            res.statusCode = 500;
            return res.end(ex.message);
        }
    });
};
