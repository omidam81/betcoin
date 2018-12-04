'use strict';

var send = require('send');
var url = require('url');
var argv = require('yargs')
    .default({port: 3002, loc: 'en_US', prod: false})
    .argv;

var fs = require('fs');

var logger = require('logger-npm')();
var querystring = require('querystring');

var rootDir = __dirname + '/..';

var Crawl = {
    home: require('./routes/home'),
    blog: require('./routes/cms')('blog'),
    press: require('./routes/cms')('press'),
    wiki: require('./routes/cms')('wiki'),
    games: require('./routes/games'),
};

var CLEAN_FRAGMENT_REGEXP = new RegExp("(^/|/$)", 'g');
var processWebCrawl = function(req, res, fragment) {
    var parsedUrl = url.parse(req.url);
    var requestPath = parsedUrl.pathname.split('/');
    var cleanFragment = fragment.replace(CLEAN_FRAGMENT_REGEXP, "");
    var fragmentPath = [];
    if (cleanFragment.length) {
        fragmentPath = cleanFragment.split('/');
    }
    var prod = requestPath[1];
    if (!prod) prod = 'home';
    if (prod === 'home') {
        logger.info('crawl page for home');
        Crawl.home(res);
    } else if (prod === 'blog' || prod === 'wiki' || prod === 'press') {
        if (fragmentPath.length) {
            logger.info('crawl entry %s for %s', fragmentPath[1], prod);
            Crawl[prod].entry(fragmentPath[1], res);
        } else {
            logger.info('crawl list for %s', prod);
            Crawl[prod].list(res);
        }
    } else {
        logger.info('crawl page for %s', prod);
        Crawl.games(prod, res);
    }
};

var responseFunc = function(req, res) {
    var parsedUrl = url.parse(req.url);
    var prod = parsedUrl.pathname.split('/')[1];

    if (req.method === 'OPTIONS' && req.headers['access-control-request-method']) {
        if (req.headers['access-control-request-mothod'] !== 'GET') {
            res.writeHead(403);
            return res.end("invalid request method");
        }
        res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers']);
        res.setHeader('access-control-allow-methods', 'GET');
        res.setHeader('access-control-allow-origin', '*');
        res.writeHead(204);
        return res.end();
    }
    if (req.headers.origin) {
        res.setHeader('access-control-allow-origin', '*');
    }
    var requestPath = parsedUrl.path;
    var query = querystring.parse(parsedUrl.query);
    // if we are getting this request from a web crawler, we d some special shit
    if (query._escaped_fragment_ !== undefined) {
        logger.express('processing crawler fragment %s%s', prod, query._escaped_fragment_);
        return processWebCrawl(req, res, query._escaped_fragment_);
    }
    // otherwise, find and serve a static file
    if (!requestPath) {
        requestPath = '/';
    }
    // get the right directory for the locale
    var indexDir = rootDir + '/build/' + argv.loc;
    fs.readdir(indexDir, function(err) {
        if (err) {
            return (logger.error(err));
        }
        // logger.express("trying to get %s%s", indexDir, requestPath);
        // try to get the actual requested file/directory
        send(req, requestPath).root(indexDir).on('error', function() {
            // if we could not find it
            // if it is a single file, try getting it from the
            // root folder
            if ((/\.[a-z]{1,4}$/).test(req.url)) {
                requestPath = requestPath.replace(new RegExp('^/'+prod),'');
                requestPath = '/' + prod + requestPath;
            }
            // if a "directory" was requested, serve the index
            // file for the "prod"
            else {
                requestPath = '/' + prod + "/index.html";
            }
            // logger.express('failed once, trying %s%s', indexDir,requestPath);
            send(req, requestPath).root(indexDir).on('error', function() {
                // if we fail
                // try getting the file from /home
                requestPath = '/home' + requestPath;
                // logger.express('failed, trying %s%s', indexDir,requestPath);
                send(req, requestPath).root(indexDir).on('error', function() {
                    // if we fail yet again
                    // if a single file was requested, return a
                    // 404, otherwise, send the home page's index
                    // file
                    if ((/\.[a-z]{1,4}$/).test(req.url)) {
                        res.statusCode = 404;
                        // logger.error('404 - %s%s', indexDir, requestPath);
                        res.end('not found');
                    } else {
                        send(req, '/home/index.html').root(indexDir).pipe(res);
                    }
                }).pipe(res);
            }).pipe(res);
        }).pipe(res);
    });
};

var server = require('http').createServer(responseFunc);

server.listen(argv.port, function(err) {
    if (err) { throw err; }
    logger.info('started %s server on port %d', argv.ssl ? 'https' : 'http', argv.port);
});
