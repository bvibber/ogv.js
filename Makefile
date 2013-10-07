.FAKE : all clean

all : build/ogv.js

clean:
	rm -f build/ogv-libs.js
	rm -f build/ogv.js
	rm -f libogg/configure
	rm -f libvorbis/configure
	rm -f libtheora/configure

build/ogv-libs.js : src/ogv-libs.c src/ogv-libs-mixin.js compileOgg.sh compileVorbis.sh compileTheora.sh compileOgv.sh
	test -d build || mkdir build
	./compileOgg.sh
	./compileVorbis.sh
	./compileTheora.sh
	./compileOgv.sh

build/ogv.js : src/ogv-main.js build/ogv-libs.js
	importer src/ogv-main.js build/ogv.js
