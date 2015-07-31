#include <assert.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <limits.h>

#include <nestegg/nestegg.h>

#include "ogv-demuxer.h"

static nestegg        *demuxContext;
static char           *bufferQueue = NULL;
static off_t           bufferQueueIndex = 0;
static size_t          bufferSize = 0;
static size_t          maxBufferSize = 0;
static uint64_t        bufferBytesRead = 0;

static bool            hasVideo = false;
static unsigned int    videoTrack = 0;
static int             videoCodec = -1;
static char           *videoCodecName = NULL;

static bool            hasAudio = false;
static unsigned int    audioTrack = 0;
static int             audioCodec = -1;
static char           *audioCodecName = NULL;

enum AppState {
    STATE_BEGIN,
    STATE_DECODING
} appState;

void ogv_demuxer_init() {
    appState = STATE_BEGIN;
}

static void logCallback(nestegg *context, unsigned int severity, char const * format, ...)
{
	if (severity >= NESTEGG_LOG_INFO) {
		va_list args;
		va_start(args, format);
		vprintf(format, args);
		va_end(args);
	}
}

static int readCallback(void * buffer, size_t length, void *userdata)
{
	if (bufferQueueIndex + length > bufferSize) {
		// @todo rework to use asyncify
		printf("READ FAIL; read %d at index %d of size %d of max size %d\n", (int)length, (int)bufferQueueIndex, (int)bufferSize, (int)maxBufferSize);
		return -1;
	}
	
	// return the first bytes...
	//printf("READ %d at %d\n", (int)length, (int)bufferQueueIndex);
	memcpy(buffer, bufferQueue + bufferQueueIndex, length);
	bufferQueueIndex += length;
	
	return 1;
}

static int seekCallback(int64_t offset, int whence, void * userdata)
{
	// @todo rework to use asyncify
	abort();
	return -1;
}

static int64_t tellCallback(void * userdata)
{
	// @todo rework to use asyncify
	return bufferBytesRead;
}

static nestegg_io ioCallbacks = {
	readCallback,
	seekCallback,
	tellCallback,
	NULL
};

static int processBegin() {
	// This will read through headers, hopefully we have enough data
	// or else it may fail and explode.
	// @todo rework all this to faux sync or else full async
	printf("nestegg_init starting...\n");
	if (nestegg_init(&demuxContext, ioCallbacks, logCallback, -1) < 0) {
		printf("nestegg_init failed\n");
		return 0;
	}

	// Look through the tracks finding our video and audio
	unsigned int tracks;
	if (nestegg_track_count(demuxContext, &tracks) < 0) {
		tracks = 0;
	}
	for (unsigned int track = 0; track < tracks; track++) {
		int trackType = nestegg_track_type(demuxContext, track);
		int codec = nestegg_track_codec_id(demuxContext, track);
		
		if (trackType == NESTEGG_TRACK_VIDEO && !hasVideo) {
			if (codec == NESTEGG_CODEC_VP8) {
				hasVideo = 1;
				videoTrack = track;
				videoCodec = codec;
				videoCodecName = "vp8";
			}
			if (codec == NESTEGG_CODEC_VP9) {
				hasVideo = 1;
				videoTrack = track;
				videoCodec = codec;
				videoCodecName = "vp9";
			}
		}
		
		if (trackType == NESTEGG_TRACK_AUDIO && !hasAudio) {
			if (codec == NESTEGG_CODEC_VORBIS) {
				hasAudio = 1;
				audioTrack = track;
				audioCodec = codec;
				audioCodecName = "vorbis";
			}
			if (codec == NESTEGG_CODEC_OPUS) {
				hasAudio = 1;
				audioTrack = track;
				audioCodec = codec;
				audioCodecName = "opus";
			}
		}
	}

	if (hasVideo) {
		nestegg_video_params videoParams;
		if (nestegg_track_video_params(demuxContext, videoTrack, &videoParams) < 0) {
			// failed! something is wrong...
			hasVideo = 0;
		} else {
			ogvjs_callback_init_video(videoParams.width, videoParams.height,
			                          1, 1, // @todo assuming 4:2:0
			                          0, // @todo get fps
			                          videoParams.width - videoParams.crop_left - videoParams.crop_right,
			                          videoParams.height - videoParams.crop_top - videoParams.crop_bottom,
                                      videoParams.crop_left, videoParams.crop_top,
                                      videoParams.display_width, videoParams.display_height);
		}
	}

	if (hasAudio) {
		nestegg_audio_params audioParams;
		if (nestegg_track_audio_params(demuxContext, audioTrack, &audioParams) < 0) {
			// failed! something is wrong
			hasAudio = 0;
		} else {
			unsigned int codecDataCount;
			nestegg_track_codec_data_count(demuxContext, audioTrack, &codecDataCount);
			printf("codec data for audio: %d\n", codecDataCount);
			
            for (unsigned int i = 0; i < codecDataCount; i++) {
                unsigned char *data;
                size_t len;
                int ret = nestegg_track_codec_data(demuxContext, audioTrack, i, &data, &len);
                if (ret < 0) {
                	printf("failed to read codec data %d\n", i);
                	abort();
                }
                // ... store these!
                ogvjs_callback_audio_packet((char *)data, len, -1);
			}
		}
	}

	appState = STATE_DECODING;
	printf("Done with headers step\n");
	ogvjs_callback_loaded_metadata(videoCodecName, audioCodecName);

	return 1;
}

