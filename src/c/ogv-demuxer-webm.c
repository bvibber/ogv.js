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

typedef struct {
    char *bytes;
    int64_t start;
    size_t len;
} BufferQueueItem;

typedef struct {
    // Currently assumes all items are adjacent and in order
    BufferQueueItem *items;
    size_t len;
    size_t max;
    int64_t pos;
    int64_t lastSeekTarget;
} BufferQueue;

static BufferQueue *bq_init() {
    BufferQueue *queue = malloc(sizeof(BufferQueue));
    queue->pos = 0;
    queue->len = 0;
    queue->max = 8;
    queue->items = malloc(queue->max * sizeof(BufferQueueItem));
    return queue;
}

static int64_t bq_start(BufferQueue *queue) {
    if (queue->len == 0) {
        return queue->pos;
    }
    return queue->items[0].start;
}

static int64_t bq_end(BufferQueue *queue) {
    if (queue->len == 0) {
        return queue->pos;
    }
    return queue->items[queue->len - 1].start + queue->items[queue->len - 1].len;
}

static int64_t bq_tell(BufferQueue *queue) {
    return queue->pos;
}

static int64_t bq_headroom(BufferQueue *queue) {
    return bq_end(queue) - bq_tell(queue);
}

static int bq_seek(BufferQueue *queue, int64_t pos) {
    if (bq_start(queue) > pos) {
        printf("trying to seek to %lld\n", pos);
        queue->lastSeekTarget = pos;
        return -1;
    }
    if (bq_end(queue) <= pos) {
        printf("trying to seek to %lld\n", pos);
        queue->lastSeekTarget = pos;
        return -1;
    }
    printf("in-buffer seek to %lld\n", pos);
    queue->pos = pos;
    return 0;
}

static void bq_trim(BufferQueue *queue) {
    int shift = 0;
    for (int i = 0; i < queue->len; i++) {
        if (queue->items[i].start + queue->items[i].len < queue->pos) {
            free(queue->items[i].bytes);
            queue->items[i].bytes = NULL;
            shift++;
            continue;
        } else {
            break;
        }
    }
    if (shift) {
        queue->len -= shift;
        memmove(queue->items, queue->items + shift, queue->len * sizeof(BufferQueueItem));
    }
}

static void bq_flush(BufferQueue *queue) {
    for (int i = 0; i < queue->len; i++) {
        free(queue->items[i].bytes);
        queue->items[i].bytes = NULL;
    }
    queue->len = 0;
}

static void bq_append(BufferQueue *queue, const char *data, size_t len) {
    if (queue->len == queue->max) {
        bq_trim(queue);
    }
    if (queue->len == queue->max) {
        queue->max += 8;
        queue->items = realloc(queue->items, queue->max * sizeof(BufferQueueItem));
    }
    queue->items[queue->len].start = bq_end(queue);
    queue->items[queue->len].len = len;
    queue->items[queue->len].bytes = malloc(len);
    memcpy(queue->items[queue->len].bytes, data, len);
    queue->len++;
}

static int bq_read(BufferQueue *queue, char *data, size_t len) {
    if (bq_headroom(queue) < len) {
        printf("failed bq_read len %d at pos %lld\n", len, queue->pos);
        return -1;
    }

    size_t offset = 0;
    size_t remaining = len;
    for (int i = 0; i < queue->len; i++) {
        if (queue->items[i].start + queue->items[i].len < queue->pos) {
            //printf("bq_read skipped item at pos %lld len %d\n", queue->items[i].start, queue->items[i].len);
            continue;
        }
        size_t chunkStart = queue->pos - queue->items[i].start;
        size_t chunkLen = queue->items[i].len - chunkStart;
        if (chunkLen > remaining) {
            chunkLen = remaining;
        }
        memcpy(data + offset, queue->items[i].bytes + chunkStart, chunkLen);
        //printf("bq_read copy chunkStart %d chunkLen %d to offset %d; from item %d start %lld len %d (pos %lld)\n", chunkStart, chunkLen, offset, i, queue->items[i].start, queue->items[i].len, queue->pos);
        queue->pos += chunkLen;
        offset += chunkLen;
        remaining -= chunkLen;
        if (remaining <= 0) {
            return 0;
        }
    }
    printf("failed a bq_read len %d at pos %lld\n", len, queue->pos);
    return -1;
}

