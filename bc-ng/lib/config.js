'use strict';

var debug	= require('debug')('app:config'),
	path	= require('path'),
	util	= require('util'),
	config	= {
		api:	'pro',
		ip:		'127.0.0.1',
		loc:	'en_US',
		port:	3002,
		hot:	false
	}
	;

processArgs();

config.paths		= {};
config.paths.root	= path.join(__dirname, '..');

config.paths.units	= path.join(config.paths.root, 'units');

config.paths.nm		= path.join(config.paths.root, 'node_modules');

// this should dynamically use --loc switch, always en for now
config.path_lang	= unitpath('common/locales/en/lang.json'); 

for(var i in config) {
	if(i === 'paths') {
		for(var p in config[i]) {
			debug( 'path.'+p+' '+util.inspect(config[i][p],{colors:true}) );
		}
	} else {
		debug( i +' '+util.inspect(config[i],{colors:true}) );
	}
}

config.rootpath = rootpath;
config.unitpath = unitpath;

function rootpath(apath) {
	return path.join(config.paths.root, apath);
}

function unitpath(apath) {
	return path.join(config.paths.units, apath);
}

config.nmpath = function(apath) {
	return path.join(config.paths.nm, apath);
};

function processArgs() {

	var s, args = process.argv.slice(2);

	debug('args '+args);

	while( (s = args.shift()) ) {
		
		switch(s) {
			
			case '--port':
				config.port = args.shift();
				break;
			
			case '--ip':
				config.ip = args.shift();
				break;

			case '--hot':
				config.hot = true;
				break;

			case '--api':
				config.api = args.shift();
				break;
				
		}

	}

}

module.exports = config;