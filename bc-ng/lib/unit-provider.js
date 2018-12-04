'use strict';

var dbg = require('debug'),
	debug = dbg('app:units'); // jshint ignore:line

var events		= require('events'),
	util		= require('util'),
	config		= require('./config'),
	pathprov	= require('./path-provider'),
	unitprov	= new events.EventEmitter(),
	Manifest	= require('./Manifest'),
	units		= {},
	proto
	;

unitprov.units = units;

debug('fetching unit bases...');

pathprov.fetch(config.paths.units, function(path_units) {

	var b, unit, numBases, numProcessedBases = 0;

	path_units.read(function(bases) {

		debug('unit bases retrieved');

		numBases = bases.length;
		for(b in bases) path_units.fetchrel(bases[b], processBase);

	});

	function processBase(path) {

		if(path.isDir) {
			unit = new Unit(path);
			units[path.base] = unit;
			unit.on('built', onUnitBuilt);
		} else {
			debug('regular file: '+path);
			++numProcessedBases;
		}

	}

	function onUnitBuilt() {

		if( ++numProcessedBases === numBases ) {
			
			process.nextTick(function() {
				debug('all units built');
				unitprov.emit('unitsBuilt');
			
			});

		}

		debug(numBases - numProcessedBases + ' bases left to process');

	}

});

unitprov.getUnit = function(id) {

	return units[id];

};

util.inherits(Unit, events.EventEmitter);

function Unit(path) {

	this.path = path;

	process.nextTick(function() {

		path.fetchrel('.manifests', function(path_manifests) {

			path_manifests.fetchrel('config.json', function(path_config_manifest) {

				path_config_manifest.fetchrel('./config.js', function(path_config) {

					var config	= path_config.exists ? require(path_config.path) : {},
						m		= new Manifest(path_config_manifest);

					m.addFile(path_config);

				});

			});

		});

	});

}

proto = Unit.prototype;

proto.toString = function() {
	return this.path.toString();
};

module.exports = unitprov;