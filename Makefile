.FAKE : all clean

all : build/ogv.js

clean:
	rm -f build/ogv-libs.js
	rm -f build/ogv.js

build/ogv-libs.js : src/ogv-libs.c compileOgg.sh compileVorbis.sh compileTheora.sh
	./compileOgg.sh
	./compileVorbis.sh
	./compileTheora.sh
	./compileOgv.sh

build/ogv.js : src/ogv-main.js build/ogv-libs.js
	importer src/ogv-main.js build/ogv.js
