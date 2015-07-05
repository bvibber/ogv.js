QUnit.test( "OGVPlayer loaded", function( assert ) {
	assert.ok( window.OGVPlayer !== undefined, "Passed!" );
});

function nativePlayer() {
	return document.createElement('video');
}

function ogvPlayer() {
	return new OGVPlayer({
		base: 'lib',
	});
}

QUnit.assert.floatClose = function(actual, expected, message) {
	var delta = 1 / 64,
		ok = Math.abs(actual - expected) < delta;
	this.push(ok, actual, expected, message);
};

var hasNativeOgg = (function() {
	var video = document.createElement('video');
	return video.canPlayType('video/ogg; codecs="theora,vorbis"') &&
	       video.canPlayType('video/ogg; codecs="theora,opus"');
})();

function doubleTest(description, func) {
	if (hasNativeOgg) {
		QUnit.test("native video: " + description, function( assert ) {
			var player = nativePlayer();
			document.getElementById('qunit-fixture').appendChild(player);
			func(assert, player);
		} );
	}

	QUnit.test("OGVPlayer: " + description, function( assert ) {
		var player = ogvPlayer();
		document.getElementById('qunit-fixture').appendChild(player);
		func(assert, player);
	} );
}

function doubleAsyncTest(description, func) {
	if (hasNativeOgg) {
		QUnit.asyncTest("native video: " + description, function( assert ) {
			var player = nativePlayer();
			document.getElementById('qunit-fixture').appendChild(player);
			func(assert, player);
		} );
	}

	QUnit.asyncTest("OGVPlayer: " + description, function( assert ) {
		var player = ogvPlayer();
		document.getElementById('qunit-fixture').appendChild(player);
		func(assert, player);
	} );
}

doubleTest("instantiates", function(assert, player) {
	assert.equal(typeof player, 'object');
});

doubleTest("object has expected properties", function(assert, player) {
	assert.equal(typeof player.src, 'string', 'src');
	assert.equal(typeof player.buffered, 'object', 'buffered');
	assert.equal(typeof player.currentTime, 'number', 'currentTime');
	assert.equal(typeof player.duration, 'number', 'duration');
	assert.equal(typeof player.paused, 'boolean', 'paused');
	assert.equal(typeof player.ended, 'boolean', 'ended');
	assert.equal(typeof player.seeking, 'boolean', 'seeking');
	assert.equal(typeof player.muted, 'boolean', 'muted');
	assert.equal(typeof player.poster, 'string', 'poster');
	assert.equal(typeof player.videoWidth, 'number', 'videoWidth');
	assert.equal(typeof player.videoHeight, 'number', 'videoHeight');
	assert.equal(typeof player.width, 'number', 'width');
	assert.equal(typeof player.height, 'number', 'height');
	assert.equal(player.onloadedmetadata, null, 'onloadedmetadata');
	assert.equal(player.onplay, null, 'onplay');
	assert.equal(player.onpause, null, 'onpause');
	assert.equal(player.onended, null, 'onended');

	assert.equal(typeof player.canPlayType, 'function', 'canPlayType');
	assert.equal(typeof player.load, 'function', 'load');
	assert.equal(typeof player.play, 'function', 'play');
	assert.equal(typeof player.pause, 'function', 'pause');
});

doubleTest('canPlayType', function(assert, player) {
	assert.equal(player.canPlayType('audio/ogg'), 'maybe', 'audio/ogg');
	assert.equal(player.canPlayType('audio/ogg; codecs="vorbis"'), 'probably', 'audio/ogg; codecs="vorbis"');
	assert.equal(player.canPlayType('audio/ogg; codecs="opus"'), 'probably', 'audio/ogg; codecs="opus"');

	assert.equal(player.canPlayType('video/ogg'), 'maybe', 'video/ogg');
	assert.equal(player.canPlayType('video/ogg; codecs="theora"'), 'probably', 'video/ogg; codecs="theora"');
	assert.equal(player.canPlayType('video/ogg; codecs="theora,vorbis"'), 'probably', 'video/ogg; codecs="theora,vorbis"');
	assert.equal(player.canPlayType('video/ogg; codecs="theora,opus"'), 'probably', 'video/ogg; codecs="theora,opus"');
});


