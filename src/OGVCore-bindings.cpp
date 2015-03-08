#include <OGVCore.h>
#include <emscripten/bind.h>

namespace OGVCore {

	emscripten::val
	PlaneBufferJS_getBytes(const PlaneBuffer &aPlane)
	{
		return emscripten::val(emscripten::typed_memory_view(aPlane.stride * aPlane.height, aPlane.bytes));
	}

	emscripten::val
	AudioBufferJS_getChannelData(AudioBuffer &aBuffer, int aChannel)
	{
		auto floatVec = aBuffer.getChannelData(aChannel);
		return emscripten::val(emscripten::typed_memory_view(floatVec.size(), floatVec.data()));
	}

	void
	DecoderJS_receiveInput(Decoder &aDecoder, std::string aBuffer)
	{
		// embind doesn't know how to convert ArrayBuffer to vector<>
		std::vector<unsigned char> vec(aBuffer.cbegin(), aBuffer.cend());
		aDecoder.receiveInput(vec);
	}

	emscripten::val
	DecoderJS_getOnLoadedMetadata(const Decoder &aDecoder)
	{
		return emscripten::val(nullptr);
	}
	
	void
	DecoderJS_setOnLoadedMetadata(Decoder &aDecoder, emscripten::val aCallback)
	{
		aDecoder.setOnLoadedMetadata([aCallback] () {
			// Due to compiler oddities we can't do aCallback() directly
			// because the lambda captures it as const. This may make sense
			// to someone on the C++11 committee, but not to me. :)
			emscripten::val callback(aCallback);
			callback();
		});
	}

}

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
		.property("length", &AudioBuffer::length)
		.property("numberOfChannels", &AudioBuffer::numberOfChannels)
		.property("duration", &AudioBuffer::duration)
		.function("getChannelData", &AudioBufferJS_getChannelData)
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

	class_<PlaneBuffer>("OGVCorePlaneBuffer")
		.property("bytes", &PlaneBufferJS_getBytes)
		.property("stride", &PlaneBuffer::stride)
		.property("height", &PlaneBuffer::height)
		;

	class_<FrameBuffer>("OGVCoreFrameBuffer")
		.smart_ptr<std::shared_ptr<FrameBuffer>>("OGVCoreFrameBufferPtr")
		.property("layout", &FrameBuffer::layout)
		.property("timestamp", &FrameBuffer::timestamp)
		.property("keyframeTimestamp", &FrameBuffer::keyframeTimestamp)
		.property("Y", &FrameBuffer::Y)
		.property("Cb", &FrameBuffer::Cb)
		.property("Cr", &FrameBuffer::Cr)
		;

    class_<Decoder>("OGVCoreDecoder")
        .smart_ptr_constructor("OGVCoreDecoder", &std::make_shared<Decoder>)
        .property("onloadedmetadata", &DecoderJS_getOnLoadedMetadata, &DecoderJS_setOnLoadedMetadata)
	    .property("hasAudio", &Decoder::hasAudio)
	    .property("hasVideo", &Decoder::hasVideo)
	    .property("audioReady", &Decoder::audioReady)
	    .property("frameReady", &Decoder::frameReady)
 	    .property("audioLayout", &Decoder::getAudioLayout)
	    .property("frameLayout", &Decoder::getFrameLayout)
	    .function("receiveInput", &DecoderJS_receiveInput)
	    .function("process", &Decoder::process)
	    .function("decodeFrame", &Decoder::decodeFrame)
	    .function("dequeueFrame", &Decoder::dequeueFrame)
	    .function("discardFrame", &Decoder::discardFrame)
	    .function("decodeAudio", &Decoder::decodeAudio)
	    .function("dequeueAudio", &Decoder::dequeueAudio)
	    .function("discardAudio", &Decoder::discardAudio)
	    .function("flush", &Decoder::flush)
	    .property("segmentLength", &Decoder::getSegmentLength)
	    .property("duration", &Decoder::getDuration)
	    .function("getKeypointOffset", &Decoder::getKeypointOffset)
	    ;
}
