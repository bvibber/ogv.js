VERSION:=1.0
BUILDDATE:=$(shell date -u "+%Y%m%d%H%M%S")
HASH:=$(shell git rev-parse --short HEAD)
FULLVER:=$(VERSION)-$(BUILDDATE)-$(HASH)

DEMO_DIR:=demo
TESTS_DIR:=tests
DYNAMIC_AUDIO_SWF:=assets/dynamicaudio.swf

.FAKE : all clean cleanswf swf js demo democlean tests dist lint

all : js \
      demo \
      tests

js : build/ogv.js

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

# Build everything and copy the result into distro folder and zip that

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

# Generators for modules ######################

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

# TODO: See WebGLFrameSink.js
#build/YCbCr-shaders.h : src/shaders/YCbCr.vsh src/shaders/YCbCr.fsh src/shaders/YCbCr-stripe.fsh tools/file2def.js
#	test -d build || mkdir build
#	node tools/file2def.js src/shaders/YCbCr.vsh YCBCR_VERTEX_SHADER > build/YCbCr-shaders.h
#	node tools/file2def.js src/shaders/YCbCr.fsh YCBCR_FRAGMENT_SHADER >> build/YCbCr-shaders.h
#	node tools/file2def.js src/shaders/YCbCr-stripe.fsh YCBCR_STRIPE_FRAGMENT_SHADER >> build/YCbCr-shaders.h

# Install dev dependencies

package.json :
	npm install

# Build the main JS bundle and the worker files

build/ogv.js : webpack.config.js package.json
	npm run build

#FIXME: use some webpack way to hardcode package version into distro

# The player demo, with the JS build
# NOTE: This is pretty much only about copying files around
#		Might be possible to simplify, but not clear yet why index.html needs to be a template

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

build/demo/lib/cortado.jar : assets/cortado.jar
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp assets/cortado.jar build/demo/lib/cortado.jar

build/demo/lib/CortadoPlayer.js : src/js/CortadoPlayer.js
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp src/js/CortadoPlayer.js build/demo/lib/CortadoPlayer.js

# TODO: Use Karma with this instead: https://github.com/karma-runner/karma-qunit
#       which will replace this stuff here by a one-liner
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

$(DYNAMIC_AUDIO_SWF) : src/flex/dynamicaudio.as
	mxmlc -o $(DYNAMIC_AUDIO_SWF) -file-specs src/flex/dynamicaudio.as


# fixme move all this to grunt and modules
lint : js
	npm run lint