doubleAsyncTest('load yields onloadedmetadata', function(assert, player) {
	assert.ok( player.paused, 'player thinks it is paused before load');
	player.src = 'media/320x240.ogv';
	player.onloadedmetadata = function() {
		assert.ok( true, 'onloadedmetadata was fired' );
		assert.ok( player.paused, 'player still thinks it is paused');
		// todo: assert.equal(Math.round(player.duration), 4); // more or less
		QUnit.start();
	};
	player.load();
});

doubleAsyncTest('metadata detects size', function(assert, player) {
	player.src = 'media/320x240.ogv';
	assert.equal(player.videoWidth, 0, "don't know width before");
	assert.equal(player.videoHeight, 0, "don't know height before");
	player.onloadedmetadata = function() {
		assert.equal(player.videoWidth, 320, "videoWidth");
		assert.equal(player.videoHeight, 240, "videoHeight");
		QUnit.start();
	};
	player.load();
});

doubleAsyncTest('metadata detects duration for file with x-content-duration', function(assert, player) {
	player.src = 'https://upload.wikimedia.org/wikipedia/commons/transcoded/3/3c/IP-Routing.webm/IP-Routing.webm.360p.ogv';
	assert.ok(isNaN(player.duration), "don't know duration before");
	player.onloadedmetadata = function() {
		assert.floatClose(player.duration, 330.284, "duration");
		QUnit.start();
	};
	player.load();
});

doubleAsyncTest('metadata detects duration for file with skeleton', function(assert, player) {
	player.src = 'media/3seconds.ogv';
	assert.ok(isNaN(player.duration), "don't know duration before");
	player.onloadedmetadata = function() {
		assert.equal(player.duration, 3, "duration");
		QUnit.start();
	};
	player.load();
});

/*
// broken test - https://github.com/brion/ogv.js/issues/198
// seems to be specific to some file layouts
doubleAsyncTest('metadata detects duration for file without skeleton', function(assert, player) {
	player.src = 'media/3seconds-noskeleton.ogv';
	assert.ok(isNaN(player.duration), "don't know duration before");
	player.onloadedmetadata = function() {
		assert.equal(player.duration, 3, "duration");
		QUnit.start();
	};
	player.load();
});
*/

doubleAsyncTest('seekable matches duration', function(assert, player) {
	player.src = 'media/3seconds.ogv';
	var seekable = player.seekable;
	assert.equal(seekable.length, 0, "zero ranges in seekable pre-load");
	player.onloadedmetadata = function() {
		var seekable = player.seekable;
		assert.equal(seekable.length, 1, "one range in seekable");
		assert.equal(seekable.start(0), 0, "seekable range starts at 0");
		assert.floatClose(seekable.end(0), player.duration, "seekable range matches duration");
		QUnit.start();
	};
	player.load();
});

doubleAsyncTest('addEventListener for loadedmetadata', function(assert, player) {
	player.src = 'media/320x240.ogv';
	player.addEventListener('loadedmetadata', function() {
		assert.ok( true, 'onloadedmetadata was fired' );
		QUnit.start();
	});
	player.load();
});

doubleAsyncTest('play yields onloadedmetadata', function(assert, player) {
	assert.ok( player.paused, 'player thinks it is paused before play');
	player.src = 'media/3seconds.ogv';
	player.onloadedmetadata = function() {
		assert.ok( true, 'onloadedmetadata was fired' );
		assert.ok( !player.paused, 'player no longer thinks it is paused (2)');
		player.pause();
		QUnit.start();
	};
	player.play();
	assert.ok( !player.paused, 'player no longer thinks it is paused (1)');
});

doubleAsyncTest('play yields onplay', function(assert, player) {
	player.src = 'media/1second.ogv';
	player.onplay = function() {
		assert.ok( true, 'onplay event was fired' );
		assert.ok( !player.paused, 'player thinks it is playing');
		player.pause();
		QUnit.start();
	};
	player.play();
});

doubleAsyncTest('play yields onended', function(assert, player) {
	player.src = 'media/1second.ogv';
	player.onended = function() {
		assert.ok( true, 'onended event was fired' );
		assert.ok( player.paused, 'player thinks it is paused again');
		QUnit.start();
	};
	player.play();
});
