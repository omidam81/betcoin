'use strict';

var debug		= require('debug')('app:server'),
	timeStart	= Date.now() + (function(){ debug('Initializing...\n============================='); return 0;})(),
	config		= require('./config'),
	express		= require('express'),
	unitprov	= require('./unit-provider'),
	app			= express(),
	lang		= require(config.path_lang)
	;

var ALLOW_ADMIN	= false;
var MAIN_INDEX	= config.unitpath('apps/main/index.ejs');

// Don't serve README.md or manifest.js
app.use(/README\.md|manifest\.js/, function(req, res) {
	res.sendStatus(404).end();
});

app.use('/jquery',		express.static(config.nmpath('jquery/dist')));
app.use('/bootstrap',	express.static(config.nmpath('bootstrap/dist')));
app.use('/angular',		express.static(config.nmpath('angular')));

app.use('/admin', function(req, res, next) {
	
	if(!ALLOW_ADMIN) {
		res.render(config.unitpath('apps/main/index.ejs'), lang);
	} else {
		next();
	}

});

// Render template bundles
app.use(/^.*\/tpl\/\.custom(.*)$'/, function(req, res) {
	res.json(require(config.unitpath(req.path)));
});

// Render individual templates
app.use(/^.*\/tpl\/.*$'/, function(req, res) {
	console.log(req.path);
	res.render(config.unitpath(req.path), lang);
});

// Serve assets in units
app.use(express.static(config.paths.units));

// Request not found in units.path so if it was a resource send 404, if not, just render __common/index

app.use('/admin', function(req, res) {
	if(req.path.split('.')[1]) {
		res.sendStatus(404).end();
	} else {
		res.render(config.unitpath('apps/admin/index.ejs'), lang);
	}
});

app.use('/', function(req, res) {
	if(req.path.split('.')[1]) {
		res.sendStatus(404).end();
	} else {
		res.render(MAIN_INDEX, lang);
	}
});

unitprov.on('unitsBuilt', function() {

	app.listen(config.port, config.ip, function() {
		debug('\n================================================');
		debug('listening @ ' + config.ip + ' on ' + config.port);
		debug('build duration: '+(Date.now()-timeStart) +'\n================================================');
	});	

});