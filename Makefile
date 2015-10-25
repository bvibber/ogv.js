VERSION:=1.0
BUILDDATE:=$(shell date -u "+%Y%m%d%H%M%S")
HASH:=$(shell git rev-parse --short HEAD)
FULLVER:=$(VERSION)-$(BUILDDATE)-$(HASH)

DEMO_DIR:=demo
TESTS_DIR:=tests
DYNAMIC_AUDIO_SWF:=assets/dynamicaudio.swf

.FAKE : all clean cleanswf swf js demo democlean tests dist jshint

all : js \
      demo \
      tests

js : build/ogv.js \
     build/ogv-version.js \
     build/ogv-support.js

demo : build/demo/index.html

tests : build/tests/index.html

democlean:
	rm -rf build/demo

clean:
	rm -rf build
	rm -rf dist
	rm -f libogg/configure
	rm -f libvorbis/configure
	rm -f libtheora/configure
	rm -f libopus/configure
	rm -f libskeleton/configure
	rm -f libnestegg/configure

dist: js $(DYNAMIC_AUDIO_SWF) README.md COPYING
	rm -rf dist
	mkdir dist
	mkdir dist/ogvjs-$(VERSION)
	cp -p build/ogv.js \
	      build/ogv-demuxer-ogg.js \
	      build/ogv-demuxer-webm.js \
	      build/ogv-decoder-audio-opus.js \
	      build/ogv-decoder-audio-vorbis.js \
	      build/ogv-decoder-video-theora.js \
	      build/ogv-decoder-video-vp8.js \
	      build/ogv-support.js \
	      build/ogv-version.js \
	      build/ogv-worker-audio.js \
	      build/ogv-worker-video.js \
	      $(DYNAMIC_AUDIO_SWF) \
	      README.md \
	      COPYING \
	      dist/ogvjs-$(VERSION)/
	cp -p libogg/COPYING dist/ogvjs-$(VERSION)/COPYING-ogg.txt
	cp -p libvorbis/COPYING dist/ogvjs-$(VERSION)/COPYING-vorbis.txt
	cp -p libtheora/COPYING dist/ogvjs-$(VERSION)/COPYING-theora.txt
	cp -p libopus/COPYING dist/ogvjs-$(VERSION)/COPYING-opus.txt
	cp -p libnestegg/LICENSE dist/ogvjs-$(VERSION)/LICENSE-nestegg.txt
	cp -p libvpx/LICENSE dist/ogvjs-$(VERSION)/LICENSE-vpx.txt
	cp -p libvpx/PATENTS dist/ogvjs-$(VERSION)/PATENTS-vpx.txt
	(cd dist && zip -r ogvjs-$(VERSION).zip ogvjs-$(VERSION))

build/js/root/lib/libogg.a : configureOgg.sh compileOggJs.sh
	test -d build || mkdir build
	./configureOgg.sh
	./compileOggJs.sh

build/js/root/lib/liboggz.a : build/js/root/lib/libogg.a configureOggz.sh compileOggzJs.sh
	test -d build || mkdir build
	./configureOggz.sh
	./compileOggzJs.sh

build/js/root/lib/libvorbis.a : build/js/root/lib/libogg.a configureVorbis.sh compileVorbisJs.sh
	test -d build || mkdir build
	./configureVorbis.sh
	./compileVorbisJs.sh

build/js/root/lib/libopus.a : build/js/root/lib/libogg.a configureOpus.sh compileOpusJs.sh
	test -d build || mkdir build
	./configureOpus.sh
	./compileOpusJs.sh

build/js/root/lib/libskeleton.a : build/js/root/lib/libogg.a configureSkeleton.sh compileSkeletonJs.sh
	test -d build || mkdir build
	./configureSkeleton.sh
	./compileSkeletonJs.sh


build/js/root/lib/libtheoradec.a : build/js/root/lib/libogg.a configureTheora.sh compileTheoraJs.sh
	test -d build || mkdir build
	./configureTheora.sh
	./compileTheoraJs.sh

build/js/root/lib/libnestegg.a : configureNestEgg.sh compileNestEggJs.sh
	test -d build || mkdir build
	./configureNestEgg.sh
	./compileNestEggJs.sh