static void bq_free(BufferQueue *queue) {
    bq_flush(queue);
    free(queue->items);
    free(queue);
};

static nestegg        *demuxContext;
static BufferQueue    *bufferQueue;

static bool            hasVideo = false;
static unsigned int    videoTrack = 0;
static int             videoCodec = -1;
static char           *videoCodecName = NULL;

static bool            hasAudio = false;
static unsigned int    audioTrack = 0;
static int             audioCodec = -1;
static char           *audioCodecName = NULL;

static int64_t         seekTime;
static unsigned int    seekTrack;

enum AppState {
    STATE_BEGIN,
    STATE_DECODING,
    STATE_SEEKING
} appState;

void ogv_demuxer_init() {
    appState = STATE_BEGIN;
    bufferQueue = bq_init();
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
	if (bq_headroom((BufferQueue *)userdata) < length) {
		// End of stream. Demuxer can recover from this if more data comes in!
		return 0;
	}

	if (bq_read((BufferQueue *)userdata, buffer, length)) {
		// error
		return -1;
	} else {
		// success
		return 1;
	}
}

static int seekCallback(int64_t offset, int whence, void * userdata)
{
    int64_t pos;
    switch (whence) {
        case SEEK_SET:
            pos = offset;
            break;
        case SEEK_CUR:
            pos = ((BufferQueue *)userdata)->pos + offset;
            break;
        case SEEK_END: // not implemented
        default:
            return -1;
    }
    if (bq_seek((BufferQueue *)userdata, pos)) {
        printf("Buffer seek failure in webm demuxer\n");
        return -1;
    } else {
        return 0;
    }
}

static int64_t tellCallback(void * userdata)
{
    return bq_tell((BufferQueue *)userdata);
}

static nestegg_io ioCallbacks = {
	readCallback,
	seekCallback,
	tellCallback,
	NULL
};

/**
 * Safe read of EBML id or data size int64 from a data stream.
 * @returns byte count of the ebml number on success, or 0 on failure
 */
static int read_ebml_int64(BufferQueue *bufferQueue, int64_t *val, int keep_mask_bit)
{
    // Count of initial 0 bits plus first 1 bit encode total number of bytes.
    // Rest of the bits are a big-endian number.
    char first;
    if (bq_read(bufferQueue, &first, 1)) {
        printf("out of bytes at start of field\n");
        return 0;
    }
    if (first == 0) {
        printf("zero field\n");
        return 0;
    }

    int shift = 0;
    while (((unsigned char)first & 0x80) == 0) {
        shift++;
        first = (unsigned char)first << 1;
    }
    int byteCount = shift + 1;

    if (!keep_mask_bit) {
        // id keeps the mask bit, data size strips it
        first = first & 0x7f;
    }
    // Save the top bits from that first byte.
    *val = (unsigned char)first >> shift;
    for (int i = 1; i < byteCount; i++) {
        char next;
        if (bq_read(bufferQueue, &next, 1)) {
            printf("out of bytes in field\n");
            return 0;
        }
        *val = *val << 8 | (unsigned char)next;
    }
    //printf("byteCount %d; val %lld\n", byteCount, *val);
    return byteCount;
}

