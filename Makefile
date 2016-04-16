all : build

.FAKE : all swf lint build deps clean distclean flexsdk flexsdk-base flexsdk-libs flexsdk-playerglobal

build : lint swf
	npm run-script build

lint :
	npm run-script lint

clean :
	rm -f assets/dynamicaudio.swf
	rm -rf build

distclean :
	rm -f apache-flex-sdk-*-bin.tar.gz
	rm -rf apache-flex-sdk-*-bin
	rm -f flashplayer-libs


# -----------
# Flash stuff
# -----------

HERE:=`pwd`

FLEXSDK_VERSION:=4.15.0
FLEXSDK_BASE:=http://www-us.apache.org/dist/flex/$(FLEXSDK_VERSION)/binaries
FLEXSDK_DIR:=apache-flex-sdk-$(FLEXSDK_VERSION)-bin
FLEXSDK_ARCHIVE:=$(FLEXSDK_DIR).tar.gz
FLEXSDK_URL:=$(FLEXSDK_BASE)/$(FLEXSDK_ARCHIVE)

PLAYERGLOBAL_BASE:=$(FLEXSDK_DIR)/frameworks/libs/player
PLAYERGLOBAL_DIR:=$(PLAYERGLOBAL_BASE)/11.1
PLAYERGLOBAL_URL:=http://fpdownload.macromedia.com/get/flashplayer/updaters/11/playerglobal11_1.swc

swf : assets/dynamicaudio.swf

assets/dynamicaudio.swf : src/dynamicaudio.as flexsdk
	FLEX_HOME="$(HERE)/$(FLEXSDK_DIR)" \
	PLAYERGLOBAL_HOME="$(HERE)/$(PLAYERGLOBAL_BASE)" \
	$(FLEXSDK_DIR)/bin/mxmlc -o assets/dynamicaudio.swf -file-specs src/dynamicaudio.as

flexsdk : flexsdk-base flexsdk-libs flexsdk-playerglobal

flexsdk-base : $(FLEXSDK_DIR)/flex-sdk-description.xml

$(FLEXSDK_DIR)/flex-sdk-description.xml :
	curl -o "$(FLEXSDK_ARCHIVE)" "$(FLEXSDK_URL)"
	tar zxvf "$(FLEXSDK_ARCHIVE)"

# Download additional non-free libraries for Apache Flex SDK
flexsdk-libs : flexsdk-base $(FLEXSDK_DIR)/frameworks/libs/osmf.swc

$(FLEXSDK_DIR)/frameworks/libs/osmf.swc :
	(cd $(FLEXSDK_DIR)/frameworks && ant thirdparty-downloads)

# Download bits belonging to the Flash Player that flex compiler needs
flexsdk-playerglobal : flexsdk-base $(PLAYERGLOBAL_DIR)/playerglobal.swc

$(PLAYERGLOBAL_DIR)/playerglobal.swc :
	mkdir -p "$(PLAYERGLOBAL_DIR)"
	curl -o "$(PLAYERGLOBAL_DIR)/playerglobal.swc" "$(PLAYERGLOBAL_URL)"
