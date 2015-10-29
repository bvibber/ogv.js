VERSION:=1.0
BUILDDATE:=$(shell date -u "+%Y%m%d%H%M%S")
HASH:=$(shell git rev-parse --short HEAD)
FULLVER:=$(VERSION)-$(BUILDDATE)-$(HASH)

DEMO_DIR:=demo
TESTS_DIR:=tests
BUILDSCRIPTS_DIR:=buildscripts

DYNAMIC_AUDIO_SWF:=assets/dynamicaudio.swf
CORTADO_JAR:=assets/cortado.jar

JS_FILES := $(shell find src/js -type f -name "*.js")

.FAKE : all clean cleanswf swf js demo democlean tests dist lint run-demo run-dev-server

# Runners

run-demo : package.json demo
	npm run demo

# This uses webpack dev server so we don't need to re-compile anything upon change - just reload the page
#
# 1. Run ``make run-dev-server
# 2. Go to http://localhost:8080/examples/simple/ in your browser to look at a simple example player
# 3. Reload the page to get the latest re-build
run-dev-server : package.json
	npm run server

# Build all

all : js \
      demo \
      tests

# FIXME: add workers targets here as deps
js : build/ogv.js

demo : build/demo/index.html

tests : build/tests/index.html

lint : js
	npm run lint

package.json :
	npm install

# Build the main JS bundle and the worker files

build/ogv.js : webpack.config.js package.json $(JS_FILES)
	npm run build

#FIXME: add workers targets

#FIXME: use some webpack way to hardcode package version into distro

democlean:
	rm -rf build/demo

clean:
	rm -rf build
	rm -rf dist
	rm -f libogg/$(BUILDSCRIPTS_DIR)/configure
	rm -f libvorbis/$(BUILDSCRIPTS_DIR)/configure
	rm -f libtheora/$(BUILDSCRIPTS_DIR)/configure
	rm -f libopus/$(BUILDSCRIPTS_DIR)/configure
	rm -f libskeleton/$(BUILDSCRIPTS_DIR)/configure
	rm -f libnestegg/$(BUILDSCRIPTS_DIR)/configure

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

build/js/root/lib/libogg.a : $(BUILDSCRIPTS_DIR)/configureOgg.sh $(BUILDSCRIPTS_DIR)/compileOggJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureOgg.sh
	./$(BUILDSCRIPTS_DIR)/compileOggJs.sh

build/js/root/lib/liboggz.a : build/js/root/lib/libogg.a $(BUILDSCRIPTS_DIR)/configureOggz.sh $(BUILDSCRIPTS_DIR)/compileOggzJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureOggz.sh
	./$(BUILDSCRIPTS_DIR)/compileOggzJs.sh

build/js/root/lib/libvorbis.a : build/js/root/lib/libogg.a $(BUILDSCRIPTS_DIR)/configureVorbis.sh $(BUILDSCRIPTS_DIR)/compileVorbisJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureVorbis.sh
	./$(BUILDSCRIPTS_DIR)/compileVorbisJs.sh

build/js/root/lib/libopus.a : build/js/root/lib/libogg.a $(BUILDSCRIPTS_DIR)/configureOpus.sh $(BUILDSCRIPTS_DIR)/compileOpusJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureOpus.sh
	./$(BUILDSCRIPTS_DIR)/compileOpusJs.sh

build/js/root/lib/libskeleton.a : build/js/root/lib/libogg.a $(BUILDSCRIPTS_DIR)/configureSkeleton.sh $(BUILDSCRIPTS_DIR)/compileSkeletonJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureSkeleton.sh
	./$(BUILDSCRIPTS_DIR)/compileSkeletonJs.sh


build/js/root/lib/libtheoradec.a : build/js/root/lib/libogg.a $(BUILDSCRIPTS_DIR)/configureTheora.sh $(BUILDSCRIPTS_DIR)/compileTheoraJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureTheora.sh
	./$(BUILDSCRIPTS_DIR)/compileTheoraJs.sh

build/js/root/lib/libnestegg.a : $(BUILDSCRIPTS_DIR)/configureNestEgg.sh $(BUILDSCRIPTS_DIR)/compileNestEggJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureNestEgg.sh
	./$(BUILDSCRIPTS_DIR)/compileNestEggJs.sh

build/js/root/lib/libvpx.a : $(BUILDSCRIPTS_DIR)/configureVpx.sh $(BUILDSCRIPTS_DIR)/compileVpxJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureVpx.sh
	./$(BUILDSCRIPTS_DIR)/compileVpxJs.sh

