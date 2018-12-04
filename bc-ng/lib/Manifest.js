'use strict';

function Manifest(path) {
	
	if(path.exists && path.isDir) {

		throw new Error(path.toString() + ' cannot be used as a manifest because it is a directory.');

	}

	this.path	= path;
	this.files	= {};
	this.dirs	= {};

}

module.exports = Manifest;