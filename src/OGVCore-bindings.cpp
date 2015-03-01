#include <OGVCore.h>
#include <emscripten/bind.h>

using namespace OGVCore;
using namespace emscripten;

EMSCRIPTEN_BINDINGS(OGVCore)
{
	value_object<Point>("OGVCorePoint")
		.field("x", &Point::x)
		.field("y", &Point::y)
		;

	value_object<Size>("OGVCoreSize")
		.field("width", &Size::width)
		.field("height", &Size::height)
		;

	class_<AudioLayout>("OGVCoreAudioLayout")
		.smart_ptr<std::shared_ptr<AudioLayout>>("OGVCoreFrameLayoutPtr")
		.property("channelCount", &AudioLayout::channelCount)
		.property("sampleRate", &AudioLayout::sampleRate)
		;

	class_<AudioBuffer>("OGVCoreAudioBuffer")
		.smart_ptr<std::shared_ptr<AudioBuffer>>("OGVCoreAudioBufferPtr")
		.property("layout", &AudioBuffer::layout)
		.property("sampleCount", &AudioBuffer::sampleCount)
		.property("samples", &AudioBuffer::samples)
		;

	class_<FrameLayout>("OGVCoreFrameLayout")
		.smart_ptr<std::shared_ptr<FrameLayout>>("OGVCoreFrameLayoutPtr")
		.property("frame", &FrameLayout::frame)
		.property("picture", &FrameLayout::picture)
		.property("offset", &FrameLayout::offset)
		.property("subsampling", &FrameLayout::subsampling)
		.property("aspectRatio", &FrameLayout::aspectRatio)
		.property("fps", &FrameLayout::fps)
		;

    class_<Decoder>("OGVCoreDecoder")
        .smart_ptr_constructor("OGVCoreDecoder", &std::make_shared<Decoder>)
	    .function("hasAudio", &Decoder::hasAudio) // @fixme property?
	    .function("hasVideo", &Decoder::hasVideo) // @fixme property?
	    .function("isAudioReady", &Decoder::isAudioReady) // @fixme property?
	    .function("isFrameReady", &Decoder::isFrameReady) // @fixme property?
 	    .function("getAudioLayout", &Decoder::getAudioLayout) // @fixme property?
	    .function("getFrameLayout", &Decoder::getFrameLayout) // @fixme property?
	    .function("receiveInput", &Decoder::receiveInput)
	    .function("process", &Decoder::process)
	    .function("decodeFrame", &Decoder::decodeFrame)
	    .function("dequeueFrame", &Decoder::dequeueFrame)
	    .function("discardFrame", &Decoder::discardFrame)
	    .function("decodeAudio", &Decoder::decodeAudio)
	    .function("dequeueAudio", &Decoder::dequeueAudio)
	    .function("discardAudio", &Decoder::discardAudio)
	    .function("flush", &Decoder::flush)
	    ;
}