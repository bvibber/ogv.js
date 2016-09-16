VERSION:=$(shell node tools/getversion.js ..)
BUILDDATE:=$(shell date -u "+%Y%m%d%H%M%S")
HASH:=$(shell git rev-parse --short HEAD)
FULLVER:=$(VERSION)-$(BUILDDATE)-$(HASH)

DEMO_DIR:=demo
TESTS_DIR:=tests
BUILDSCRIPTS_DIR:=buildscripts

AUDIO_DIR:=node_modules/audio-feeder

CORTADO_JAR:=assets/cortado.jar

JS_SRC_DIR:=src/js
JS_FILES:=$(shell find $(JS_SRC_DIR) -type f -name "*.js")
JS_FILES+= $(shell find $(JS_SRC_DIR)/workers -type f -name "*.js")

EMSCRIPTEN_MODULE_TARGETS:=build/ogv-demuxer-ogg.js
EMSCRIPTEN_MODULE_TARGETS+= build/ogv-demuxer-webm.js
EMSCRIPTEN_MODULE_TARGETS+= build/ogv-decoder-audio-vorbis.js
EMSCRIPTEN_MODULE_TARGETS+= build/ogv-decoder-audio-opus.js
EMSCRIPTEN_MODULE_TARGETS+= build/ogv-decoder-video-theora.js
EMSCRIPTEN_MODULE_TARGETS+= build/ogv-decoder-video-vp8.js
EMSCRIPTEN_MODULE_SRC_DIR:=$(JS_SRC_DIR)/modules
EMSCRIPTEN_MODULE_FILES:=$(shell find $(EMSCRIPTEN_MODULE_SRC_DIR) -type f -name "*.js")
EMSCRIPTEN_MODULE_FILES+= $(shell find $(EMSCRIPTEN_MODULE_SRC_DIR) -type f -name "*.json")

C_SRC_DIR:=src/c
C_FILES:=$(shell find $(C_SRC_DIR) -type f -name "*.c")
C_FILES+= $(shell find $(C_SRC_DIR) -type f -name "*.h")

JS_ROOT_BUILD_DIR:=build/js/root

.PHONY : DEFAULT all clean cleanswf swf js demo democlean tests dist zip lint run-demo run-dev-server

DEFAULT : all

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

all : dist \
      zip \
      demo \
      tests

js : build/ogv.js $(EMSCRIPTEN_MODULE_TARGETS)

demo : build/demo/index.html

tests : build/tests/index.html

lint :
	npm run lint

package.json :
	npm install

build/ogv.js : webpack.config.js package.json $(JS_FILES)
	OGV_FULL_VERSION=$(FULLVER) npm run build

democlean:
	rm -rf build/demo

clean:
	rm -rf build
	rm -rf dist
	rm -f libogg/configure
	rm -f liboggz/configure
	rm -f libvorbis/configure
	rm -f libtheora/configure
	rm -f libopus/configure
	rm -f libskeleton/configure
	rm -f libnestegg/configure

# Build everything and copy the result into dist folder

dist: js README.md COPYING
	rm -rf dist
	mkdir dist
	cp -p build/ogv.js \
	      build/ogv-support.js \
	      build/ogv-version.js \
	      build/ogv-demuxer-ogg.js \
	      build/ogv-demuxer-webm.js \
	      build/ogv-decoder-audio-opus.js \
	      build/ogv-decoder-audio-vorbis.js \
	      build/ogv-decoder-video-theora.js \
	      build/ogv-decoder-video-vp8.js \
	      build/ogv-worker-audio.js \
	      build/ogv-worker-video.js \
	      build/dynamicaudio.swf \
	      README.md \
	      COPYING \
	      dist/
	cp -p libogg/COPYING dist/COPYING-ogg.txt
	cp -p libvorbis/COPYING dist/COPYING-vorbis.txt
	cp -p libtheora/COPYING dist/COPYING-theora.txt
	cp -p libopus/COPYING dist/COPYING-opus.txt
	cp -p libnestegg/LICENSE dist/LICENSE-nestegg.txt
	cp -p libvpx/LICENSE dist/LICENSE-vpx.txt
	cp -p libvpx/PATENTS dist/PATENTS-vpx.txt

