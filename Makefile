.FAKE : all clean cleanswf swf js flash demo democlean tests

all : demo build/ogv-version.js

js : build/ogv.js

flash : build/ogvswf.js

demo : build/demo/index.html

tests : build/tests/index.html

democlean:
	rm -rf build/demo

clean:
	rm -rf build
	rm -f libogg/configure
	rm -f libvorbis/configure
	rm -f libtheora/configure
	rm -f libopus/configure


build/js/root/lib/libogg.a : configureOgg.sh compileOggJs.sh
	test -d build || mkdir build
	./configureOgg.sh
	./compileOggJs.sh

build/js/root/lib/libvorbis.a : build/js/root/lib/libogg.a configureVorbis.sh compileVorbisJs.sh
	test -d build || mkdir build
	./configureVorbis.sh
	./compileVorbisJs.sh

build/js/root/lib/libopus.a : build/js/root/lib/libogg.a configureOpus.sh compileOpusJs.sh
	test -d build || mkdir build
	./configureOpus.sh
	./compileOpusJs.sh


build/js/root/lib/libtheoradec.a : build/js/root/lib/libogg.a configureTheora.sh compileTheoraJs.sh
	test -d build || mkdir build
	./configureTheora.sh
	./compileTheoraJs.sh

build/js/ogv-libs.js : src/ogv-libs.c src/opus_helper.c src/opus_helper.h src/opus_header.c src/opus_header.h src/ogv-libs-mixin.js build/js/root/lib/libogg.a build/js/root/lib/libtheoradec.a build/js/root/lib/libvorbis.a build/js/root/lib/libopus.a compileOgvJs.sh
	test -d build || mkdir build
	./compileOgvJs.sh

build/OgvJsCodec.js : src/OgvJsCodec.js.in build/js/ogv-libs.js
	test -d build || mkdir build
	 cpp -E -w -P -CC -nostdinc src/OgvJsCodec.js.in > build/OgvJsCodec.js

build/YCbCr-shaders.h : src/YCbCr-vertex.glsl src/YCbCr-fragment.glsl file2def.js
	test -d build || mkdir build
	node file2def.js src/YCbCr-vertex.glsl YCBCR_VERTEX_SHADER > build/YCbCr-shaders.h
	node file2def.js src/YCbCr-fragment.glsl YCBCR_FRAGMENT_SHADER >> build/YCbCr-shaders.h

build/FrameSink.js : src/FrameSink.js.in src/YCbCr.js
	test -d build || mkdir build
	 cpp -E -w -P -CC -nostdinc -Ibuild src/FrameSink.js.in > build/FrameSink.js

build/WebGLFrameSink.js : src/WebGLFrameSink.js.in build/YCbCr-shaders.h
	 cpp -E -w -P -CC -nostdinc -Ibuild src/WebGLFrameSink.js.in > build/WebGLFrameSink.js

build/ogv.js : src/ogv.js.in src/StreamFile.js src/AudioFeeder.js build/FrameSink.js build/WebGLFrameSink.js src/Bisector.js src/OgvJsPlayer.js \
               build/ogv-codec.js \
               build/ogv-codec.js.gz
	cpp -E -w -P -CC -nostdinc -Ibuild src/ogv.js.in > build/ogv.js
	echo 'window.OgvJsVersion = "'`date -u`'";' >> build/ogv.js

build/ogv-version.js : build/ogv.js
	echo 'window.OgvJsVersion = "'`date -u`'";' > build/ogv-version.js

build/ogv-codec.js : build/OgvJsCodec.js
	cp build/OgvJsCodec.js build/ogv-codec.js

build/ogv-codec.js.gz : build/ogv-codec.js
	 7z -tgzip -mx=9 -so a dummy.gz build/ogv-codec.js > build/ogv-codec.js.gz || gzip -9 -c build/ogv-codec.js > build/ogv-codec.js.gz

# Build as 'NOFLASH=1 make' to skip the Flash build
ifdef NOFLASH
FLASHDEMO_DEPS=
FLASHDEMO_OPTS=
else
FLASHDEMO_DEPS=build/demo/lib/ogv.swf build/demo/lib/ogvswf.js
FLASHDEMO_OPTS=-DWITH_FLASH
endif

# The player demo, with the JS and optionally Flash builds
build/demo/index.html : src/demo/index.html.in \
                        build/demo/demo.css \
                        build/demo/demo.js \
                        build/demo/motd.js \
                        build/demo/minimal.html \
                        build/demo/media/ehren-paper_lights-96.opus \
                        build/demo/media/pixel_aspect_ratio.ogg \
                        build/demo/lib/ogv.js \
                        build/demo/lib/ogv-codec.js \
                        build/demo/lib/ogv-codec.js.gz \
                        build/demo/lib/dynamicaudio.swf \
                        $(FLASHDEMO_DEPS) \
                        build/demo/lib/cortado.jar \
                        build/demo/lib/CortadoPlayer.js
	test -d build/demo || mkdir -p build/demo
	cpp -E -w -P -CC -nostdinc -DWITH_JS $(FLASHDEMO_OPTS) src/demo/index.html.in > build/demo/index.html

build/demo/demo.css : src/demo/demo.css
	test -d build/demo || mkdir -p build/demo
	cp src/demo/demo.css build/demo/demo.css

build/demo/demo.js : src/demo/demo.js
	test -d build/demo || mkdir -p build/demo
	cp src/demo/demo.js build/demo/demo.js

