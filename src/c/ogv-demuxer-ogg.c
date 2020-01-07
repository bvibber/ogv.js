#include <assert.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <limits.h>

#include <ogg/ogg.h>
#include <oggz/oggz.h>

#include <skeleton/skeleton.h>

#include "ogv-demuxer.h"
#include "ogv-buffer-queue.h"

// Input buffer queue
static BufferQueue *bufferQueue;

/* Ogg and codec state for demux/decode */
OGGZ *oggz;

int hasVideo = 0;
long videoStream;
OggzStreamContent videoCodec;
int videoHeadersComplete;
char *videoCodecName = NULL;

int hasAudio = 0;
long audioStream;
OggzStreamContent audioCodec;
int audioHeadersComplete;
char *audioCodecName = NULL;

int hasSkeleton = 0;
long skeletonStream;
OggSkeleton *skeleton;
int skeletonHeadersComplete;

enum AppState {
	STATE_BEGIN,
	STATE_SKELETON,
	STATE_DECODING
} appState;

static int processSkeleton(oggz_packet *packet, long serialno);
static int processDecoding(oggz_packet *packet, long serialno);

static int processBegin(oggz_packet *packet, long serialno)
{
	int bos = (packet->op.b_o_s != 0);
    //int bos = oggz_get_bos(oggz, serialno);
    //int bos = (packet->op.packetno == 0);
    if (!bos) {
        // Not a bitstream start -- move on to header decoding...
		if (hasSkeleton) {
	        appState = STATE_SKELETON;
	        return processSkeleton(packet, serialno);
	    } else {
			appState = STATE_DECODING;
			ogvjs_callback_loaded_metadata(videoCodecName, audioCodecName);
	        return processDecoding(packet, serialno);
		}
    }

    OggzStreamContent content = oggz_stream_get_content(oggz, serialno);

    if (!hasVideo && content == OGGZ_CONTENT_THEORA) {
        hasVideo = 1;
        videoCodec = content;
        videoCodecName = "theora";
        videoStream = serialno;
        ogvjs_callback_video_packet((const char *)packet->op.packet, packet->op.bytes, -1, -1, 0);
        return OGGZ_CONTINUE;
    }

    if (!hasAudio && content == OGGZ_CONTENT_VORBIS) {
        hasAudio = 1;
        audioCodec = content;
        audioCodecName = "vorbis";
        audioStream = serialno;
        ogvjs_callback_audio_packet((const char *)packet->op.packet, packet->op.bytes, -1, 0.0);
        return OGGZ_CONTINUE;
    }

    if (!hasAudio && content == OGGZ_CONTENT_OPUS) {
        hasAudio = 1;
        audioCodec = content;
        audioCodecName = "opus";
        audioStream = serialno;
        ogvjs_callback_audio_packet((const char *)packet->op.packet, packet->op.bytes, -1, 0.0);
        return OGGZ_CONTINUE;
    }

    if (!hasSkeleton && content == OGGZ_CONTENT_SKELETON) {
        hasSkeleton = 1;
        skeletonStream = serialno;

        int ret = oggskel_decode_header(skeleton, &packet->op);
        if (ret == 0) {
            skeletonHeadersComplete = 1;
        } else if (ret > 0) {
            // Just keep going
        } else {
            //printf("Invalid ogg skeleton track data? %d\n", ret);
            return OGGZ_STOP_ERR;
        }
    }
    return OGGZ_CONTINUE;
}

static int packet_is_keyframe_theora(oggz_packet *packet)
{
	ogg_int64_t granulepos = oggz_tell_granulepos(oggz);
	int granuleshift = oggz_get_granuleshift(oggz, videoStream);

	ogg_int64_t key_frameno = (granulepos >> granuleshift);
	return (granulepos == (key_frameno << granuleshift));
}

static float calc_keyframe_timestamp(oggz_packet *packet, long serialno)
{
	ogg_int64_t granulepos = oggz_tell_granulepos(oggz);

	int granuleshift = oggz_get_granuleshift(oggz, serialno);

	ogg_int64_t granulerate_n = 0;
	ogg_int64_t granulerate_d = 0;
	oggz_get_granulerate(oggz, serialno, &granulerate_n, &granulerate_d);

	return (float)(granulepos >> granuleshift) * (float)granulerate_d / (float)granulerate_n;
}