static int readyForNextPacket()
{
    int64_t pos = bq_tell(bufferQueue);
    int ok = 0;
    
    int64_t id, size;
    int idSize, sizeSize;
    
    idSize = read_ebml_int64(bufferQueue, &id, 1);
    if (idSize) {
        if (id != 0x1c53bb6bLL) {
            // Right now we only care about reading the cues.
            // If used elsewhere, unpack that. ;)
            ok = 1;
        }
        sizeSize = read_ebml_int64(bufferQueue, &size, 0);
        if (sizeSize) {
            if (bq_headroom(bufferQueue) >= size) {
                ok = 1;
            }
        }
    }
    /*
    if (!ok) {
        printf("not ready for packet! %lld/%lld %d %d %llx %lld\n", bq_tell(bufferQueue), bq_headroom(bufferQueue), idSize, sizeSize, id, size);
    } else {
        printf("ready for packet! %lld/%lld %d %d %llx %lld\n", bq_tell(bufferQueue), bq_headroom(bufferQueue), idSize, sizeSize, id, size);
    }
    */
    bq_seek(bufferQueue, pos);
    return ok;
}

static int processBegin() {
	// This will read through headers, hopefully we have enough data
	// or else it may fail and explode.
	// @todo rework all this to faux sync or else full async
	printf("nestegg_init starting...\n");
    ioCallbacks.userdata = (void *)bufferQueue;
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
		// End of stream? Usually means we need more data.
		nestegg_read_reset(demuxContext);
		return 0;
	} else if (ret < 0) {
		// Unknown unrecoverable error
		printf("webm processDecoding: error %d\n", ret);
		return 1;
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

		nestegg_free_packet(packet);
		return 1;
	}
}

static int processSeeking()
{
    bufferQueue->lastSeekTarget = 0;
    int r = nestegg_track_seek(demuxContext, seekTrack, seekTime);
    if (r) {
        if (bufferQueue->lastSeekTarget == 0) {
            // Maybe we just need more data?
            printf("is seeking processing... FAILED at %lld %lld %lld\n", bufferQueue->pos, bq_start(bufferQueue), bq_end(bufferQueue));
        } else {
            // We need to go off and load stuff...
            printf("is seeking processing... MOAR SEEK %lld %lld %lld\n", bufferQueue->lastSeekTarget, bq_start(bufferQueue), bq_end(bufferQueue));
            ogvjs_callback_seek(bufferQueue->lastSeekTarget);
            bufferQueue->pos = bufferQueue->lastSeekTarget;
            bq_flush(bufferQueue);
        }
        return 0;
    } else {
        appState = STATE_DECODING;
        printf("is seeking processing... LOOKS ROLL OVER\n");
        return 1;
    }
}

static void receive_input(const char *buffer, int bufsize) {
    if (bufsize > 0) {
        bq_append(bufferQueue, buffer, bufsize);
    }
}

int ogv_demuxer_process(const char *data, size_t data_len) {
	receive_input(data, data_len);

	if (appState == STATE_BEGIN) {
        if (bq_headroom(bufferQueue) > 256 * 1024) {
            return processBegin();
        } else {
            // need more data
            return 0;
        }
    } else if (appState == STATE_DECODING) {
        while (processDecoding()) {
            // whee!
        }
        return 0;
    } else if (appState == STATE_SEEKING) {
        if (readyForNextPacket()) {
            return processSeeking();
        } else {
            // need more data
            printf("not ready to read the cues\n");
            return 0;
        }
	} else {
		// uhhh...
		printf("Invalid appState in ogv_demuxer_process\n");
        return 0;
	}
}

void ogv_demuxer_destroy() {
	// should probably tear stuff down, eh
    bq_free(bufferQueue);
    bufferQueue = NULL;
}

void ogv_demuxer_flush() {
    bq_flush(bufferQueue);
    // we may not need to handle the packet queue because this only
    // happens after seeking and nestegg handles that internally
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

int ogv_demuxer_seekable()
{
	return nestegg_has_cues(demuxContext);
}

long ogv_demuxer_keypoint_offset(long time_ms)
{
	// can't do with nestegg's API; use ogv_demuxer_seek_to_keypoint instead
	return -1;
}

int ogv_demuxer_seek_to_keypoint(long time_ms)
{
    appState = STATE_SEEKING;
    seekTime = (int64_t)time_ms * 1000000LL;
    if (hasVideo) {
        seekTrack = videoTrack;
    } else if (hasAudio) {
        seekTrack = audioTrack;
    } else {
        return 0;
    }
    processSeeking();
    return 1;
}
