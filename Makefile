.FAKE : all clean cleanswf swf js flash demo

all : demo

js : build/ogv.js

flash : build/ogv.swf

demo : js build/demo/index.html

clean:
	rm -rf build
	rm -rf demo
	test -f libogg/Makefile && (cd libogg && make distclean) || true
	rm -f libogg/configure
	test -f libvorbis/Makefile && (cd libvorbis && make distclean) || true
	rm -f libvorbis/configure
	test -f tremor/Makefile && (cd tremor && make distclean) || true
	rm -f tremor/configure
	test -f libtheora/Makefile && (cd libtheora && make distclean) || true
	rm -f libtheora/configure

build/js/root/lib/libogg.a : configureOgg.sh compileOggJs.sh
	test -d build || mkdir build
	./configureOgg.sh
	./compileOggJs.sh

build/js/root/lib/libvorbis.a : build/js/root/lib/libogg.a configureVorbis.sh compileVorbisJs.sh
	test -d build || mkdir build
	./configureVorbis.sh
	./compileVorbisJs.sh

build/js/root/lib/libtheoradec.a : build/js/root/lib/libogg.a configureTheora.sh compileTheoraJs.sh
	test -d build || mkdir build
	./configureTheora.sh
	./compileTheoraJs.sh

build/js/ogv-libs.js : src/ogv-libs.c src/ogv-libs-mixin.js build/js/root/lib/libogg.a build/js/root/lib/libtheoradec.a build/js/root/lib/libvorbis.a compileOgvJs.sh
	test -d build || mkdir build
	./compileOgvJs.sh

build/ogv.js : src/ogv-main.js build/js/ogv-libs.js
	 cpp -E -w -P -CC src/ogv-main.js > build/ogv.js


# The player demo
build/demo/index.html : src/demo/index.html src/demo/demo.css src/demo/demo.js src/demo/player.js src/demo/motd.js src/StreamFile.js src/AudioFeeder.js src/YCbCr.js build/ogv.js src/dynamicaudio.swf
	test -d build/demo || mkdir build/demo
	cp src/demo/index.html build/demo/index.html
	cp src/demo/demo.css build/demo/demo.css
	cp src/demo/demo.js build/demo/demo.js
	cp src/demo/motd.js build/demo/motd.js
	cp src/demo/player.js build/demo/player.js
	cp src/dynamicaudio.swf build/demo/dynamicaudio.swf
	
	test -d build/demo/lib || mkdir build/demo/lib
	cp src/StreamFile.js build/demo/lib/StreamFile.js
	cp src/AudioFeeder.js build/demo/lib/AudioFeeder.js
	cp src/YCbCr.js build/demo/lib/YCbCr.js
	cp build/ogv.js build/demo/lib/ogv.js


# There is a Flash shim for audio on Internet Explorer which doesn't
# have Web Audio API.
#
# The .swf build artifact is in the source tree so you don't have to
# figure out how to install the Apache Flex SDK when you've already
# gone to the trouble of setting up emscripten.
#
# Get SDK binaries from http://flex.apache.org/ and install them somewhere
# in your PATH.
#
# To rebuild the .swf, run 'make cleanswf' then 'make swf'
#
swf : src/dynamicaudio.swf

cleanswf:
	rm -f src/dynamicaudio.swf

src/dynamicaudio.swf : src/dynamicaudio.as
	mxmlc -o src/dynamicaudio.swf -file-specs src/dynamicaudio.as


# And the Flash version of the decoder...
# Still experimental, not built or used by default yet.

build/flash/root/lib/libogg.a : configureOgg.sh compileOggFlash.sh
	test -d build || mkdir build
	./configureOgg.sh
	./compileOggFlash.sh

build/flash/root/lib/libvorbis.a : build/flash/root/lib/libogg.a configureVorbis.sh compileVorbisFlash.sh
	test -d build || mkdir build
	./configureVorbis.sh
	./compileVorbisFlash.sh

build/flash/root/lib/libtheoradec.a : build/flash/root/lib/libogg.a configureTheora.sh compileTheoraFlash.sh
	test -d build || mkdir build
	./configureTheora.sh
	./compileTheoraFlash.sh

build/flash/ogv-libs.swc : src/ogv-libs.c src/ogv-libs-mixin-flash.c build/flash/root/lib/libogg.a build/flash/root/lib/libtheoradec.a build/flash/root/lib/libvorbis.a compileOgvFlash.sh
	test -d build || mkdir build
	./compileOgvFlash.sh

build/ogv.swf : src/ogv.as build/flash/ogv-libs.swc
	mxmlc -o build/ogv.swf -static-link-runtime-shared-libraries -library-path=build/flash/ogv-libs.swc src/ogv.as

