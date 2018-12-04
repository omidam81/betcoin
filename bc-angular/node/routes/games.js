'use strict';

var ejs = require('ejs');
var fs = require('fs');

var get = function(game, res) {
    var filename = __dirname + '/../templates/' + game + '.ejs';
    fs.readFile(filename, {encoding: 'utf8'}, function(err, template) {
        if (err) {
            return get('home', res);
        }
        try {
            var html = ejs.render(template);
            return res.end(html);
        } catch (ex) {
            res.statusCode = 500;
            return res.end(ex.message);
        }
    });
};
module.exports = get;