build/js/root/lib/libvpx.a : configureVpx.sh compileVpxJs.sh
	test -d build || mkdir build
	./configureVpx.sh
	./compileVpxJs.sh

build/ogv-demuxer-ogg.js : src/ogv-demuxer-ogg.c \
                           src/ogv-demuxer.h \
                           src/ogv-demuxer.js \
                           src/ogv-demuxer-callbacks.js \
                           src/ogv-demuxer-exports.json \
                           src/ogv-module-pre.js \
                           build/js/root/lib/libogg.a \
                           build/js/root/lib/liboggz.a \
                           build/js/root/lib/libskeleton.a \
                           compileOgvDemuxerOgg.sh
	test -d build || mkdir build
	./compileOgvDemuxerOgg.sh

build/ogv-demuxer-webm.js : src/ogv-demuxer-webm.c \
                            src/ogv-demuxer.h \
                            src/ogv-demuxer.js \
                            src/ogv-demuxer-callbacks.js \
                            src/ogv-demuxer-exports.json \
                            src/ogv-module-pre.js \
                            build/js/root/lib/libnestegg.a \
                            compileOgvDemuxerWebM.sh
	test -d build || mkdir build
	./compileOgvDemuxerWebM.sh

build/ogv-decoder-audio-vorbis.js : src/ogv-decoder-audio-vorbis.c \
                                    src/ogv-decoder-audio.h \
                                    src/ogv-decoder-audio.js \
                                    src/ogv-decoder-audio-callbacks.js \
                                    src/ogv-decoder-audio-exports.json \
                                    src/ogv-module-pre.js \
                                    build/js/root/lib/libogg.a \
                                    build/js/root/lib/libvorbis.a \
                                    compileOgvDecoderAudioVorbis.sh
	test -d build || mkdir build
	./compileOgvDecoderAudioVorbis.sh

build/ogv-decoder-audio-opus.js : src/ogv-decoder-audio-opus.c \
                                  src/ogv-decoder-audio.h \
                                  src/ogv-decoder-audio.js \
                                  src/ogv-decoder-audio-callbacks.js \
                                  src/ogv-decoder-audio-exports.json \
                                  src/ogv-module-pre.js \
                                  build/js/root/lib/libogg.a \
                                  build/js/root/lib/libopus.a \
                                  compileOgvDecoderAudioOpus.sh
	test -d build || mkdir build
	./compileOgvDecoderAudioOpus.sh

build/ogv-decoder-video-theora.js : src/ogv-decoder-video-theora.c \
                                    src/ogv-decoder-video.h \
                                    src/ogv-decoder-video.js \
                                    src/ogv-decoder-video-callbacks.js \
                                    src/ogv-decoder-video-exports.json \
                                    src/ogv-module-pre.js \
                                    build/js/root/lib/libogg.a \
                                    build/js/root/lib/libtheoradec.a \
                                    compileOgvDecoderVideoTheora.sh
	test -d build || mkdir build
	./compileOgvDecoderVideoTheora.sh

build/ogv-decoder-video-vp8.js : src/ogv-decoder-video-vp8.c \
                                 src/ogv-decoder-video.h \
                                 src/ogv-decoder-video.js \
                                 src/ogv-decoder-video-callbacks.js \
                                 src/ogv-decoder-video-exports.json \
                                 src/ogv-module-pre.js \
                                 build/js/root/lib/libogg.a \
                                 build/js/root/lib/libvpx.a \
                                 compileOgvDecoderVideoVP8.sh
	test -d build || mkdir build
	./compileOgvDecoderVideoVP8.sh

build/YCbCr-shaders.h : src/shaders/YCbCr.vsh src/shaders/YCbCr.fsh src/shaders/YCbCr-stripe.fsh tools/file2def.js
	test -d build || mkdir build
	node tools/file2def.js src/shaders/YCbCr.vsh YCBCR_VERTEX_SHADER > build/YCbCr-shaders.h
	node tools/file2def.js src/shaders/YCbCr.fsh YCBCR_FRAGMENT_SHADER >> build/YCbCr-shaders.h
	node tools/file2def.js src/shaders/YCbCr-stripe.fsh YCBCR_STRIPE_FRAGMENT_SHADER >> build/YCbCr-shaders.h