build/ogv-demuxer-ogg.js : src/c/ogv-demuxer-ogg.c \
                           src/c/ogv-demuxer.h \
                           src/js/modules/ogv-demuxer.js \
                           src/js/modules/ogv-demuxer-callbacks.js \
                           src/js/modules/ogv-demuxer-exports.json \
                           src/js/modules/ogv-module-pre.js \
                           build/js/root/lib/libogg.a \
                           build/js/root/lib/liboggz.a \
                           build/js/root/lib/libskeleton.a \
                           $(BUILDSCRIPTS_DIR)/compileOgvDemuxerOgg.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/compileOgvDemuxerOgg.sh

build/ogv-demuxer-webm.js : src/ogv-demuxer-webm.c \
                            src/ogv-demuxer.h \
                            src/ogv-demuxer.js \
                            src/ogv-demuxer-callbacks.js \
                            src/ogv-demuxer-exports.json \
                            src/ogv-module-pre.js \
                            build/js/root/lib/libnestegg.a \
                            $(BUILDSCRIPTS_DIR)/compileOgvDemuxerWebM.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/compileOgvDemuxerWebM.sh

build/ogv-decoder-audio-vorbis.js : src/ogv-decoder-audio-vorbis.c \
                                    src/ogv-decoder-audio.h \
                                    src/ogv-decoder-audio.js \
                                    src/ogv-decoder-audio-callbacks.js \
                                    src/ogv-decoder-audio-exports.json \
                                    src/ogv-module-pre.js \
                                    build/js/root/lib/libogg.a \
                                    build/js/root/lib/libvorbis.a \
                                    $(BUILDSCRIPTS_DIR)/compileOgvDecoderAudioVorbis.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/compileOgvDecoderAudioVorbis.sh

build/ogv-decoder-audio-opus.js : src/ogv-decoder-audio-opus.c \
                                  src/ogv-decoder-audio.h \
                                  src/ogv-decoder-audio.js \
                                  src/ogv-decoder-audio-callbacks.js \
                                  src/ogv-decoder-audio-exports.json \
                                  src/ogv-module-pre.js \
                                  build/js/root/lib/libogg.a \
                                  build/js/root/lib/libopus.a \
                                  $(BUILDSCRIPTS_DIR)/compileOgvDecoderAudioOpus.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/compileOgvDecoderAudioOpus.sh

build/ogv-decoder-video-theora.js : src/ogv-decoder-video-theora.c \
                                    src/ogv-decoder-video.h \
                                    src/ogv-decoder-video.js \
                                    src/ogv-decoder-video-callbacks.js \
                                    src/ogv-decoder-video-exports.json \
                                    src/ogv-module-pre.js \
                                    build/js/root/lib/libogg.a \
                                    build/js/root/lib/libtheoradec.a \
                                    $(BUILDSCRIPTS_DIR)/compileOgvDecoderVideoTheora.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/compileOgvDecoderVideoTheora.sh

build/ogv-decoder-video-vp8.js : src/ogv-decoder-video-vp8.c \
                                 src/ogv-decoder-video.h \
                                 src/ogv-decoder-video.js \
                                 src/ogv-decoder-video-callbacks.js \
                                 src/ogv-decoder-video-exports.json \
                                 src/ogv-module-pre.js \
                                 build/js/root/lib/libogg.a \
                                 build/js/root/lib/libvpx.a \
                                 $(BUILDSCRIPTS_DIR)/compileOgvDecoderVideoVP8.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/compileOgvDecoderVideoVP8.sh

# TODO: See WebGLFrameSink.js
#build/YCbCr-shaders.h : src/shaders/YCbCr.vsh src/shaders/YCbCr.fsh src/shaders/YCbCr-stripe.fsh tools/file2def.js
#	test -d build || mkdir build
#	node tools/file2def.js src/shaders/YCbCr.vsh YCBCR_VERTEX_SHADER > build/YCbCr-shaders.h
#	node tools/file2def.js src/shaders/YCbCr.fsh YCBCR_FRAGMENT_SHADER >> build/YCbCr-shaders.h
#	node tools/file2def.js src/shaders/YCbCr-stripe.fsh YCBCR_STRIPE_FRAGMENT_SHADER >> build/YCbCr-shaders.h

# Install dev dependencies

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

build/demo/lib/cortado.jar : $(CORTADO_JAR)
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp $(CORTADO_JAR) build/demo/lib/cortado.jar

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