static int processSkeleton(oggz_packet *packet, long serialno)
{
	float timestamp = oggz_tell_units(oggz) / 1000.0;
	float keyframeTimestamp = calc_keyframe_timestamp(packet, serialno);

    if (hasSkeleton && skeletonStream == serialno) {
        int ret = oggskel_decode_header(skeleton, &packet->op);
        if (ret < 0) {
            //printf("Error processing skeleton packet: %d\n", ret);
            return OGGZ_STOP_ERR;
        }
        if (packet->op.e_o_s) {
            skeletonHeadersComplete = 1;
			appState = STATE_DECODING;
			ogvjs_callback_loaded_metadata(videoCodecName, audioCodecName);
        }
    }

    if (hasVideo && serialno == videoStream) {
    	ogvjs_callback_video_packet((const char *)packet->op.packet, packet->op.bytes, timestamp, keyframeTimestamp, packet_is_keyframe_theora(packet));
    }

    if (hasAudio && serialno == audioStream) {
    	ogvjs_callback_audio_packet((const char *)packet->op.packet, packet->op.bytes, timestamp, 0.0);
    }

	return OGGZ_CONTINUE;
}

static int processDecoding(oggz_packet *packet, long serialno) {
	float timestamp = oggz_tell_units(oggz) / 1000.0;
	float keyframeTimestamp = calc_keyframe_timestamp(packet, serialno);

    if (hasVideo && serialno == videoStream) {
			if (packet->op.bytes > 0) {
				// Skip 0-byte Theora packets, they're dupe frames.
				ogvjs_callback_video_packet((const char *)packet->op.packet, packet->op.bytes, timestamp, keyframeTimestamp, packet_is_keyframe_theora(packet));
				return OGGZ_STOP_OK;
			}
    }

    if (hasAudio && serialno == audioStream) {
    	ogvjs_callback_audio_packet((const char *)packet->op.packet, packet->op.bytes, timestamp, 0.0);
		return OGGZ_STOP_OK;
    }

	return OGGZ_CONTINUE;
}

static int readPacketCallback(OGGZ *oggz, oggz_packet *packet, long serialno, void *user_data)
{
    switch (appState) {
        case STATE_BEGIN:
            return processBegin(packet, serialno);
        case STATE_SKELETON:
            return processSkeleton(packet, serialno);
        case STATE_DECODING:
            return processDecoding(packet, serialno);
        default:
            //printf("Invalid state in Ogg readPacketCallback");
            return OGGZ_STOP_ERR;
    }
}

static size_t readCallback(void *user_handle, void *buf, size_t n)
{
	BufferQueue *bq = (BufferQueue *)user_handle;
	size_t available = bq_headroom(bq);
	size_t to_read;
	if (n < available) {
		to_read = n;
	} else {
		to_read = available;
	}
	int ret = bq_read(bq, buf, to_read);
	if (ret < 0) {
		return -1;
	} else {
		return to_read;
	}
}

static int seekCallback(void *user_handle, long offset, int whence)
{
	BufferQueue *bq = (BufferQueue *)user_handle;
	int64_t pos;
	switch (whence) {
		case SEEK_SET:
			pos = offset;
			break;
		case SEEK_CUR:
			pos = bq_tell(bq) + offset;
			break;
		case SEEK_END: // not implemented
		default:
			return -1;
	}
	if (bq_seek(bq, pos)) {
		//printf("Buffer seek failure in ogg demuxer; %lld (%ld %d)\n", pos, offset, whence);
		return -1;
	} else {
		return (long)pos;
	}
}

static long tellCallback(void *user_handle)
{
	BufferQueue *bq = (BufferQueue *)user_handle;
	return (long)bq_tell(bq);
}

void ogv_demuxer_init(void) {
    appState = STATE_BEGIN;
	bufferQueue = bq_init();
	oggz = oggz_new(OGGZ_READ | OGGZ_AUTO);
	oggz_set_read_callback(oggz, -1, readPacketCallback, NULL);
	oggz_io_set_read(oggz, readCallback, bufferQueue);
	oggz_io_set_seek(oggz, seekCallback, bufferQueue);
	oggz_io_set_tell(oggz, tellCallback, bufferQueue);
    skeleton = oggskel_new();
}