build/demo/motd.js : src/demo/motd.js
	test -d build/demo || mkdir -p build/demo
	cp src/demo/motd.js build/demo/motd.js

build/demo/minimal.html : src/demo/minimal.html
	test -d build/demo || mkdir -p build/demo
	cp src/demo/minimal.html build/demo/minimal.html

build/demo/media/ehren-paper_lights-96.opus : src/demo/media/ehren-paper_lights-96.opus
	test -d build/demo/media || mkdir -p build/demo/media
	cp src/demo/media/ehren-paper_lights-96.opus build/demo/media/ehren-paper_lights-96.opus

build/demo/media/pixel_aspect_ratio.ogg : src/demo/media/pixel_aspect_ratio.ogg
	test -d build/demo/media || mkdir -p build/demo/media
	cp src/demo/media/pixel_aspect_ratio.ogg build/demo/media/pixel_aspect_ratio.ogg

build/demo/lib/ogv.js : build/ogv.js
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp build/ogv.js build/demo/lib/ogv.js

build/demo/lib/ogv-codec.js : build/ogv-codec.js
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp build/ogv-codec.js build/demo/lib/ogv-codec.js

build/demo/lib/ogv-codec.js.gz : build/ogv-codec.js.gz
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp build/ogv-codec.js.gz build/demo/lib/ogv-codec.js.gz

build/demo/lib/dynamicaudio.swf : src/dynamicaudio.swf
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp src/dynamicaudio.swf build/demo/lib/dynamicaudio.swf

build/demo/lib/ogvswf.js : build/ogvswf.js
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp build/ogvswf.js build/demo/lib/ogvswf.js

build/demo/lib/ogv.swf : build/ogvswf.js
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp build/ogv.swf build/demo/lib/ogv.swf

build/demo/lib/cortado.jar : src/cortado.jar
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp src/cortado.jar build/demo/lib/cortado.jar

build/demo/lib/CortadoPlayer.js : src/CortadoPlayer.js
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp src/CortadoPlayer.js build/demo/lib/CortadoPlayer.js

# QUnit test cases
build/tests/index.html : build/tests/tests.js \
                         build/tests/lib/ogv.js \
                         build/tests/media/1frame.ogv \
                         build/tests/media/3frames.ogv \
                         build/tests/media/1second.ogv \
                         build/tests/media/3seconds.ogv \
                         build/tests/media/3seconds-noskeleton.ogv \
                         build/tests/media/320x240.ogv \
                         src/tests/index.html
	test -d build/tests || mkdir -p build/tests
	cp src/tests/index.html build/tests/index.html

build/tests/tests.js : src/tests/tests.js
	test -d build/tests || mkdir -p build/tests
	cp src/tests/tests.js build/tests/tests.js

build/tests/lib/ogv.js : build/ogv.js \
                         build/tests/lib/ogv-codec.js \
                         build/tests/lib/dynamicaudio.swf
	test -d build/tests/lib || mkdir -p build/tests/lib
	cp build/ogv.js build/tests/lib/ogv.js

build/tests/lib/ogv-codec.js : build/ogv-codec.js
	test -d build/tests/lib || mkdir -p build/tests/lib
	cp build/ogv-codec.js build/tests/lib/ogv-codec.js

build/tests/lib/dynamicaudio.swf : src/dynamicaudio.swf
	test -d build/tests/lib || mkdir -p build/tests/lib
	cp src/dynamicaudio.swf build/tests/lib/dynamicaudio.swf

build/tests/media/1frame.ogv : src/tests/media/1frame.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp src/tests/media/1frame.ogv build/tests/media/1frame.ogv

build/tests/media/3frames.ogv : src/tests/media/3frames.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp src/tests/media/3frames.ogv build/tests/media/3frames.ogv

build/tests/media/1second.ogv : src/tests/media/1second.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp src/tests/media/1second.ogv build/tests/media/1second.ogv

build/tests/media/3seconds.ogv : src/tests/media/3seconds.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp src/tests/media/3seconds.ogv build/tests/media/3seconds.ogv

build/tests/media/3seconds-noskeleton.ogv : src/tests/media/3seconds-noskeleton.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp src/tests/media/3seconds-noskeleton.ogv build/tests/media/3seconds-noskeleton.ogv

build/tests/media/320x240.ogv : src/tests/media/320x240.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp src/tests/media/320x240.ogv build/tests/media/320x240.ogv

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

build/flash/ogv-libs.swc : src/ogv-libs.c src/ogv-libs-mixin-flash.c src/YCbCr.h src/YCbCr.c build/flash/root/lib/libogg.a build/flash/root/lib/libtheoradec.a build/flash/root/lib/libvorbis.a compileOgvFlash.sh
	test -d build || mkdir build
	./compileOgvFlash.sh

build/ogv.swf : src/ogv.as src/OgvCodec.as build/flash/ogv-libs.swc
	mxmlc -o build/ogv.swf -static-link-runtime-shared-libraries -library-path=build/flash/ogv-libs.swc -source-path+=build src/ogv.as

build/ogvswf-version.js : build/ogv.swf
	echo 'OgvSwfPlayer.buildDate = "'`date -u`'";' > build/ogvswf-version.js

build/ogvswf.js : src/OgvSwfPlayer.js build/ogvswf-version.js
	cat src/OgvSwfPlayer.js build/ogvswf-version.js > build/ogvswf.js
