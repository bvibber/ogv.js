# Makefile for the Flash build

all : assets/dynamicaudio.swf

.FAKE : all swf clean distclean

swf : assets/dynamicaudio.swf

clean :
	rm -f assets/dynamicaudio.swf

distclean :
	rm -f apache-flex-sdk-*-bin.tar.gz
	rm -rf apache-flex-sdk-*-bin
	rm -f flashplayer-libs


# -----------
# Flash stuff
# -----------

HERE:=$(shell if [ "${OS}" = "Windows_NT" ]; then cmd /c cd; else pwd; fi)

FLEXSDK_VERSION:=4.15.0
FLEXSDK_BASE:=http://www-us.apache.org/dist/flex/$(FLEXSDK_VERSION)/binaries
FLEXSDK_DIR:=apache-flex-sdk-$(FLEXSDK_VERSION)-bin
FLEXSDK_ARCHIVE:=$(FLEXSDK_DIR).tar.gz
FLEXSDK_URL:=$(FLEXSDK_BASE)/$(FLEXSDK_ARCHIVE)

PLAYERGLOBAL_BASE:=$(FLEXSDK_DIR)/frameworks/libs/player
PLAYERGLOBAL_DIR:=$(PLAYERGLOBAL_BASE)/11.1
PLAYERGLOBAL_URL:=http://fpdownload.macromedia.com/get/flashplayer/updaters/11/playerglobal11_1.swc

FLEXSDK_BASE_DEP:=$(FLEXSDK_DIR)/flex-sdk-description.xml
FLEXSDK_LIBS_DEP:=$(FLEXSDK_DIR)/frameworks/libs/osmf.swc
FLEXSDK_PLAYERGLOBAL_DEP:=$(PLAYERGLOBAL_DIR)/playerglobal.swc
FLEXSDK_ALL_DEP:=$(FLEXSDK_BASE_DEP) $(FLEXSDK_LIBS_DEP) $(FLEXSDK_PLAYERGLOBAL_DEP)

assets/dynamicaudio.swf : src/dynamicaudio.as $(FLEXSDK_ALL_DEP)
	FLEX_HOME="$(HERE)/$(FLEXSDK_DIR)" \
	PLAYERGLOBAL_HOME="$(HERE)/$(PLAYERGLOBAL_BASE)" \
	$(FLEXSDK_DIR)/bin/mxmlc -o assets/dynamicaudio.swf -file-specs src/dynamicaudio.as

$(FLEXSDK_BASE_DEP) :
	curl -o "$(FLEXSDK_ARCHIVE)" "$(FLEXSDK_URL)"
	tar zxvf "$(FLEXSDK_ARCHIVE)"

# Download additional non-free libraries for Apache Flex SDK
$(FLEXSDK_LIBS_DEP) : $(FLEXSDK_BASE_DEP)
	(cd $(FLEXSDK_DIR)/frameworks && ant thirdparty-downloads)

# Download bits belonging to the Flash Player that flex compiler needs
$(FLEXSDK_PLAYERGLOBAL_DEP) : $(FLEXSDK_BASE_DEP)
	mkdir -p "$(PLAYERGLOBAL_DIR)"
	curl -o "$(PLAYERGLOBAL_DIR)/playerglobal.swc" "$(PLAYERGLOBAL_URL)"