static int processDecoding() {
	//printf("webm processDecoding: reading next packet...\n");

	// Do the nestegg_read_packet dance until it fails to read more data,
	// at which point we ask for more. Hope it doesn't explode.
	nestegg_packet *packet = NULL;
	int ret = nestegg_read_packet(demuxContext, &packet);
	if (ret == 0) {
		// end of stream?
		//printf("webm processDecoding: end of stream?\n");
		return 0;
	} else if (ret < 0) {
		//printf("webm processDecoding: error %d\n", ret);
		return 0;
	} else {
		//printf("webm processDecoding: got packet?\n");
		unsigned int track;
		nestegg_packet_track(packet, &track);

		uint64_t timestamp_ns;
		nestegg_packet_tstamp(packet, &timestamp_ns);
		float timestamp = timestamp_ns / 1000000000.0;

		unsigned char *data = NULL;
		size_t data_len = 0;
		nestegg_packet_data(packet, 0, &data, &data_len);

		if (hasVideo && track == videoTrack) {
			ogvjs_callback_video_packet((char *)data, data_len, timestamp, timestamp);
		} else if (hasAudio && track == audioTrack) {
			ogvjs_callback_audio_packet((char *)data, data_len, timestamp);
		} else {
			// throw away unknown packets
		}
		return 1;
	}
}

static void receive_input(const char *buffer, int bufsize) {
    if (bufsize > 0) {
		// stuff received data on end of an input queue
		// which will be drained by the sync io callback
		
		// @fixme this is hella inefficient i bet
		if (bufferSize + bufsize >= maxBufferSize) {
			if (bufferQueueIndex > 0) {
				// shift over the data we already ready
				printf("SHIFT index was %d of size %d of max size %d\n", (int)bufferQueueIndex, (int)bufferSize, (int)maxBufferSize);
				bufferSize -= bufferQueueIndex;
				memmove(bufferQueue, bufferQueue + bufferQueueIndex, bufferSize);
				bufferQueueIndex = 0;
			}
			if (bufferSize + bufsize >= maxBufferSize) {
				// still need more room? expand.
				printf("EXPAND size was %d of max size %d\n", (int)bufferSize, (int)maxBufferSize);
				while (bufferSize + bufsize >= maxBufferSize) {
					maxBufferSize += 65536;
				}
				bufferQueue = realloc(bufferQueue, maxBufferSize);
			}
		}
		printf("APPEND %d\n", (int)bufsize);
		memcpy(bufferQueue + bufferSize, buffer, bufsize);
		bufferSize += bufsize;
    }
}

int ogv_demuxer_process(const char *data, size_t data_len) {
	receive_input(data, data_len);

	int needData = 0;

	// quick i/o hack
	while ((bufferSize - bufferQueueIndex) > 256 * 1024) {
		//printf("XXX checking packets at %d\n", (int)(bufferSize - bufferQueueIndex));
		if (appState == STATE_BEGIN) {
			return processBegin();
		} else if (appState == STATE_DECODING) {
			if (processDecoding()) {
				continue;
			} else {
				return 0;
			}
		} else {
			// uhhh...
			printf("Invalid appState in ogv_demuxer_process\n");
			break;
		}
	}
	return 0;
}

void ogv_demuxer_destroy() {
	// should probably tear stuff down, eh
}

void ogv_demuxer_flush() {
	// @todo

	// First, read out anything left in our input buffer
	
	// Then, dump all packets from the streams
}

/**
 * @return segment length in bytes, or -1 if unknown
 */
long ogv_demuxer_media_length() {
	// @todo check if this is needed? maybe an ogg-specific thing
	return -1;
}

/**
 * @return segment duration in seconds, or -1 if unknown
 */
float ogv_demuxer_media_duration() {
	uint64_t duration_ns;
    if (nestegg_duration(demuxContext, &duration_ns) < 0) {
    	return -1;
    } else {
	    return duration_ns / 1000000000.0;
	}
}

long ogv_demuxer_keypoint_offset(long time_ms)
{
	// @todo implement or rework
	// nestegg's seeking implementation is sync
	return -1;
}

/*

ok may work to:
* have a read callback that returns queued data or fails
** detect the fail high-level and retry
* have a stub seek/tell callback that just explodes...
** thus, avoid using the seeking functions for now

*/
