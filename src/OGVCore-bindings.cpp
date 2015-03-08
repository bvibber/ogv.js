#include <OGVCore.h>
#include <emscripten/bind.h>

namespace OGVCore {

	emscripten::memory_view<unsigned char>
	PlaneBufferJS_getBytes(const PlaneBuffer &aPlane)
	{
		return emscripten::typed_memory_view(aPlane.stride * aPlane.height, aPlane.bytes);
	}
	
	void
	PlaneBufferJS_setBytes(PlaneBuffer &aPlane, emscripten::val aVal)
	{
		// stub, only needed for embind
	}

	void DecoderJS_receiveInput(Decoder &aDecoder, std::string aBuffer)
	{
		// embind doesn't know how to convert ArrayBuffer to vector<>
		std::vector<unsigned char> vec(aBuffer.cbegin(), aBuffer.cend());
		aDecoder.receiveInput(vec);
	}

	std::shared_ptr<Decoder>
	DecoderJS_ctor(Decoder::Delegate *aDelegate)
	{
		return std::make_shared<Decoder>(std::unique_ptr<Decoder::Delegate>(aDelegate));
	}
	
	class DecoderDelegateWrapper : public emscripten::wrapper<Decoder::Delegate> {
	public:
		EMSCRIPTEN_WRAPPER(DecoderDelegateWrapper);

		void onLoadedMetadata() {
			return call<void>("onLoadedMetadata");
		}
	};

}

using namespace OGVCore;
using namespace emscripten;



EMSCRIPTEN_BINDINGS(OGVCore)
{
	register_vector<unsigned char *>("VectorByte");
	register_vector<float>("VectorFloat");
	register_vector<std::vector<float>>("VectorVectorFloat");

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

	value_object<PlaneBuffer>("OGVCorePlaneBuffer")
		.field("bytes", &PlaneBufferJS_getBytes, &PlaneBufferJS_setBytes)
		.field("stride", &PlaneBuffer::stride)
		.field("height", &PlaneBuffer::height)
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
        .smart_ptr_constructor("OGVCoreDecoder", &DecoderJS_ctor, allow_raw_pointers())
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
	    .function("getSegmentLength", &Decoder::getSegmentLength)
	    .function("getDuration", &Decoder::getDuration)
	    .function("getKeypointOffset", &Decoder::getKeypointOffset)
	    ;
	
	class_<Decoder::Delegate>("OGVCoreDecoderDelegate")
		.function("onLoadedMetadata", &Decoder::Delegate::onLoadedMetadata, pure_virtual())
		.allow_subclass<DecoderDelegateWrapper>("DecoderDelegateWrapper")
		;

}