build/FrameSink.js : src/FrameSink.js.in src/YCbCr.js
	test -d build || mkdir build
	 cpp -E -w -P -CC -nostdinc -Ibuild src/FrameSink.js.in > build/FrameSink.js

build/WebGLFrameSink.js : src/WebGLFrameSink.js.in build/YCbCr-shaders.h
	 cpp -E -w -P -CC -nostdinc -Ibuild src/WebGLFrameSink.js.in > build/WebGLFrameSink.js

build/ogv.js : src/ogv.js.in \
               src/OGVLoader.js \
               src/StreamFile.js \
               src/AudioFeeder.js \
               build/FrameSink.js \
               build/WebGLFrameSink.js \
               src/Bisector.js \
               src/OGVMediaType.js \
               src/OGVWrapperCodec.js \
               src/OGVProxyClass.js \
               src/OGVDecoderAudioProxy.js \
               src/OGVDecoderVideoProxy.js \
               src/OGVPlayer.js \
               build/ogv-demuxer-ogg.js \
               build/ogv-demuxer-webm.js \
               build/ogv-decoder-audio-opus.js \
               build/ogv-decoder-audio-vorbis.js \
               build/ogv-decoder-video-theora.js \
               build/ogv-decoder-video-vp8.js \
               $(DYNAMIC_AUDIO_SWF) \
               build/ogv-worker-audio.js \
               build/ogv-worker-video.js
	cpp -E -w -P -CC -nostdinc -Ibuild src/ogv.js.in > build/ogv.js
	echo 'this.OGVVersion = "$(FULLVER)";' >> build/ogv.js

build/ogv-support.js : src/ogv-support.js.in \
                       src/BogoSlow.js \
                       src/OGVCompat.js \
                       build/ogv.js
	cpp -E -w -P -CC -nostdinc -Ibuild src/ogv-support.js.in > build/ogv-support.js
	echo 'this.OGVVersion = "$(FULLVER)";' >> build/ogv-support.js

build/ogv-version.js : build/ogv.js
	echo 'this.OGVVersion = "$(FULLVER)";' > build/ogv-version.js

build/ogv-worker-audio.js : src/OGVLoader.js \
                            src/OGVWorkerSupport.js \
                            src/OGVWorkerAudio.js \
                            build/ogv-version.js
	cat src/OGVLoader.js \
	    src/OGVWorkerSupport.js \
	    src/OGVWorkerAudio.js \
	    build/ogv-version.js \
	    > build/ogv-worker-audio.js

build/ogv-worker-video.js : src/OGVLoader.js \
                            src/OGVWorkerSupport.js \
                            src/OGVWorkerVideo.js \
                            build/ogv-version.js
	cat src/OGVLoader.js \
	    src/OGVWorkerSupport.js \
	    src/OGVWorkerVideo.js \
	    build/ogv-version.js \
	    > build/ogv-worker-video.js

# The player demo, with the JS build
build/demo/index.html : $(DEMO_DIR)/index.html.in \
                        build/demo/demo.css \
                        build/demo/demo.js \
                        build/demo/iconfont.css \
                        build/demo/motd.js \
                        build/demo/benchmark.html \
                        build/demo/minimal.html \
                        build/demo/media/ehren-paper_lights-96.opus \
                        build/demo/media/pixel_aspect_ratio.ogg \
                        build/demo/media/curiosity.ogv \
                        build/demo/lib/ogv.js \
                        build/demo/lib/cortado.jar \
                        build/demo/lib/CortadoPlayer.js
	test -d build/demo || mkdir -p build/demo
	cpp -E -w -P -CC -nostdinc -DWITH_JS $(DEMO_DIR)/index.html.in > build/demo/index.html

build/demo/demo.css : $(DEMO_DIR)/demo.css
	test -d build/demo || mkdir -p build/demo
	cp $(DEMO_DIR)/demo.css build/demo/demo.css

