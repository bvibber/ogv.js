#include "AS3/AS3.h"

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
	annotate("as3sig:public function OgvSwfProcess(audioPosition:Number,audioEmpty:int):int"),
	annotate("as3package:com.brionv.ogvlibs")));
void OgvSwfProcess()
{
	double audioPosition;
	int audioEmpty;
	AS3_GetScalarFromVar(audioPosition, audioPosition);
	AS3_GetScalarFromVar(audioEmpty, audioEmpty);
	int ret = OgvJsProcess(audioPosition, audioEmpty);
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



// Callbacks into AS code...
void OgvJsInitVideo(int frameWidth, int frameHeight,
                           int hdec, int vdec,
                           double fps,
                           int picWidth, int picHeight,
                           int picX, int picY)
{
}

void OgvJsOutputFrameReady(double videoPosition)
{
}

void OgvJsOutputFrame(unsigned char *bufferY, int strideY,
                             unsigned char *bufferCb, int strideCb,
                             unsigned char *bufferCr, int strideCr,
                             int width, int height,
                             int hdec, int vdec)
{
}

void OgvJsInitAudio(int channels, int rate)
{
}

void OgvJsOutputAudioReady()
{
}

void OgvJsOutputAudio(float **buffers, int channels, int sampleCount)
{
}

void OgvJsOutputAudioInt(int **buffers, int channels, int sampleCount)
{
}
