.FAKE : all clean cleanswf swf

all : build/ogv.js build/demo/index.html

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

build/root/lib/libogg.a : compileOgg.sh
	test -d build || mkdir build
	test -d build/intermediate || mkdir build/intermediate
	./compileOgg.sh

build/root/lib/libtheora.a : build/root/lib/libogg.a compileTheora.sh
	test -d build || mkdir build
	test -d build/intermediate || mkdir build/intermediate
	./compileTheora.sh

build/root/lib/libvorbis.a : build/root/lib/libogg.a compileVorbis.sh
	test -d build || mkdir build
	test -d build/intermediate || mkdir build/intermediate
	./compileVorbis.sh

build/root/lib/libvorbisidec.a : build/root/lib/libogg.a compileTremor.sh
	test -d build || mkdir build
	test -d build/intermediate || mkdir build/intermediate
	./compileTremor.sh

build/intermediate/ogv-libs.js : src/ogv-libs.c src/ogv-libs-mixin.js build/root/lib/libogg.a build/root/lib/libtheora.a build/root/lib/libvorbis.a compileOgv.sh
	test -d build || mkdir build
	test -d build/intermediate || mkdir build/intermediate
	./compileOgv.sh

build/ogv.js : src/ogv-main.js build/intermediate/ogv-libs.js
	importer src/ogv-main.js build/ogv.js

build/demo/index.html : src/demo/index.html src/demo/demo.css src/demo/demo.js src/demo/motd.js src/StreamFile.js src/AudioFeeder.js src/YCbCr.js src/ogv-shim.js src/ogv-worker.js build/ogv.js src/dynamicaudio.swf
	test -d build/demo || mkdir build/demo
	cp src/demo/index.html build/demo/index.html
	cp src/demo/demo.css build/demo/demo.css
	cp src/demo/demo.js build/demo/demo.js
	cp src/demo/motd.js build/demo/motd.js
	cp src/dynamicaudio.swf build/demo/dynamicaudio.swf
	
	test -d build/demo/lib || mkdir build/demo/lib
	cp src/StreamFile.js build/demo/lib/StreamFile.js
	cp src/AudioFeeder.js build/demo/lib/AudioFeeder.js
	cp src/YCbCr.js build/demo/lib/YCbCr.js
	cp src/ogv-shim.js build/demo/lib/ogv-shim.js
	cp src/ogv-worker.js build/demo/lib/ogv-worker.js
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