build/demo/demo.js : $(DEMO_DIR)/demo.js
	test -d build/demo || mkdir -p build/demo
	cp $(DEMO_DIR)/demo.js build/demo/demo.js

build/demo/iconfont.css : $(DEMO_DIR)/iconfont.css
	test -d build/demo || mkdir -p build/demo
	cp $(DEMO_DIR)/iconfont.css build/demo/iconfont.css

build/demo/motd.js : $(DEMO_DIR)/motd.js
	test -d build/demo || mkdir -p build/demo
	cp $(DEMO_DIR)/motd.js build/demo/motd.js

build/demo/benchmark.html : $(DEMO_DIR)/benchmark.html
	test -d build/demo || mkdir -p build/demo
	cp $(DEMO_DIR)/benchmark.html build/demo/benchmark.html

build/demo/minimal.html : $(DEMO_DIR)/minimal.html
	test -d build/demo || mkdir -p build/demo
	cp $(DEMO_DIR)/minimal.html build/demo/minimal.html

build/demo/media/ehren-paper_lights-96.opus : $(DEMO_DIR)/media/ehren-paper_lights-96.opus
	test -d build/demo/media || mkdir -p build/demo/media
	cp $(DEMO_DIR)/media/ehren-paper_lights-96.opus build/demo/media/ehren-paper_lights-96.opus

build/demo/media/pixel_aspect_ratio.ogg : $(DEMO_DIR)/media/pixel_aspect_ratio.ogg
	test -d build/demo/media || mkdir -p build/demo/media
	cp $(DEMO_DIR)/media/pixel_aspect_ratio.ogg build/demo/media/pixel_aspect_ratio.ogg

build/demo/media/curiosity.ogv : $(DEMO_DIR)/media/curiosity.ogv
	test -d build/demo/media || mkdir -p build/demo/media
	cp $(DEMO_DIR)/media/curiosity.ogv build/demo/media/curiosity.ogv

build/demo/lib/ogv.js : dist
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp -pr dist/ogvjs-$(VERSION)/* build/demo/lib/

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
                         $(TESTS_DIR)/index.html
	test -d build/tests || mkdir -p build/tests
	cp $(TESTS_DIR)/index.html build/tests/index.html

build/tests/tests.js : $(TESTS_DIR)/tests.js
	test -d build/tests || mkdir -p build/tests
	cp $(TESTS_DIR)/tests.js build/tests/tests.js

build/tests/lib/ogv.js : dist
	test -d build/tests/lib || mkdir -p build/tests/lib
	cp -pr dist/ogvjs-$(VERSION)/* build/tests/lib/

build/tests/media/1frame.ogv : $(TESTS_DIR)/media/1frame.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp $(TESTS_DIR)/media/1frame.ogv build/tests/media/1frame.ogv

build/tests/media/3frames.ogv : $(TESTS_DIR)/media/3frames.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp $(TESTS_DIR)/media/3frames.ogv build/tests/media/3frames.ogv

build/tests/media/1second.ogv : $(TESTS_DIR)/media/1second.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp $(TESTS_DIR)/media/1second.ogv build/tests/media/1second.ogv

build/tests/media/3seconds.ogv : $(TESTS_DIR)/media/3seconds.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp $(TESTS_DIR)/media/3seconds.ogv build/tests/media/3seconds.ogv

build/tests/media/3seconds-noskeleton.ogv : $(TESTS_DIR)/media/3seconds-noskeleton.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp $(TESTS_DIR)/media/3seconds-noskeleton.ogv build/tests/media/3seconds-noskeleton.ogv

build/tests/media/320x240.ogv : $(TESTS_DIR)/media/320x240.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp $(TESTS_DIR)/media/320x240.ogv build/tests/media/320x240.ogv

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
swf : $(DYNAMIC_AUDIO_SWF)

cleanswf:
	rm -f $(DYNAMIC_AUDIO_SWF)

$(DYNAMIC_AUDIO_SWF) : src/dynamicaudio.as
	mxmlc -o $(DYNAMIC_AUDIO_SWF) -file-specs src/dynamicaudio.as


# fixme move all this to grunt and modules
jshint : js
	jshint src/*.js build/FrameSink.js build/WebGLFrameSink.js
