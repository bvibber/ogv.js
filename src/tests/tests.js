QUnit.test( "OgvJsPlayer loaded", function( assert ) {
	assert.ok( window.OgvJsPlayer !== undefined, "Passed!" );
});

function nativePlayer() {
	return document.createElement('video');
}

function ogvJsPlayer() {
	return new OgvJsPlayer({
		base: 'lib',
	});
}

function doubleTest(description, func) {
	QUnit.test("native video: " + description, function( assert ) {
		var player = nativePlayer();
		document.getElementById('qunit-fixture').appendChild(player);
		func(assert, player);
	} );

	QUnit.test("OgvJsPlayer: " + description, function( assert ) {
		var player = ogvJsPlayer();
		document.getElementById('qunit-fixture').appendChild(player);
		func(assert, player);
	} );
}

function doubleAsyncTest(description, func) {
	QUnit.asyncTest("native video: " + description, function( assert ) {
		var player = nativePlayer();
		document.getElementById('qunit-fixture').appendChild(player);
		func(assert, player);
	} );

	QUnit.asyncTest("OgvJsPlayer: " + description, function( assert ) {
		var player = ogvJsPlayer();
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
	assert.equal(player.videoWidth, 0, "don't know width before");
	assert.equal(player.videoHeight, 0, "don't know height before");
	player.onloadedmetadata = function() {
		assert.ok( true, 'onloadedmetadata was fired' );
		assert.ok( player.paused, 'player still thinks it is paused');
		assert.equal(player.videoWidth, 320, "videoWidth");
		assert.equal(player.videoHeight, 240, "videoHeight");
		// todo: assert.equal(Math.round(player.duration), 4); // more or less
		QUnit.start();
	};
	player.load();
});


doubleAsyncTest('play yields onloadedmetadata', function(assert, player) {
	assert.ok( player.paused, 'player thinks it is paused before play');
	player.src = 'media/320x240.ogv';
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
	player.src = 'media/320x240.ogv';
	player.onplay = function() {
		assert.ok( true, 'onplay event was fired' );
		assert.ok( !player.paused, 'player thinks it is playing');
		player.pause();
		QUnit.start();
	};
	player.play();
});

doubleAsyncTest('play yields onended', function(assert, player) {
	player.src = 'media/320x240.ogv';
	player.onended = function() {
		assert.ok( true, 'onended event was fired' );
		assert.ok( player.paused, 'player thinks it is paused again');
		QUnit.start();
	};
	player.play();
});
