VERSION:=0.9.3beta
BUILDDATE:=$(shell date -u "+%Y%m%d%H%M%S")
HASH:=$(shell git rev-parse --short HEAD)
FULLVER:=$(VERSION)-$(BUILDDATE)-$(HASH)

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

dist: js src/dynamicaudio.swf readme.md COPYING
	rm -rf dist
	mkdir dist
	mkdir dist/ogvjs-$(VERSION)
	cp -p build/ogv.js \
	      build/ogv-codec.js \
	      build/webm-codec.js \
	      build/ogv-demuxer-ogg.js \
	      build/ogv-decoder-audio-opus.js \
	      build/ogv-decoder-audio-vorbis.js \
	      build/ogv-decoder-video-theora.js \
	      build/ogv-support.js \
	      build/ogv-version.js \
	      src/ogv-worker.js \
	      build/ogv-worker-audio.js \
	      build/ogv-worker-video.js \
	      src/dynamicaudio.swf \
	      readme.md \
	      COPYING \
	      dist/ogvjs-$(VERSION)/
	cp -p libogg/COPYING dist/ogvjs-$(VERSION)/COPYING-ogg.txt
	cp -p libvorbis/COPYING dist/ogvjs-$(VERSION)/COPYING-vorbis.txt
	cp -p libtheora/COPYING dist/ogvjs-$(VERSION)/COPYING-theora.txt
	cp -p libopus/COPYING dist/ogvjs-$(VERSION)/COPYING-opus.txt
	(cd dist && zip -r ogvjs-$(VERSION).zip ogvjs-$(VERSION))

build/js/root/lib/libogg.a : configureOgg.sh compileOggJs.sh
	test -d build || mkdir build
	./configureOgg.sh
	./compileOggJs.sh

build/js/root/lib/liboggz.a : configureOggz.sh compileOggzJs.sh
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

build/js/ogv-libs.js : src/ogv-libs.c src/codecjs.h src/opus_helper.c src/opus_helper.h src/opus_header.c src/opus_header.h \
                       src/codec-libs-mixin.js \
                       src/codec-libs-exports.json \
                       build/js/root/lib/libogg.a \
                       build/js/root/lib/libtheoradec.a \
                       build/js/root/lib/libvorbis.a \
                       build/js/root/lib/libopus.a \
                       build/js/root/lib/libskeleton.a \
                       compileOgvJs.sh
	test -d build || mkdir build
	./compileOgvJs.sh

build/ogv-codec.js : src/codec-libs.js.in build/js/ogv-libs.js
	test -d build || mkdir build
	cpp -E -w -P -CC -nostdinc -DCODEC_CLASS=OGVOggDecoder -DCODEC_TARGET='"../build/js/ogv-libs.js"' src/codec-libs.js.in > build/ogv-codec.js

build/js/webm-libs.js : src/webm-libs.c \
                        src/codecjs.h \
                        src/opus_helper.c \
                        src/opus_helper.h \
                        src/opus_header.c \
                        src/opus_header.h \
                        src/codec-libs-mixin.js \
                        src/codec-libs-exports.json \
                        build/js/root/lib/libogg.a \
                        build/js/root/lib/libvorbis.a \
                        build/js/root/lib/libopus.a \
                        build/js/root/lib/libnestegg.a \
                        build/js/root/lib/libvpx.a \
                        compileWebMJs.sh
	test -d build || mkdir build
	./compileWebMJs.sh

build/webm-codec.js : src/codec-libs.js.in build/js/webm-libs.js
	test -d build || mkdir build
	cpp -E -w -P -CC -nostdinc -DCODEC_CLASS=OGVWebMDecoder -DCODEC_TARGET='"../build/js/webm-libs.js"' src/codec-libs.js.in > build/webm-codec.js

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

