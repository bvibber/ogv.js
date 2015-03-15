#include <OGVCore.h>
#include <emscripten/bind.h>

namespace OGVCore {

	emscripten::val
	PlaneBufferJS_getBytes(const PlaneBuffer &aPlane)
	{
		return emscripten::val(emscripten::typed_memory_view(aPlane.stride * aPlane.height, aPlane.bytes));
	}

	void
	PlaneBufferJS_setBytes(PlaneBuffer &aPlane, emscripten::val aValue)
	{
		// for embind only
	}

	emscripten::val
	AudioBufferJS_getChannelData(AudioBuffer &aBuffer, int aChannel)
	{
		auto floatVec = aBuffer.getChannelData(aChannel);
		return emscripten::val(emscripten::typed_memory_view(floatVec.size(), floatVec.data()));
	}

	emscripten::val
	DecoderJS_getAudioLayout(const Decoder &aDecoder)
	{
		auto layout = aDecoder.getAudioLayout();
		if (layout == nullptr) {
			return emscripten::val(nullptr);
		} else {
			return emscripten::val(*layout);
		}
	}
	
	emscripten::val
	DecoderJS_getFrameLayout(const Decoder &aDecoder)
	{
		auto layout = aDecoder.getFrameLayout();
		if (layout == nullptr) {
			return emscripten::val(nullptr);
		} else {
			return emscripten::val(*layout);
		}
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
	
	bool
	DecoderJS_decodeFrame(Decoder &aDecoder, emscripten::val aCallback)
	{
		return aDecoder.decodeFrame([aCallback] (FrameBuffer &aBuffer) {
			emscripten::val callback(aCallback);
			callback(aBuffer);
		});
	}

	bool
	DecoderJS_decodeAudio(Decoder &aDecoder, emscripten::val aCallback)
	{
		return aDecoder.decodeAudio([aCallback] (AudioBuffer &aBuffer) {
			emscripten::val callback(aCallback);
			callback(aBuffer);
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

	value_object<AudioLayout>("OGVCoreAudioLayout")
		.field("channelCount", &AudioLayout::channelCount)
		.field("sampleRate", &AudioLayout::sampleRate)
		;

	class_<AudioBuffer>("OGVCoreAudioBuffer")
		.smart_ptr<std::shared_ptr<AudioBuffer>>("OGVCoreAudioBufferPtr")
		.property("length", &AudioBuffer::length)
		.property("numberOfChannels", &AudioBuffer::numberOfChannels)
		.property("duration", &AudioBuffer::duration)
		.function("getChannelData", &AudioBufferJS_getChannelData)
		;

	value_object<FrameLayout>("OGVCoreFrameLayout")
		.field("frame", &FrameLayout::frame)
		.field("picture", &FrameLayout::picture)
		.field("offset", &FrameLayout::offset)
		.field("subsampling", &FrameLayout::subsampling)
		.field("aspectRatio", &FrameLayout::aspectRatio)
		.field("fps", &FrameLayout::fps)
		;

	value_object<PlaneBuffer>("OGVCorePlaneBuffer")
		.field("bytes", &PlaneBufferJS_getBytes, &PlaneBufferJS_setBytes)
		.field("stride", &PlaneBuffer::stride)
		.field("height", &PlaneBuffer::height)
		;

	value_object<FrameBuffer>("OGVCoreFrameBuffer")
		.field("layout", &FrameBuffer::layout)
		.field("timestamp", &FrameBuffer::timestamp)
		.field("keyframeTimestamp", &FrameBuffer::keyframeTimestamp)
		.field("Y", &FrameBuffer::Y)
		.field("Cb", &FrameBuffer::Cb)
		.field("Cr", &FrameBuffer::Cr)
		;

    class_<Decoder>("OGVCoreDecoder")
        .smart_ptr_constructor("OGVCoreDecoder", &std::make_shared<Decoder>)
        .property("onloadedmetadata", &DecoderJS_getOnLoadedMetadata, &DecoderJS_setOnLoadedMetadata)
	    .property("hasAudio", &Decoder::hasAudio)
	    .property("hasVideo", &Decoder::hasVideo)
	    .property("audioReady", &Decoder::audioReady)
	    .property("frameReady", &Decoder::frameReady)
	    .property("audioTimestamp", &Decoder::audioTimestamp)
	    .property("frameTimestamp", &Decoder::frameTimestamp)
	    .property("keyframeTimestamp", &Decoder::keyframeTimestamp)
 	    .property("audioLayout", &DecoderJS_getAudioLayout)
	    .property("frameLayout", &DecoderJS_getFrameLayout)
	    .function("receiveInput", &DecoderJS_receiveInput)
	    .function("process", &Decoder::process)
	    .function("decodeFrame", &DecoderJS_decodeFrame)
	    .function("discardFrame", &Decoder::discardFrame)
	    .function("decodeAudio", &DecoderJS_decodeAudio)
	    .function("discardAudio", &Decoder::discardAudio)
	    .function("flush", &Decoder::flush)
	    .property("segmentLength", &Decoder::getSegmentLength)
	    .property("duration", &Decoder::getDuration)
	    .function("getKeypointOffset", &Decoder::getKeypointOffset)
	    ;
}
