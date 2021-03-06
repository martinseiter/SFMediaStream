// https://www.w3schools.com/tags/ref_av_dom.asp
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
window.ScarletsMediaPlayer = function(element){
	// https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
	var self = this;

	var propertyLinker = ['autoplay', 'loop', 'buffered', 'buffered', 'controller', 'currentTime', 'currentSrc', 'duration', 'ended', 'error', 'readyState', 'networkState', 'paused', 'played', 'seekable', 'seeking'];

	if(element.tagName.toLowerCase() === 'video')
		propertyLinker = propertyLinker.concat(['poster', 'height', 'width']);

	// Reference element function
	self.load = function(){
		element.load();
	}

	self.canPlayType = function(){
		element.canPlayType();
	}

	// Reference element property
	for (var i = 0; i < propertyLinker.length; i++) {
		objectPropertyLinker(self, element, propertyLinker[i]);
	}

	self.preload = true;
	element.preload = 'metadata';
	self.audioFadeEffect = true;

	self.speed = function(set){
		if(set === undefined) return element.defaultPlaybackRate;
		element.defaultPlaybackRate = element.playbackRate = set;
	}

	self.mute = function(set){
		if(set === undefined) return element.muted;
		element.defaultMuted = element.muted = set;
	}

	var volume = 1;
	self.volume = function(set){
		if(set === undefined) return volume;
		element.volume = volume = set;
	}

	self.play = function(callback){
		if(!element.paused){
			if(callback) callback();
			return;
		}
		if(self.audioFadeEffect){
			element.volume = 0;
			element.play();
			fadeNumber(0, volume, -0.05, 400, function(num){
				element.volume = num;
			}, callback);
			return;
		}
		element.play();
		if(callback) callback();
	}

	self.pause = function(callback){
		if(element.paused){
			if(callback) callback();
			return;
		}
		if(self.audioFadeEffect){
			fadeNumber(volume, 0, -0.05, 400, function(num){
				element.volume = num;
			}, function(){
				element.pause();
				if(callback) callback();
			});
			return;
		}
		element.pause();
		if(callback) callback();
	}

	self.prepare = function(links, callback, force){
		// Stop playing media
		if(!force && !element.paused)
			return self.pause(function(){
				self.prepare(links, callback, true);
			});

		var temp = element.querySelectorAll('source');
		for (var i = temp.length - 1; i >= 0; i--) {
			temp[i].remove();
		}

		if(typeof links === 'string')
			element.insertAdjacentHTML('beforeend', `<source src="${links}"/>`);
		else{
			temp = '';
			for (var i = 0; i < links.length; i++) {
				temp += `<source src="${links[i]}"/>`;
			}
			element.insertAdjacentHTML('beforeend', temp);
		}

		// Preload data
		if(self.preload) element.load();
		if(callback) callback();
	}

	var eventRegistered = {};
	function eventTrigger(e){
		for (var i = 0; i < eventRegistered[e.type].length; i++) {
			eventRegistered[e.type][i](e, self);
		}
	}

	// https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
	self.on = function(eventName, callback){
		var name = eventName.toLowerCase();
		if(eventRegistered[name] === undefined){
			element.addEventListener(eventName, eventTrigger, true);
			eventRegistered[name] = [];
		}
		eventRegistered[name].push(callback);
		return self;
	}

	self.off = function(eventName, callback){
		var name = eventName.toLowerCase();
		if(eventRegistered[name] === undefined)
			return;

		if(!callback)
			eventRegistered[name].splice(0);
		else
			eventRegistered[name].splice(eventRegistered[name].indexOf(callback), 1);

		if(eventRegistered[name].length === 0){
			eventRegistered[name] = undefined;
			element.removeEventListener(eventName, eventTrigger, true);
		}
		return self;
	}

	self.once = function(eventName, callback){
		element.addEventListener(eventName, callback, {once:true});
		return self;
	}

	var playlistInitialized = false;
	function internalPlaylistEvent(){
		if(playlistInitialized) return;
		playlistInitialized = true;

		self.on('ended', function(){
			if(self.playlist.currentIndex < self.playlist.list.length - 1)
				self.playlist.next(true);
			else if(self.playlist.loop)
				self.playlist.play(0);
		});
	}

	self.playlist = {
		currentIndex:0,
		list:[],
		original:[],
		loop:false,
		shuffled:false,

		// lists = [{mp3:'main.mp3', ogg:'fallback.ogg', ..}, ...]
		reload:function(lists){
			this.original = lists;
			if(this.shuffled)
				this.shuffle(true);
			internalPlaylistEvent();
		},

		// obj = {mp3:'main.mp3', ogg:'fallback.ogg'}
		add:function(obj){
			original.push(obj);
			if(this.shuffled)
				this.shuffle(true);
			internalPlaylistEvent();
		},

		// index from 'original' property
		remove:function(index){
			original.splice(index, 1);
			if(this.shuffled)
				this.shuffle(true);
		},

		next:function(autoplay){
			this.currentIndex++;
			if(autoplay)
				this.play(this.currentIndex);
		},

		previous:function(autoplay){
			this.currentIndex--;
			if(autoplay)
				this.play(this.currentIndex);
		},

		play:function(index){
			this.currentIndex = index;
			self.prepare(Object.values(this.original[index]), function(){
				self.play();
			});
		},

		shuffle:function(set){
			if(set === undefined) return this.shuffled;
			if(set === true){
			    var j, x, i;
			    for (i = this.list.length - 1; i > 0; i--) {
			        j = Math.floor(Math.random() * (i + 1));
			        x = this.list[i];
			        this.list[i] = this.list[j];
			        this.list[j] = x;
			    }
			}
			else this.list = this.original.slice(0);

			this.shuffled = set;
		}
	};
}