build/YCbCr-shaders.h : src/YCbCr.vsh src/YCbCr.fsh src/YCbCr-stripe.fsh file2def.js
	test -d build || mkdir build
	node file2def.js src/YCbCr.vsh YCBCR_VERTEX_SHADER > build/YCbCr-shaders.h
	node file2def.js src/YCbCr.fsh YCBCR_FRAGMENT_SHADER >> build/YCbCr-shaders.h
	node file2def.js src/YCbCr-stripe.fsh YCBCR_STRIPE_FRAGMENT_SHADER >> build/YCbCr-shaders.h

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
               src/OGVWorkerCodec.js \
               src/OGVWrapperCodec.js \
               src/OGVProxyClass.js \
               src/OGVDecoderAudioProxy.js \
               src/OGVDecoderVideoProxy.js \
               src/OGVPlayer.js \
               build/ogv-codec.js \
               build/ogv-codec.js.gz \
               build/ogv-demuxer-ogg.js \
               build/ogv-decoder-audio-opus.js \
               build/ogv-decoder-audio-vorbis.js \
               build/ogv-decoder-video-theora.js \
               build/webm-codec.js \
               build/webm-codec.js.gz \
               src/dynamicaudio.swf \
               src/ogv-worker.js \
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

build/ogv-codec.js.gz : build/ogv-codec.js
	 7z -tgzip -mx=9 -so a dummy.gz build/ogv-codec.js > build/ogv-codec.js.gz || gzip -9 -c build/ogv-codec.js > build/ogv-codec.js.gz

build/webm-codec.js.gz : build/webm-codec.js
	 7z -tgzip -mx=9 -so a dummy.gz build/webm-codec.js > build/webm-codec.js.gz || gzip -9 -c build/webm-codec.js > build/webm-codec.js.gz

# The player demo, with the JS build
build/demo/index.html : src/demo/index.html.in \
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
	cpp -E -w -P -CC -nostdinc -DWITH_JS src/demo/index.html.in > build/demo/index.html

build/demo/demo.css : src/demo/demo.css
	test -d build/demo || mkdir -p build/demo
	cp src/demo/demo.css build/demo/demo.css

build/demo/demo.js : src/demo/demo.js
	test -d build/demo || mkdir -p build/demo
	cp src/demo/demo.js build/demo/demo.js

build/demo/iconfont.css : src/demo/iconfont.css
	test -d build/demo || mkdir -p build/demo
	cp src/demo/iconfont.css build/demo/iconfont.css

build/demo/motd.js : src/demo/motd.js
	test -d build/demo || mkdir -p build/demo
	cp src/demo/motd.js build/demo/motd.js

build/demo/benchmark.html : src/demo/benchmark.html
	test -d build/demo || mkdir -p build/demo
	cp src/demo/benchmark.html build/demo/benchmark.html

build/demo/minimal.html : src/demo/minimal.html
	test -d build/demo || mkdir -p build/demo
	cp src/demo/minimal.html build/demo/minimal.html

build/demo/media/ehren-paper_lights-96.opus : src/demo/media/ehren-paper_lights-96.opus
	test -d build/demo/media || mkdir -p build/demo/media
	cp src/demo/media/ehren-paper_lights-96.opus build/demo/media/ehren-paper_lights-96.opus

build/demo/media/pixel_aspect_ratio.ogg : src/demo/media/pixel_aspect_ratio.ogg
	test -d build/demo/media || mkdir -p build/demo/media
	cp src/demo/media/pixel_aspect_ratio.ogg build/demo/media/pixel_aspect_ratio.ogg

build/demo/media/curiosity.ogv : src/demo/media/curiosity.ogv
	test -d build/demo/media || mkdir -p build/demo/media
	cp src/demo/media/curiosity.ogv build/demo/media/curiosity.ogv

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
                         src/tests/index.html
	test -d build/tests || mkdir -p build/tests
	cp src/tests/index.html build/tests/index.html

build/tests/tests.js : src/tests/tests.js
	test -d build/tests || mkdir -p build/tests
	cp src/tests/tests.js build/tests/tests.js

build/tests/lib/ogv.js : dist
	test -d build/tests/lib || mkdir -p build/tests/lib
	cp -pr dist/ogvjs-$(VERSION)/* build/tests/lib/

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


# fixme move all this to grunt and modules
jshint : js
	jshint src/*.js build/FrameSink.js build/WebGLFrameSink.js
