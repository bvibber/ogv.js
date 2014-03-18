#include <stdlib.h>

#include "AS3/AS3.h"

#include "YCbCr.h"

// Stub main for the library
int main(int argc, const char **argv) {
    AS3_GoAsync();
}

// AS3 API wrappers

void OgvSwfInit() __attribute__((used,
	annotate("as3sig:public function OgvSwfInit(audio:int,video:int):void"),
	annotate("as3package:com.brionv.ogvlibs")));
void OgvSwfInit()
{
	int audio;
	int video;
	AS3_GetScalarFromVar(audio, audio);
	AS3_GetScalarFromVar(video, video);
	OgvJsInit(audio, video);
}

void OgvSwfDestroy() __attribute__((used,
	annotate("as3sig:public function OgvSwfDestroy():void"),
	annotate("as3package:com.brionv.ogvlibs")));
void OgvSwfDestroy()
{
	OgvJsDestroy();
}

void OgvSwfReceiveInput() __attribute__((used,
	annotate("as3sig:public function OgvSwfReceiveInput(buffer:int, bufferSize:int):void"),
	annotate("as3package:com.brionv.ogvlibs")));
void OgvSwfReceiveInput()
{
	char *buffer;
	int bufferSize;
	AS3_GetScalarFromVar(buffer, buffer);
	AS3_GetScalarFromVar(bufferSize, bufferSize);
	OgvJsReceiveInput(buffer, bufferSize);
}

void OgvSwfProcess() __attribute__((used,
	annotate("as3sig:public function OgvSwfProcess():int"),
	annotate("as3package:com.brionv.ogvlibs")));
void OgvSwfProcess()
{
	int ret = OgvJsProcess();
	AS3_Return(ret);
}

void OgvSwfDecodeFrame() __attribute__((used,
	annotate("as3sig:public function OgvSwfDecodeFrame():int"),
	annotate("as3package:com.brionv.ogvlibs")));
void OgvSwfDecodeFrame()
{
	int ret = OgvJsDecodeFrame();
	AS3_Return(ret);
}

void OgvSwfDecodeAudio() __attribute__((used,
	annotate("as3sig:public function OgvSwfDecodeAudio():int"),
	annotate("as3package:com.brionv.ogvlibs")));
void OgvSwfDecodeAudio()
{
	int ret = OgvJsDecodeAudio();
	AS3_Return(ret);
}


static unsigned char *bufferARGB = NULL;
void OgvSwfConvertYCbCr() __attribute__((used,
	annotate("as3sig:public function OgvSwfConvertYCbCr(bufferY:int,bufferCb:int,bufferCr:int,strideY:int,strideCb:int,strideCr:int,width:int,height:int,hdec:int,vdec:int):int"),
	annotate("as3package:com.brionv.ogvlibs")));
void OgvSwfConvertYCbCr()
{
	unsigned char *bufferY;
	unsigned char *bufferCb;
	unsigned char *bufferCr;
	int strideY;
	int strideCb;
	int strideCr;
	int width;
	int height;
	int hdec;
	int vdec;

	AS3_GetScalarFromVar(bufferY, bufferY);
	AS3_GetScalarFromVar(bufferCb, bufferCb);
	AS3_GetScalarFromVar(bufferCr, bufferCr);
	AS3_GetScalarFromVar(strideY, strideY);
	AS3_GetScalarFromVar(strideCb, strideCb);
	AS3_GetScalarFromVar(strideCr, strideCr);
	AS3_GetScalarFromVar(width, width);
	AS3_GetScalarFromVar(height, height);
	AS3_GetScalarFromVar(hdec, hdec);
	AS3_GetScalarFromVar(vdec, vdec);

	if (bufferARGB == NULL) {
		int i;
		bufferARGB = (unsigned char *)malloc(width * height * 8);
		for (i = 0; i < width * height * 4; i += 4) {
			bufferARGB[i] = 0xff; // prefill alpha
		}
	}

	convertYCbCr(bufferY, bufferCb, bufferCr,
	             strideY, strideCb, strideCr,
	             width, height,
	             hdec, vdec,
	             bufferARGB);

	AS3_Return((int)bufferARGB);
}


// Public vars for the callbacks...
package_as3(
    "#package public\n"
	"public var ogvSwfMetadataLoadedCallback:Function;\n"
	"public var ogvSwfInitVideoCallback:Function;\n"
	"public var ogvSwfOutputFrameReadyCallback:Function;\n"
	"public var ogvSwfOutputFrameCallback:Function;\n"
	"public var ogvSwfInitAudioCallback:Function;\n"
	"public var ogvSwfOutputAudioReadyCallback:Function;\n"
	"public var ogvSwfOutputAudioCallback:Function;\n"
);

// Callbacks into AS code...
void OgvJsMetadataLoaded()
{
	inline_as3(
		"ogvSwfMetadataLoadedCallback();\n"
		: :
	);
}

void OgvJsInitVideo(int frameWidth, int frameHeight,
                           int hdec, int vdec,
                           double fps,
                           int picWidth, int picHeight,
                           int picX, int picY)
{
	inline_as3(
		"ogvSwfInitVideoCallback({\n"
		"  frameWidth: %0,\n"
		"  frameHeight: %1,\n"
		"  hdec: %2,\n"
		"  vdec: %3,\n"
		"  fps: %4,\n"
		"  picWidth: %5,\n"
		"  picHeight: %6,\n"
		"  picX: %7,\n"
		"  picY: %8\n"
		"});\n"
		:
		: "r"(frameWidth),
		  "r"(frameHeight),
		  "r"(hdec),
		  "r"(vdec),
		  "r"(fps),
		  "r"(picWidth),
		  "r"(picHeight),
		  "r"(picX),
		  "r"(picY)
	);
}

void OgvJsOutputFrameReady(double videoPosition)
{
	inline_as3(
		"ogvSwfOutputFrameReadyCallback();\n"
		: :
	);
}

void OgvJsOutputFrame(unsigned char *bufferY, int strideY,
                             unsigned char *bufferCb, int strideCb,
                             unsigned char *bufferCr, int strideCr,
                             int width, int height,
                             int hdec, int vdec,
                             double timestamp)
{
	inline_as3(
		"ogvSwfOutputFrameCallback(\n"
		"  %0, %1,\n"
		"  %2, %3,\n"
		"  %4, %5,\n"
		"  %6, %7,\n"
		"  %8, %9,\n"
		"  %10\n"
		");\n"
		:
		: "r"((int)bufferY),
		  "r"(strideY),
		  "r"((int)bufferCb),
		  "r"(strideCb),
		  "r"((int)bufferCr),
		  "r"(strideCr),
		  "r"(width),
		  "r"(height),
		  "r"(hdec),
		  "r"(vdec),
		  "r"(timestamp)
	);
}

void OgvJsInitAudio(int channels, int rate)
{
	inline_as3(
		"ogvSwfInitAudioCallback({\n"
		"  codec: 'Theora',\n"
		"  channels: %0,\n"
		"  rate: %1\n"
		"});\n"
		:
		: "r"(channels),
		  "r"(rate)
	);
}

void OgvJsOutputAudioReady()
{
	inline_as3(
		"ogvSwfOutputAudioReadyCallback();\n"
		:
		:
	);
}

void OgvJsOutputAudio(float **buffers, int channels, int sampleCount)
{
	inline_as3(
		"ogvSwfOutputAudioCallback(%0, %1, %2);\n"
		:
		: "r"((int)buffers),
		  "r"(channels),
		  "r"(sampleCount)
	);
}

