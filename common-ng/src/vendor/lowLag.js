if (!window.console) console = {log: function() {}};

var lowLag = new function(){
	this.someVariable = undefined;
	this.showNeedInit = function(){ lowLag.msg("lowLag: you must call lowLag.init() first!"); }

	this.load = this.showNeedInit;
	this.play = this.showNeedInit;

	this.audioTagTimeToLive = 5000;

	this.soundUrl = "";

	this.debug = "none";

	this.init = function(config){

		$("#lowLag").remove();
		$("body").append("<div id='lowLag'></div>");
		var force = undefined;
		if(config != undefined){
			if(config['force'] != undefined){
				force = config['force'];
			}
			if(config['audioTagTimeToLive'] != undefined){
				lowLag.audioTagTimeToLive = config['audioTagTimeToLive'];
			}
			if(config['urlPrefix'] != undefined){
				lowLag.soundUrl = config['urlPrefix'];
			}
			if(config['debug'] != undefined){
				lowLag.debug = config['debug'];
			}
		}

        // use what we are forced into if anything
        // else use webkitaudio if we can
        // but special case firefox back to ogg format to get round crashing
        // with ff v30 and win8.1 combination
		lowLag.format = "audioTag";
		if(force != undefined) lowLag.format = force;
		else {
			if(typeof(webkitAudioContext) != "undefined") lowLag.format = 'webkitAudio';
			else if(navigator.userAgent.indexOf("Firefox")!=-1) lowLag.format = 'ogg';
		}
		switch(lowLag.format){
			case 'webkitAudio':

				this.msg("init webkitAudio");
				this.load= this.loadSoundWebkitAudio;
				this.play = this.playSoundWebkitAudio;
                this.mute = this.muteSoundWebkitAudio;
                this.unmute = this.unmuteSoundWebkitAudio;
				this.webkitAudioContext = new webkitAudioContext();
			break;
			case 'audioTag':
				this.msg("init audioTag");
				this.load= this.loadSoundAudioTag;
				this.play = this.playSoundAudioTag;
                this.mute = this.muteSoundAudioTag;
                this.unmute = this.unmuteSoundAudioTag;
			break;
			case 'ogg':
				this.msg("init ogg");
				this.load= this.loadSoundAudioTag;
				this.play = this.playSoundAudioTag;
                this.mute = this.muteSoundAudioTag;
                this.unmute = this.unmuteSoundAudioTag;
			break;
		}
	}

//we'll use the tag they hand us, or else the url as the tag if it's a single tag,
//or the first url
	this.getTagFromURL = function(url,tag){
		if(tag != undefined) return tag;
		return lowLag.getSingleURL(url);
	}
	this.getSingleURL = function(urls){
		if(typeof(urls) == "string") return urls;
		return urls[0];
	}
//coerce to be an array
	this.getURLArray = function(urls){
		if(typeof(urls) == "string") return [urls];
		return urls;
	}


	this.webkitPendingRequest = {};

	this.webkitAudioContext = undefined;
	this.webkitAudioBuffers = {};

	this.loadSoundWebkitAudio = function(urls,tag){
		var url = lowLag.getSingleURL(urls);
		var tag = lowLag.getTagFromURL (urls,tag);
        lowLag.msg('webkitAudio loading '+url+' as tag ' + tag);
		var request = new XMLHttpRequest();
		request.open('GET', lowLag.soundUrl + url, true);
		request.responseType = 'arraybuffer';

		// Decode asynchronously
		request.onload = function() {
		    lowLag.webkitAudioContext.decodeAudioData(request.response, function(buffer) {
				lowLag.webkitAudioBuffers[tag] = buffer;

				if(lowLag.webkitPendingRequest[tag]){ //a request might have come in, try playing it now
					lowLag.playSoundWebkitAudio(tag);
				}
			}, lowLag.errorLoadWebkitAudtioFile);
		};
		request.send();
	}

	this.errorLoadWebkitAudtioFile = function(e){
		lowLag.msg("Error loading webkitAudio: "+e);
	}

	this.playSoundWebkitAudio= function(tag){
		lowLag.msg("playSoundWebkitAudio "+tag);
		var buffer = lowLag.webkitAudioBuffers[tag];
		if(buffer == undefined) { //possibly not loaded; put in a request to play onload
			lowLag.webkitPendingRequest[tag] = true;
			return;
		}
		var context = lowLag.webkitAudioContext;
		var source = context.createBufferSource(); // creates a sound source

        lowLag.gainNode = this.gainNode || context.createGain();
        lowLag.gainNode.gain.value = 1;
		source.buffer = buffer;                    // tell the source which sound to play
        source.connect(lowLag.gainNode);
		lowLag.gainNode.connect(context.destination);       // connect the source to the context's destination (the speakers)
        if (source.noteOn) {
            source.noteOn(0);
        } else {
		    source.start(0);                          // play the source now
        }
	}

    this.muteSoundWebkitAudio = function() {
        if (!lowLag.gainNode) {
            var context = lowLag.webkitAudioContext;
            lowLag.gainNode = this.gainNode || context.createGain();
        }
        lowLag.gainNode.gain.value = 0;
    }

    this.unmuteSoundWebkitAudio = function() {
        if (!lowLag.gainNode) {
            var context = lowLag.webkitAudioContext;
            lowLag.gainNode = this.gainNode || context.createGain();
        }
        lowLag.gainNode.gain.value = 1;
    }


	this.audioTagID = 0;
	this.audioTagNameToElement = {};

	this.loadSoundAudioTag = function(urls,tag){
		var id = "lowLagElem_"+lowLag.audioTagID++;

		var tag = lowLag.getTagFromURL(urls,tag);

		var urls = lowLag.getURLArray(urls);


		lowLag.audioTagNameToElement[tag] = id;

        lowLag.msg('audioTag loading '+urls+' as tag ' + tag);

		var buf = "";
		buf += '<audio id="'+id+'" preload="auto" autobuffer>';

		for(var i = 0; i < urls.length; i++){
			var url = urls[i];
            var urlExtension = lowLag.getExtension(url);
            // only use the .ogg format if we are running in forefox
            if ((lowLag.format === 'ogg' && urlExtension === 'ogg') || (lowLag.format !== 'ogg')) {
                var type = "audio/"+urlExtension;
                buf += '  <source src="'+lowLag.soundUrl+url+'" type="'+type+'" />';
            }
		}
		buf += '</audio>';
		$("#lowLag").append(buf);
	}

	this.playSoundAudioTag = function(tag){
		lowLag.msg("playSoundAudioTag "+tag);

		var modelId = lowLag.audioTagNameToElement[tag];
		var cloneId = "lowLagCloneElem_"+lowLag.audioTagID++;
		$('#'+modelId).clone()
			.attr('id', cloneId)
			.appendTo('#lowLag');
		lowLag.cloneElem = document.getElementById(cloneId);
        lowLag.msg(tag);
		if(lowLag.audioTagTimeToLive != -1){
			setTimeout(function(){
					$('#'+cloneId).remove();
				},lowLag.audioTagTimeToLive);
		}
		lowLag.cloneElem.play();
	}

    this.muteSoundAudioTag = function() {
        lowLag.cloneElem.muted = true;
    }

    this.unmuteSoundAudioTag = function() {
        lowLag.cloneElem.muted = false;
    }


	this.getExtension = function(url){
		return url.substring(url.lastIndexOf(".")+1).toLowerCase();

	}


	this.msg = function(m){
		m = "-- lowLag "+m;
		if(lowLag.debug == 'both' || lowLag.debug == 'console'){
			console.log(m+"<br>");
		}
		if(lowLag.debug == 'both' || lowLag.debug == 'screen'){
			$('#lowLag').append(m+"<br>");
		}
	}
}