void ogv_demuxer_receive_input(char *buffer, int bufsize) {
	bq_append(bufferQueue, buffer, bufsize);
}

int ogv_demuxer_process(void) {
	do {
		// read at most this many bytes in one go
		// should be enough to resync ogg stream
		int64_t headroom = bq_headroom(bufferQueue);
		size_t bufsize = 65536;
		if (headroom < bufsize) {
			bufsize = headroom;
		}

		int ret = oggz_read(oggz, bufsize);
		//printf("demuxer returned %d on %d bytes\n", ret, bufsize);
		if (ret == OGGZ_ERR_STOP_OK) {
			// We got a packet!
			return 1;
		} else if (ret > 0) {
			// We read some data, but no packets yet.
			//printf("read %d bytes\n", ret);
			continue;
		} else if (ret == 0) {
			//printf("EOF %d from oggz_read\n", ret);
			return 0;
		} else if (ret < 0) {
			//printf("Error %d from oggz_read\n", ret);
			return 0;
		}
	} while(1);

	return 0;
}

void ogv_demuxer_destroy(void) {
	oggskel_destroy(skeleton);
    oggz_close(oggz);
	bq_free(bufferQueue);
	bufferQueue = NULL;
}

/**
 * @return segment length in bytes, or -1 if unknown
 */
long ogv_demuxer_media_length(void) {
    ogg_int64_t segment_len = -1;
    if (skeletonHeadersComplete) {
        oggskel_get_segment_len(skeleton, &segment_len);
    }
    return (long)segment_len;
}

/**
 * @return segment duration in seconds, or -1 if unknown
 */
float ogv_demuxer_media_duration(void) {
    if (skeletonHeadersComplete) {
        ogg_uint16_t ver_maj = -1, ver_min = -1;
        oggskel_get_ver_maj(skeleton, &ver_maj);
        oggskel_get_ver_min(skeleton, &ver_min);
    
        ogg_int32_t serial_nos[2];
        size_t nstreams = 0;
        if (videoStream) {
            serial_nos[nstreams++] = videoStream;
        }
        if (audioStream) {
            serial_nos[nstreams++] = audioStream;
        }
        
        double firstSample = -1,
               lastSample = -1;
        for (int i = 0; i < nstreams; i++) {
            ogg_int64_t first_sample_num = -1,
                        first_sample_denum = -1,
                        last_sample_num = -1,
                        last_sample_denum = -1;

            oggskel_get_first_sample_num(skeleton, serial_nos[i], &first_sample_num);
            oggskel_get_first_sample_denum(skeleton, serial_nos[i], &first_sample_denum);
            oggskel_get_last_sample_num(skeleton, serial_nos[i], &last_sample_num);
            oggskel_get_last_sample_denum(skeleton, serial_nos[i], &last_sample_denum);
            
            double firstStreamSample = (double)first_sample_num / (double)first_sample_denum;
            if (firstSample == -1 || firstStreamSample < firstSample) {
                firstSample = firstStreamSample;
            }
            
            double lastStreamSample = (double)last_sample_num / (double)last_sample_denum;
            if (lastSample == -1 || lastStreamSample > lastSample) {
                lastSample = lastStreamSample;
            }
        }
        
        return lastSample - firstSample;
    }
    return -1;
}

int ogv_demuxer_seekable(void)
{
	// even if we don't have the skeleton tracks, we allow bisection
	return 1;
}

long ogv_demuxer_keypoint_offset(long time_ms)
{
    ogg_int64_t offset = -1;
    if (skeletonHeadersComplete) {
        ogg_int32_t serial_nos[2];
        size_t nstreams = 0;
        if (hasVideo) {
            serial_nos[nstreams++] = videoStream;
        } else if (hasAudio) {
			serial_nos[nstreams++] = audioStream;
		}
        oggskel_get_keypoint_offset(skeleton, serial_nos, nstreams, time_ms, &offset);
    }
    return (long)offset;
}

int ogv_demuxer_seek_to_keypoint(long time_ms)
{
	return 0;
}

void ogv_demuxer_flush(void)
{
	oggz_purge(oggz);

	// Need to "seek" to clear out stored units
	int ret = oggz_seek(oggz, 0, SEEK_CUR);
	if (ret < 0) {
		//printf("Failed to 'seek' oggz %d\n", ret);
	}

	bq_flush(bufferQueue);
}
