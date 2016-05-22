#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <limits.h>

#include <ogg/ogg.h>
#include <oggz/oggz.h>

#include <skeleton/skeleton.h>

#include "ogv-demuxer.h"


/* Ogg and codec state for demux/decode */
OGGZ *oggz;

long videoStream;
OggzStreamContent videoCodec;
int videoHeadersComplete;
char *videoCodecName = NULL;

long audioStream;
OggzStreamContent audioCodec;
int audioHeadersComplete;
char *audioCodecName = NULL;

long skeletonStream;
OggSkeleton *skeleton;
int skeletonHeadersComplete;

enum AppState {
	STATE_BEGIN,
	STATE_SKELETON,
	STATE_DECODING
} appState;

static int buffersReceived = 0;
static int needData = 1;


static int processSkeleton(oggz_packet *packet, long serialno);
static int processDecoding(oggz_packet *packet, long serialno);

static int processBegin(oggz_packet *packet, long serialno)
{
	int bos = (packet->op.b_o_s != 0);
    //int bos = oggz_get_bos(oggz, serialno);
    //int bos = (packet->op.packetno == 0);
    if (!bos) {
        // Not a bitstream start -- move on to header decoding...
		if (skeletonStream) {
	        appState = STATE_SKELETON;
	        return processSkeleton(packet, serialno);
	    } else {
			appState = STATE_DECODING;
			ogvjs_callback_loaded_metadata(videoCodecName, audioCodecName);
	        return processDecoding(packet, serialno);
		}
    }

    OggzStreamContent content = oggz_stream_get_content(oggz, serialno);

    if (!videoStream && content == OGGZ_CONTENT_THEORA) {
        videoCodec = content;
        videoCodecName = "theora";
        videoStream = serialno;
        ogvjs_callback_video_packet((const char *)packet->op.packet, packet->op.bytes, -1, -1);
        return OGGZ_CONTINUE;
    }

    if (!audioStream && content == OGGZ_CONTENT_VORBIS) {
        audioCodec = content;
        audioCodecName = "vorbis";
        audioStream = serialno;
        ogvjs_callback_audio_packet((const char *)packet->op.packet, packet->op.bytes, -1);
        return OGGZ_CONTINUE;
    }

    if (!audioStream && content == OGGZ_CONTENT_OPUS) {
        audioCodec = content;
        audioCodecName = "opus";
        audioStream = serialno;
        ogvjs_callback_audio_packet((const char *)packet->op.packet, packet->op.bytes, -1);
        return OGGZ_CONTINUE;
    }

    if (!skeletonStream && content == OGGZ_CONTENT_SKELETON) {
        skeletonStream = serialno;

        int ret = oggskel_decode_header(skeleton, &packet->op);
        if (ret == 0) {
            skeletonHeadersComplete = 1;
        } else if (ret > 0) {
            // Just keep going
        } else {
            printf("Invalid ogg skeleton track data? %d\n", ret);
            return OGGZ_STOP_ERR;
        }
    }
    return OGGZ_CONTINUE;
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

    if (skeletonStream == serialno) {
        int ret = oggskel_decode_header(skeleton, &packet->op);
        if (ret < 0) {
            printf("Error processing skeleton packet: %d\n", ret);
            return OGGZ_STOP_ERR;
        }
        if (packet->op.e_o_s) {
            skeletonHeadersComplete = 1;
			appState = STATE_DECODING;
			ogvjs_callback_loaded_metadata(videoCodecName, audioCodecName);
        }
    }

    if (serialno == videoStream) {
    	ogvjs_callback_video_packet((const char *)packet->op.packet, packet->op.bytes, timestamp, keyframeTimestamp);
    }

    if (serialno == audioStream) {
    	ogvjs_callback_audio_packet((const char *)packet->op.packet, packet->op.bytes, timestamp);
    }

	return OGGZ_CONTINUE;
}

static int processDecoding(oggz_packet *packet, long serialno) {
	float timestamp = oggz_tell_units(oggz) / 1000.0;
	float keyframeTimestamp = calc_keyframe_timestamp(packet, serialno);

    if (serialno == videoStream) {
    	ogvjs_callback_video_packet((const char *)packet->op.packet, packet->op.bytes, timestamp, keyframeTimestamp);
    }

    if (serialno == audioStream) {
    	ogvjs_callback_audio_packet((const char *)packet->op.packet, packet->op.bytes, timestamp);
    }

	return OGGZ_CONTINUE;
}

static int readPacketCallback(OGGZ *oggz, oggz_packet *packet, long serialno, void *user_data)
{
	needData = 0;

    switch (appState) {
        case STATE_BEGIN:
            return processBegin(packet, serialno);
        case STATE_SKELETON:
            return processSkeleton(packet, serialno);
        case STATE_DECODING:
            return processDecoding(packet, serialno);
        default:
            printf("Invalid state in Ogg readPacketCallback");
            return OGGZ_STOP_ERR;
    }
}

void ogv_demuxer_init() {
    appState = STATE_BEGIN;
	oggz = oggz_new(OGGZ_READ | OGGZ_AUTO);
	oggz_set_read_callback(oggz, -1, readPacketCallback, NULL);
    skeleton = oggskel_new();
}

int ogv_demuxer_process(char *buffer, int bufsize) {
	needData = 1;

	if (appState == STATE_DECODING) {
		if ((!videoCodec || ogvjs_callback_frame_ready()) &&
			(!audioCodec || ogvjs_callback_audio_ready())) {
			// We've already got data ready!
			needData = 0;
		}
	}

    if (bufsize > 0) {
		buffersReceived = 1;

		int ret = oggz_read_input(oggz, (unsigned char *)buffer, bufsize);
		if (ret < 0) {
			printf("Error %d from oggz_read_input\n", ret);
		} else if (ret < bufsize) {
			printf("Expected to read %d from oggz_read_input but gave %d\n", ret, bufsize);
		}
    }

	return !needData;
}

void ogv_demuxer_destroy() {
	oggskel_destroy(skeleton);
    oggz_close(oggz);
}

/**
 * @return segment length in bytes, or -1 if unknown
 */
long ogv_demuxer_media_length() {
    ogg_int64_t segment_len = -1;
    if (skeletonHeadersComplete) {
        oggskel_get_segment_len(skeleton, &segment_len);
    }
    return (long)segment_len;
}

/**
 * @return segment duration in seconds, or -1 if unknown
 */
float ogv_demuxer_media_duration() {
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

int ogv_demuxer_seekable()
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
        if (videoStream) {
            serial_nos[nstreams++] = videoStream;
        } else if (audioStream) {
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

void ogv_demuxer_flush()
{
	oggz_purge(oggz);

	// Need to "seek" to clear out stored units
	oggz_seek(oggz, 0, SEEK_CUR);
}
