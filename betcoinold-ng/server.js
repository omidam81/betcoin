'use strict';

var send = require('send');
var url = require('url');
var argv = require('yargs')
        .default({port: 3002, loc: 'en_US', prod: false})
        .argv;
var fs = require('fs');

var rootDir = process.cwd();

var responseFunc = function(req, res) {
    var parsedUrl = url.parse(req.url);
    var prod = parsedUrl.path.split('/')[1];
    if (!prod) {
        prod = 'betcoin';
    }
    var requestPath = parsedUrl.path.replace(new RegExp('^/' + prod), '');
    if (!requestPath) {
        requestPath = '/';
    }
    var indexDir = rootDir + '/' + prod + '-ng/build/' + argv.loc + '/' + prod;
    var sendPath = indexDir;
    fs.readdir(indexDir, function(err) {
        if (err || indexDir === rootDir) {
            indexDir = rootDir + '/build/' + argv.loc + '/betcoin';
            if ((/\.[a-z]{1,4}$/).test(req.url)) {
                requestPath = parsedUrl.path;
            } else {
                requestPath = prod + '/' + requestPath;
            }
            sendPath = indexDir;
        }
        if (argv['as-root']) {
            indexDir = rootDir + '/' + argv.prod + '-ng/build/' + argv.loc + '/' + argv.prod;
            sendPath = indexDir;
        }
        console.log("trying to get %s%s", sendPath, requestPath);
        send(req, requestPath)
            .root(sendPath)
            .on('error', function() {
                console.log('trying %s/index.html', indexDir);
                if ((/\.[a-z]{1,4}$/).test(req.url)) {
                    res.statusCode = 404;
                    console.log('404 - %s%s', sendPath, requestPath);
                    res.end('not found');
                } else {
                    send(req, 'index.html').root(indexDir).pipe(res);
                }
            })
            .pipe(res);
    });
};

var server;

if (argv.ssl) {
    var options = {
        key: fs.readFileSync('config/ssl-cert/server.key'),
        cert: fs.readFileSync('config/ssl-cert/server.crt')
    };
    server = require('https').createServer(options, responseFunc);
} else {
    console.log('running a regular http server, use --ssl option for https');
    server = require('http').createServer(responseFunc);
}

server.listen(argv.port, function(err) {
    if (err) { throw err; }
    console.log('started %s server on port %d', argv.ssl ? 'https' : 'http', argv.port);
});

