'use strict';

var crypto = require('crypto');

function Hash() {

	var paths = {};

	this.addPath = function(path) {

		paths.push(path);

	};

	var reader = dir.createReader();
	var shasum	= crypto.createHash('sha1');
	var	digests	= {},
			count	= 0,
			ordered_bases
			;

	reader.on('bases', function(bases) {
	
		count = bases.length;
		ordered_bases = bases.sort();

	});

	reader.on('file', function(info) {

		var fshasum = crypto.createHash('sha1'),
			rstream	= fs.createReadStream(info.path)			
			;
			
		rstream.on('data', function(d) { shasum.update(d); });
		
		rstream.on('end', function() {

			digests[info.base] = fshasum.digest('binary');

			if( ++count === ordered_bases.length ) sendDigest();

		});

	});

	this.genHash = function(callback) {
		
		reader.read();

		function sendDigest() {
			
			var i;

			for(i in ordered_bases) shasum.update( digests[ordered_bases[i]] );

			callback( shasum.digest('base64') );

		}

	};

}

module.exports = DirHashGen;