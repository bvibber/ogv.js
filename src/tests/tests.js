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

QUnit.test("native video instantiates", function( assert ) {
	var player = nativePlayer();
	assert.equal(typeof player, 'object');
});

QUnit.test("OgvJsPlayer instantiates", function( assert ) {
	var player = ogvJsPlayer();
	assert.equal(typeof player, 'object');
});

function propTest(assert, player) {
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
}

QUnit.test("Native video has expected properties", function( assert ) {
	propTest(assert, nativePlayer());
});

QUnit.test("OgvJsPlayer has expected properties", function( assert ) {
	propTest(assert, ogvJsPlayer());
});


function canPlayTest(assert, player) {
	assert.equal(player.canPlayType('audio/ogg'), 'maybe', 'audio/ogg');
	assert.equal(player.canPlayType('audio/ogg; codecs="vorbis"'), 'probably', 'audio/ogg; codecs="vorbis"');
	assert.equal(player.canPlayType('audio/ogg; codecs="opus"'), 'probably', 'audio/ogg; codecs="opus"');

	assert.equal(player.canPlayType('video/ogg'), 'maybe', 'video/ogg');
	assert.equal(player.canPlayType('video/ogg; codecs="theora"'), 'probably', 'video/ogg; codecs="theora"');
	assert.equal(player.canPlayType('video/ogg; codecs="theora,vorbis"'), 'probably', 'video/ogg; codecs="theora,vorbis"');
	assert.equal(player.canPlayType('video/ogg; codecs="theora,opus"'), 'probably', 'video/ogg; codecs="theora,opus"');
}

QUnit.test("Native video canPlayType", function( assert ) {
	canPlayTest(assert, nativePlayer());
});

QUnit.test("OgvJsPlayer canPlayType", function( assert ) {
	canPlayTest(assert, ogvJsPlayer());
});


function loadedMetadataTest(assert, player) {
	assert.ok( player.paused, 'player thinks it is paused before load');
	player.src = 'media/320x240.ogv';
	player.onloadedmetadata = function() {
		assert.ok( true, 'onloadedmetadata was fired' );
		assert.ok( player.paused, 'player still thinks it is paused');
		QUnit.start();
	};
	player.load();
}

QUnit.asyncTest('Native video load yields onloadedmetadata', function(assert) {
	loadedMetadataTest(assert, nativePlayer());
});

QUnit.asyncTest('OgvJsPlayer load yields onloadedmetadata', function(assert) {
	loadedMetadataTest(assert, ogvJsPlayer());
});


function playLoadedMetadataTest(assert, player) {
	assert.ok( player.paused, 'player thinks it is paused before play');
	player.src = 'media/320x240.ogv';
	player.onloadedmetadata = function() {
		assert.ok( true, 'onloadedmetadata was fired' );
		assert.ok( !player.paused, 'player no longer thinks it is paused (2)');
		QUnit.start();
	};
	player.play();
	assert.ok( !player.paused, 'player no longer thinks it is paused (1)');
}


QUnit.asyncTest('Native video play yields onloadedmetadata', function(assert) {
	playLoadedMetadataTest(assert, nativePlayer());
});

QUnit.asyncTest('OgvJsPlayer play yields onloadedmetadata', function(assert) {
	playLoadedMetadataTest(assert, ogvJsPlayer());
});