# Zip up the dist folder for non-packaged release

zip: dist
	rm -rf zip
	mkdir zip
	mkdir zip/ogvjs-$(VERSION)
	cp -pr dist/* zip/ogvjs-$(VERSION)
	(cd zip && zip -r ogvjs-$(VERSION).zip ogvjs-$(VERSION))


# Build depending C libraries with Emscripten

$(JS_ROOT_BUILD_DIR)/lib/libogg.a : $(BUILDSCRIPTS_DIR)/configureOgg.sh $(BUILDSCRIPTS_DIR)/compileOggJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureOgg.sh
	./$(BUILDSCRIPTS_DIR)/compileOggJs.sh

$(JS_ROOT_BUILD_DIR)/lib/liboggz.a : $(JS_ROOT_BUILD_DIR)/lib/libogg.a $(BUILDSCRIPTS_DIR)/configureOggz.sh $(BUILDSCRIPTS_DIR)/compileOggzJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureOggz.sh
	./$(BUILDSCRIPTS_DIR)/compileOggzJs.sh

$(JS_ROOT_BUILD_DIR)/lib/libvorbis.a : $(JS_ROOT_BUILD_DIR)/lib/libogg.a $(BUILDSCRIPTS_DIR)/configureVorbis.sh $(BUILDSCRIPTS_DIR)/compileVorbisJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureVorbis.sh
	./$(BUILDSCRIPTS_DIR)/compileVorbisJs.sh

$(JS_ROOT_BUILD_DIR)/lib/libopus.a : $(JS_ROOT_BUILD_DIR)/lib/libogg.a $(BUILDSCRIPTS_DIR)/configureOpus.sh $(BUILDSCRIPTS_DIR)/compileOpusJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureOpus.sh
	./$(BUILDSCRIPTS_DIR)/compileOpusJs.sh

$(JS_ROOT_BUILD_DIR)/lib/libskeleton.a : $(JS_ROOT_BUILD_DIR)/lib/libogg.a $(BUILDSCRIPTS_DIR)/configureSkeleton.sh $(BUILDSCRIPTS_DIR)/compileSkeletonJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureSkeleton.sh
	./$(BUILDSCRIPTS_DIR)/compileSkeletonJs.sh

$(JS_ROOT_BUILD_DIR)/lib/libtheoradec.a : $(JS_ROOT_BUILD_DIR)/lib/libogg.a $(BUILDSCRIPTS_DIR)/configureTheora.sh $(BUILDSCRIPTS_DIR)/compileTheoraJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureTheora.sh
	./$(BUILDSCRIPTS_DIR)/compileTheoraJs.sh

$(JS_ROOT_BUILD_DIR)/lib/libnestegg.a : $(BUILDSCRIPTS_DIR)/configureNestEgg.sh $(BUILDSCRIPTS_DIR)/compileNestEggJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureNestEgg.sh
	./$(BUILDSCRIPTS_DIR)/compileNestEggJs.sh

$(JS_ROOT_BUILD_DIR)/lib/libvpx.a : $(BUILDSCRIPTS_DIR)/configureVpx.sh $(BUILDSCRIPTS_DIR)/compileVpxJs.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/configureVpx.sh
	./$(BUILDSCRIPTS_DIR)/compileVpxJs.sh

# Compile our Emscripten modules

build/ogv-demuxer-ogg.js : $(C_SRC_DIR)/ogv-demuxer-ogg.c \
                           $(C_SRC_DIR)/ogv-demuxer.h \
                           $(C_SRC_DIR)/ogv-buffer-queue.c \
                           $(C_SRC_DIR)/ogv-buffer-queue.h \
                           $(JS_SRC_DIR)/modules/ogv-demuxer.js \
                           $(JS_SRC_DIR)/modules/ogv-demuxer-callbacks.js \
                           $(JS_SRC_DIR)/modules/ogv-demuxer-exports.json \
                           $(JS_SRC_DIR)/modules/ogv-module-pre.js \
                           $(JS_ROOT_BUILD_DIR)/lib/libogg.a \
                           $(JS_ROOT_BUILD_DIR)/lib/liboggz.a \
                           $(JS_ROOT_BUILD_DIR)/lib/libskeleton.a \
                           $(BUILDSCRIPTS_DIR)/compileOgvDemuxerOgg.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/compileOgvDemuxerOgg.sh

build/ogv-demuxer-webm.js : $(C_SRC_DIR)/ogv-demuxer-webm.c \
                            $(C_SRC_DIR)/ogv-demuxer.h \
                            $(C_SRC_DIR)/ogv-buffer-queue.c \
                            $(C_SRC_DIR)/ogv-buffer-queue.h \
                            $(JS_SRC_DIR)/modules/ogv-demuxer.js \
                            $(JS_SRC_DIR)/modules/ogv-demuxer-callbacks.js \
                            $(JS_SRC_DIR)/modules/ogv-demuxer-exports.json \
                            $(JS_SRC_DIR)/modules/ogv-module-pre.js \
                            $(JS_ROOT_BUILD_DIR)/lib/libnestegg.a \
                            $(BUILDSCRIPTS_DIR)/compileOgvDemuxerWebM.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/compileOgvDemuxerWebM.sh

build/ogv-decoder-audio-vorbis.js : $(C_SRC_DIR)/ogv-decoder-audio-vorbis.c \
                                    $(C_SRC_DIR)/ogv-decoder-audio.h \
                                    $(JS_SRC_DIR)/modules/ogv-decoder-audio.js \
                                    $(JS_SRC_DIR)/modules/ogv-decoder-audio-callbacks.js \
                                    $(JS_SRC_DIR)/modules/ogv-decoder-audio-exports.json \
                                    $(JS_SRC_DIR)/modules/ogv-module-pre.js \
                                    $(JS_ROOT_BUILD_DIR)/lib/libogg.a \
                                    $(JS_ROOT_BUILD_DIR)/lib/libvorbis.a \
                                    $(BUILDSCRIPTS_DIR)/compileOgvDecoderAudioVorbis.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/compileOgvDecoderAudioVorbis.sh

build/ogv-decoder-audio-opus.js : $(C_SRC_DIR)/ogv-decoder-audio-opus.c \
                                  $(C_SRC_DIR)/ogv-decoder-audio.h \
                                  $(JS_SRC_DIR)/modules/ogv-decoder-audio.js \
                                  $(JS_SRC_DIR)/modules/ogv-decoder-audio-callbacks.js \
                                  $(JS_SRC_DIR)/modules/ogv-decoder-audio-exports.json \
                                  $(JS_SRC_DIR)/modules/ogv-module-pre.js \
                                  $(JS_ROOT_BUILD_DIR)/lib/libogg.a \
                                  $(JS_ROOT_BUILD_DIR)/lib/libopus.a \
                                  $(BUILDSCRIPTS_DIR)/compileOgvDecoderAudioOpus.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/compileOgvDecoderAudioOpus.sh

build/ogv-decoder-video-theora.js : $(C_SRC_DIR)/ogv-decoder-video-theora.c \
                                    $(C_SRC_DIR)/ogv-decoder-video.h \
                                    $(JS_SRC_DIR)/modules/ogv-decoder-video.js \
                                    $(JS_SRC_DIR)/modules/ogv-decoder-video-callbacks.js \
                                    $(JS_SRC_DIR)/modules/ogv-decoder-video-exports.json \
                                    $(JS_SRC_DIR)/modules/ogv-module-pre.js \
                                    $(JS_ROOT_BUILD_DIR)/lib/libogg.a \
                                    $(JS_ROOT_BUILD_DIR)/lib/libtheoradec.a \
                                    $(BUILDSCRIPTS_DIR)/compileOgvDecoderVideoTheora.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/compileOgvDecoderVideoTheora.sh

build/ogv-decoder-video-vp8.js : $(C_SRC_DIR)/ogv-decoder-video-vp8.c \
                                 $(C_SRC_DIR)/ogv-decoder-video.h \
                                 $(JS_SRC_DIR)/modules/ogv-decoder-video.js \
                                 $(JS_SRC_DIR)/modules/ogv-decoder-video-callbacks.js \
                                 $(JS_SRC_DIR)/modules/ogv-decoder-video-exports.json \
                                 $(JS_SRC_DIR)/modules/ogv-module-pre.js \
                                 $(JS_ROOT_BUILD_DIR)/lib/libogg.a \
                                 $(JS_ROOT_BUILD_DIR)/lib/libvpx.a \
                                 $(BUILDSCRIPTS_DIR)/compileOgvDecoderVideoVP8.sh
	test -d build || mkdir build
	./$(BUILDSCRIPTS_DIR)/compileOgvDecoderVideoVP8.sh

# Install dev dependencies

# The player demo, with the JS build
# NOTE: This is pretty much only about copying files around
#		Might be possible to simplify, but not clear yet why index.html needs to be a template

build/demo/index.html : $(DEMO_DIR)/index.html.in \
                        build/demo/demo.css \
                        build/demo/ajax-loader.gif \
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
	sed 's/OGV_VERSION/$(FULLVER)/g' < $(DEMO_DIR)/index.html.in > build/demo/index.html

build/demo/demo.css : $(DEMO_DIR)/demo.css
	test -d build/demo || mkdir -p build/demo
	cp $(DEMO_DIR)/demo.css build/demo/demo.css

build/demo/ajax-loader.gif : $(DEMO_DIR)/ajax-loader.gif
	test -d build/demo || mkdir -p build/demo
	cp $(DEMO_DIR)/ajax-loader.gif build/demo/ajax-loader.gif

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

build/demo/minimal.html : $(DEMO_DIR)/minimal.html.in
	test -d build/demo || mkdir -p build/demo
	sed 's/OGV_VERSION/$(FULLVER)/g' < $(DEMO_DIR)/minimal.html.in > build/demo/minimal.html

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
	cp -pr dist/* build/demo/lib/

build/demo/lib/cortado.jar : $(CORTADO_JAR)
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp $(CORTADO_JAR) build/demo/lib/cortado.jar

build/demo/lib/CortadoPlayer.js : $(JS_SRC_DIR)/CortadoPlayer.js
	test -d build/demo/lib || mkdir -p build/demo/lib
	cp $(JS_SRC_DIR)/CortadoPlayer.js build/demo/lib/CortadoPlayer.js

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
												 build/tests/media/aspect.ogv \
                         $(TESTS_DIR)/index.html
	test -d build/tests || mkdir -p build/tests
	cp $(TESTS_DIR)/index.html build/tests/index.html

build/tests/tests.js : $(TESTS_DIR)/tests.js
	test -d build/tests || mkdir -p build/tests
	cp $(TESTS_DIR)/tests.js build/tests/tests.js

build/tests/lib/ogv.js : dist
	test -d build/tests/lib || mkdir -p build/tests/lib
	cp -pr dist/* build/tests/lib/

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

build/tests/media/aspect.ogv : $(TESTS_DIR)/media/aspect.ogv
	test -d build/tests/media || mkdir -p build/tests/media
	cp $(TESTS_DIR)/media/aspect.ogv build/tests/media/aspect.ogv
