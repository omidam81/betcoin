'use strict';

var debug	= require('debug')('app:Unit.Dir'), // jshint ignore:line
	fs		= require('fs'),
	pjoin	= require('path').join,
	pbase	= require('path').basename,
	prel	= require('path').relative,
	events	= require('events'),
	config	= require('./config'),
	cache	= {},
	proto
	;

proto			= Path.prototype;
proto.fetch		= exports.fetch		= fetch;
proto.fetchSync	= exports.fetchSync	= fetchSync;

proto.toString = function() {
	
	return this.path;

};

proto.fetchrel = function(uri, callback) {

	fetch(pjoin( this.path, uri ), function(path) {
		callback(path);
	});

};

proto.fetchrelSync = function(uri) {

	return fetchSync(pjoin(this.path, uri));

};

proto.stat = function(callback) {

	var self = this;

	fs.stat(self.path, function(stats) {
		
		self.stats = stats;
		
		callback(stats);

	});

};

proto.read = function(callback) {

	if(this.isFile) {
		
		fs.readFile( this.path, processCallback);

	} else if(this.isDir) {
		
		fs.readdir( this.path, processCallback );

	} else {

		callback(null);

	}

	function processCallback(err, data) {
		
		if(err) throw err;

		callback(data);
	
	}

};

proto.getHash = function() {

	if(this.isFile) {
		
	}

};

function fetch(pathstr, callback) {

	var path = cache[pathstr];

	if(path) return callback(path);

	fs.stat(pathstr, function(err, stats) {

		path = new Path(pathstr, stats);
		cache[pathstr] = path;
		callback(path);

	});

}

function fetchSync(pathstr) {

	var path = cache[pathstr];

	if(!path) {
		path = new Path(pathstr, fs.statSync(pathstr));
		cache[pathstr] = path;
	}

	return path;

}



function Path(path, stats) {

	var self = this;

	self.path	= path;
	self.relpath = prel(config.paths.root, path);
	self.base	= pbase(path);
	self.stats	= stats;

	if(stats) {
		
		self.exists	= true;
		self.isDir	= stats.isDirectory();
		self.isFile	= stats.isFile();
		self.watcher = new events.EventListener();
		self.watcher.start = startWatching;

	} else {

		self.exists	= false;
		self.isDir	= false;
		self.isFile	= false;
		
		self.watcher = {
			on: throwNoWatcherException,
			once: throwNoWatcherException,
			start: throwNoWatcherException
		};

	}

	function throwNoWatcherException() {

		throw new Error( self.toString() + ' cannot be watched because it is not a directory' );

	}

	function startWatching() {

		if( self.exists ) {
			startWatchingThis();
		} else {
			startWatchingParent();
		}

	}

	function startWatchingThis() {

	}

	function startWatchingParent() {

	}

}