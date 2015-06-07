#include "codecjs.h"

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

#define VPX_CODEC_DISABLE_COMPAT 1
#include <vpx/vpx_decoder.h>
#include <vpx/vp8dx.h>

#include <ogg/ogg.h>

#include <vorbis/codec.h>

#ifdef OPUS
#include <opus/opus_multistream.h>
#include "opus_header.h"
#include "opus_helper.h"
#endif

#define PACKET_QUEUE_MAX 64

/* never forget that globals are a one-way ticket to Hell */

static nestegg        *demuxContext;
static char           *bufferQueue = NULL;
static size_t          bufferSize = 0;

static bool            hasVideo = false;
static unsigned int    videoTrack = 0;
static int             videoCodec = -1;
static unsigned int    videoPacketCount = 0;
static nestegg_packet *videoPackets[PACKET_QUEUE_MAX];

static bool            hasAudio = false;
static unsigned int    audioTrack = 0;
static int             audioCodec = -1;
static unsigned int    audioPacketCount = 0;
static nestegg_packet *audioPackets[PACKET_QUEUE_MAX];

/* Ogg and codec state for demux/decode */
ogg_packet        audioPacket;

static vpx_codec_ctx_t    vpxContext;
static vpx_codec_iface_t *vpxDecoder;


/* single frame video buffering */
int               videobufReady = 0;
ogg_int64_t       videobufGranulepos = -1;  // @todo reset with TH_CTL_whatver on seek
double            videobufTime = -1;         // time seen on actual decoded frame
ogg_int64_t       keyframeGranulepos = -1;  //
double            keyframeTime = -1;        // last-keyframe time seen on actual decoded frame

int               audiobufReady = 0;
ogg_int64_t       audiobufGranulepos = -1; /* time position of last sample */
double            audiobufTime = -1;
double            audioSampleRate = 0;

/* Audio decode state */
int               vorbisHeaders = 0;
int               vorbisProcessingHeaders;
vorbis_info       vorbisInfo;
vorbis_dsp_state  vorbisDspState;
vorbis_block      vorbisBlock;
vorbis_comment    vorbisComment;

#ifdef OPUS
int               opusHeaders = 0;
OpusMSDecoder    *opusDecoder = NULL;
int               opusMappingFamily;
int               opusChannels;
int               opusPreskip;
ogg_int64_t       opusPrevPacketGranpos;
float             opusGain;
int               opusStreams;
/* 120ms at 48000 */
#define OPUS_MAX_FRAME_SIZE (960*6)
#endif

int               processAudio;
int               processVideo;

enum AppState {
    STATE_BEGIN,
    STATE_HEADERS,
    STATE_DECODING
} appState;

void codecjs_init(int process_audio_flag, int process_video_flag) {
    // Allow the caller to specify whether we want audio, video, or both.
    // Or neither, but that won't be very useful.
    processAudio = process_audio_flag;
    processVideo = process_video_flag;

    appState = STATE_BEGIN;

    /* init supporting Vorbis structures needed in header parsing */
    vorbis_info_init(&vorbisInfo);
    vorbis_comment_init(&vorbisComment);
}

static int needData = 1;

static void logCallback(nestegg *context, unsigned int severity, char const * format, ...)
{
	va_list args;
	va_start(args, format);
	vprintf(format, args);
	va_end(args);
}

static int readCallback(void * buffer, size_t length, void *userdata)
{
	if (length > bufferSize) {
		// @todo rework to use asyncify
		return -1;
	}
	
	// return the first bytes...
	memcpy(buffer, bufferQueue, length);
	
	// and save the rest...
	bufferSize -= length;
	memcpy(bufferQueue, bufferQueue + length, bufferSize);
	bufferQueue = realloc(bufferQueue, bufferSize);
	
	return 0;
}

static int seekCallback(int64_t offset, int whence, void * userdata)
{
	// @todo rework to use asyncify
	return -1;
}

static int64_t tellCallback(void * userdata)
{
	// @todo rework to use asyncify
	return -1;
}

static nestegg_io ioCallbacks = {
	readCallback,
	seekCallback,
	tellCallback,
	NULL
};

static void processBegin() {
	// This will read through headers, hopefully we have enough data
	// or else it may fail and explode.
	// @todo rework all this to faux sync or else full async
	printf("nestegg_init starting...\n");
	if (nestegg_init(&demuxContext, ioCallbacks, logCallback, -1) < 0) {
		printf("nestegg_init failed\n");
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
			if (codec == NESTEGG_CODEC_VP8 || codec == NESTEGG_CODEC_VP9) {
				hasVideo = 1;
				videoTrack = track;
				videoCodec = codec;
			}
		}
		
		if (trackType == NESTEGG_TRACK_AUDIO && !hasAudio) {
			if (codec == NESTEGG_CODEC_VORBIS || codec == NESTEGG_CODEC_OPUS) {
				hasAudio = 1;
				audioTrack = track;
				audioCodec = codec;
			}
		}
	}

	// @fixme figure out this initialization stuff
	
	if (hasAudio && audioCodec == NESTEGG_CODEC_VORBIS) {
        // todo: initialize audioPacket
        if ((vorbisProcessingHeaders = vorbis_synthesis_headerin(&vorbisInfo, &vorbisComment, &audioPacket)) == 0) {
            // it's vorbis! save this as our audio stream...
            vorbisHeaders = 1;

            // ditch the processed packet...
        }
    }
#ifdef OPUS
    if (hasAudio && audioCodec == NESTEGG_CODEC_OPUS) {
    	// todo: initialize audioPacket
        if ((opusDecoder = opus_process_header(&audioPacket, &opusMappingFamily, &opusChannels, &opusPreskip, &opusGain, &opusStreams)) != NULL) {
            printf("found Opus stream! (first of two headers)\n");
            if (opusGain) {
                opus_multistream_decoder_ctl(opusDecoder, OPUS_SET_GAIN(opusGain));
            }
            opusPrevPacketGranpos = 0;
            opusHeaders = 1;

            // ditch the processed packet...
        }
    }
#endif

	//printf("Moving on to header decoding...\n");
	//appState = STATE_HEADERS;

	
	// @todo kill this callback and replace it with a state check?
	codecjs_callback_loaded_metadata();

	if (hasVideo) {
		nestegg_video_params videoParams;
		if (nestegg_track_video_params(demuxContext, videoTrack, &videoParams) < 0) {
			// failed! something is wrong...
			hasVideo = 0;
		} else {
			if (videoCodec == NESTEGG_CODEC_VP8) {
				vpxDecoder = vpx_codec_vp8_dx();
			} else if (videoCodec == NESTEGG_CODEC_VP9) {
				vpxDecoder = vpx_codec_vp9_dx();
			}
			vpx_codec_dec_init(&vpxContext, vpxDecoder, NULL, 0);
			
			codecjs_callback_init_video(videoParams.width, videoParams.height,
			                            1, 1, // @todo assuming 4:2:0
			                            30.0, // @todo get fps
			                            videoParams.display_width, videoParams.display_height,
                                        videoParams.crop_left, videoParams.crop_right,
                                        1, 1); // @todo get pixel aspect ratio
			
		}
	}
	
	if (hasAudio) {
		nestegg_audio_params audioParams;
		if (nestegg_track_audio_params(demuxContext, audioTrack, &audioParams) < 0) {
			// failed! something is wrong
			hasAudio = 0;
		} else {
			codecjs_callback_init_audio(audioParams.channels, (int)audioParams.rate);
		}
	}

	// @fixme still need those headers for audio!
	appState = STATE_DECODING;
	printf("Done with headers step\n");
	codecjs_callback_loaded_metadata();
}

static void processHeaders() {

    if ((vorbisHeaders && vorbisHeaders < 3)
#ifdef OPUS
        || (opusHeaders && opusHeaders < 2)
#endif
    ) {
        int ret;

        if (vorbisHeaders && (vorbisHeaders < 3)) {
            printf("checking vorbis headers...\n");

            // -> audioPacket
            if (ret < 0) {
                printf("Error reading vorbis headers: %d.\n", ret);
                exit(1);
            }
            if (ret > 0) {
                printf("Checking another vorbis header packet...\n");
                vorbisProcessingHeaders = vorbis_synthesis_headerin(&vorbisInfo, &vorbisComment, &audioPacket);
                if (vorbisProcessingHeaders == 0) {
                    printf("Completed another vorbis header (of 3 total)...\n");
                    vorbisHeaders++;
                } else {
                    printf("Invalid vorbis header?\n");
                    exit(1);
                }
            }
            if (ret == 0) {
                printf("No vorbis header packet...\n");
            }
        }
#ifdef OPUS
        if (opusHeaders && (opusHeaders < 2)) {
            printf("checking for opus headers...\n");

            ret = ogg_stream_packetpeek(&opusStreamState, &audioPacket);
            if (ret < 0) {
                printf("Error reading Opus headers: %d.\n", ret);
                exit(1);
            }
            // FIXME: perhaps actually *check* if this is a comment packet ;-)
            opusHeaders++;
            printf("discarding Opus comments...\n");
            ogg_stream_packetout(&opusStreamState, NULL);
        }
#endif

    } else {
        /* and now we have it all.  initialize decoders */

#ifdef OPUS
        // If we have both Vorbis and Opus, prefer Opus
        if (opusHeaders) {
            // opusDecoder should already be initialized
            // Opus has a fixed internal sampling rate of 48000 Hz
            audioSampleRate = 48000;
            codecjs_callback_init_audio(opusChannels, audioSampleRate);
        } else
#endif
        if (vorbisHeaders) {
            vorbis_synthesis_init(&vorbisDspState, &vorbisInfo);
            vorbis_block_init(&vorbisDspState, &vorbisBlock);
            //printf("Ogg logical stream %lx is Vorbis %d channel %ld Hz audio.\n",
            //        vorbisStreamState.serialno, vorbisInfo.channels, vorbisInfo.rate);

			audioSampleRate = vorbisInfo.rate;
            codecjs_callback_init_audio(vorbisInfo.channels, audioSampleRate);
        }

        appState = STATE_DECODING;
        printf("Done with headers step\n");
        codecjs_callback_loaded_metadata();
    }
}

static void processDecoding() {
	needData = 0;

	if (hasVideo && !videobufReady) {
		if (videoPacketCount) {
			// @fixme implement or kill the buffer/keyframe times
			codecjs_callback_frame_ready(videobufTime, keyframeTime);
		} else {
			needData = 1;
		}
	}
	
	if (hasAudio && !audiobufReady) {
		if (audioPacketCount) {
			// @fixme implement or kill the buffer times
			codecjs_callback_audio_ready(audiobufTime);
		} else {
			needData = 1;
		}
	}
}

static nestegg_packet *packet_queue_shift(nestegg_packet **queue, unsigned int *count)
{
	if (count > 0) {
		nestegg_packet *first = queue[0];
		memcpy(&(queue[0]), &(queue[1]), sizeof(nestegg_packet *) * (*count - 1));
		(*count)--;
		return first;
	} else {
		return NULL;
	}
}

int codecjs_decode_frame() {
	nestegg_packet *packet = packet_queue_shift(videoPackets, &videoPacketCount);
	
	if (packet) {
		unsigned int chunks;
		nestegg_packet_count(packet, &chunks);
		
		// uh, can this happen? curiouser :D
		for (unsigned int chunk = 0; chunk < chunks; ++chunk) {
			unsigned char *data;
			size_t data_size;
			nestegg_packet_data(packet, chunk, &data, &data_size);
			
			vpx_codec_decode(&vpxContext, data, data_size, NULL, 1);
			// @todo check return value
		}
		// last chunk!
		vpx_codec_decode(&vpxContext, NULL, 0, NULL, 1);

		vpx_codec_iter_t iter = NULL;
		vpx_image_t *image = NULL;
		bool foundImage = false;
		while ((image = vpx_codec_get_frame(&vpxContext, &iter))) {
			// is it possible to get more than one at a time? ugh
			// @fixme can we have multiples really? how does this worky
			if (foundImage) {
				// skip for now
				continue;
			}
			foundImage = true;
			codecjs_callback_frame(image->planes[0], image->stride[0],
								   image->planes[1], image->stride[1],
								   image->planes[2], image->stride[2],
								   image->w, image->h,
								   1, 1, // @todo pixel format
								   0, 0);
			// @fixme timestamps?!!!
		}
		
		nestegg_free_packet(packet);
		return 1; // ??
	}
	
	return 0;
}

int codecjs_decode_audio() {
    int packetRet = 0;
    audiobufReady = 0;
    int foundSome = 0;

	// @todo implement using the nestegg packet
#ifdef OPUS
    if (opusHeaders) {
        if (ogg_stream_packetout(&opusStreamState, &audioPacket) > 0) {
            float *output = malloc(sizeof (float)*OPUS_MAX_FRAME_SIZE * opusChannels);
            int sampleCount = opus_multistream_decode_float(opusDecoder, (unsigned char*) audioPacket.packet, audioPacket.bytes, output, OPUS_MAX_FRAME_SIZE, 0);
            if (sampleCount < 0) {
                printf("Opus decoding error, code %d\n", sampleCount);
            } else {
                int skip = opusPreskip;
                if (audioPacket.granulepos != -1) {
                    if (audioPacket.granulepos <= opusPrevPacketGranpos) {
                        sampleCount = 0;
                    } else {
                        ogg_int64_t endSample = opusPrevPacketGranpos + sampleCount;
                        if (audioPacket.granulepos < endSample) {
                            sampleCount = (int) (endSample - audioPacket.granulepos);
                        }
                    }
                    opusPrevPacketGranpos = audioPacket.granulepos;
                } else {
                    opusPrevPacketGranpos += sampleCount;
                }
                if (skip >= sampleCount) {
                    skip = sampleCount;
                } else {
                    foundSome = 1;
                    // reorder Opus' interleaved samples into two-dimensional [channel][sample] form
                    float *pcm = malloc(sizeof (*pcm)*(sampleCount - skip) * opusChannels);
                    float **pcmp = malloc(sizeof (*pcmp) * opusChannels);
                    for (int c = 0; c < opusChannels; ++c) {
                        pcmp[c] = pcm + c * (sampleCount - skip);
                        for (int s = skip; s < sampleCount; ++s) {
                            pcmp[c][s - skip] = output[s * opusChannels + c];
                        }
                    }
                    if (audiobufGranulepos != -1) {
						// keep track of how much time we've decodec
	                    audiobufGranulepos += (sampleCount - skip);
	                    audiobufTime = (double)audiobufGranulepos / audioSampleRate;
	                }
                    codecjs_callback_audio(pcmp, opusChannels, sampleCount - skip);
                    free(pcmp);
                    free(pcm);
                }
                opusPreskip -= skip;
            }
            free(output);
        }
    } else
#endif
    if (vorbisHeaders) {
        if (1) { //ogg_stream_packetout(&vorbisStreamState, &audioPacket) > 0) {
            int ret = vorbis_synthesis(&vorbisBlock, &audioPacket);
            if (ret == 0) {
                foundSome = 1;
                vorbis_synthesis_blockin(&vorbisDspState, &vorbisBlock);

                float **pcm;
                int sampleCount = vorbis_synthesis_pcmout(&vorbisDspState, &pcm);
				if (audiobufGranulepos != -1) {
					// keep track of how much time we've decodec
					audiobufGranulepos += sampleCount;
					audiobufTime = vorbis_granule_time(&vorbisDspState, audiobufGranulepos);
				}
                codecjs_callback_audio(pcm, vorbisInfo.channels, sampleCount);

                vorbis_synthesis_read(&vorbisDspState, sampleCount);
            } else {
                printf("Vorbis decoder failed mysteriously? %d", ret);
            }
        }
    }

    return foundSome;
}

static int buffersReceived = 0;

void codecjs_receive_input(char *buffer, int bufsize) {
    if (bufsize > 0) {
		buffersReceived = 1;

		// stuff received data on end of an input queue
		// which will be drained by the sync io callback
		
		// @fixme this is hella inefficient i bet
		bufferQueue = realloc(bufferQueue, bufferSize + bufsize);
		memcpy(bufferQueue + bufferSize, buffer, bufsize);
		bufferSize += bufsize;
    }
}

int codecjs_process() {
	if (!buffersReceived) {
		return 0;
	}
    if (appState == STATE_BEGIN) {
        processBegin();
    //} else if (appState == STATE_HEADERS) {
    //    processHeaders();
    } else if (appState == STATE_DECODING) {
		if (needData) {
			// Do the nestegg_read_packet dance until it fails to read more data,
			// at which point we ask for more. Hope it doesn't explode.
			nestegg_packet *packet = NULL;
			int ret = nestegg_read_packet(demuxContext, &packet);
			if (ret == 0) {
				// end of stream?
				return 0;
			} else if (ret > 0) {
				unsigned int track;
				nestegg_packet_track(packet, &track);

				if (hasVideo && track == videoTrack) {
					if (videoPacketCount >= PACKET_QUEUE_MAX) {
						// that's not good
					}
					videoPackets[videoPacketCount++] = packet;
				} else if (hasAudio && track == audioTrack) {
					if (audioPacketCount >= PACKET_QUEUE_MAX) {
						// that's not good
					}
					audioPackets[audioPacketCount++] = packet;
				} else {
					// throw away unknown packets
					nestegg_free_packet(packet);
				}
			}
			/*
			int ret = ogg_sync_pageout(&oggSyncState, &oggPage);
			if (ret > 0) {
				// complete page retrieved
				queue_page(&oggPage);
			} else if (ret < 0) {
				// incomplete sync
				// continue on the next loop
				return 1;
			} else {
				// need moar data
				return 0;
			}
			*/
		}
        processDecoding();
    } else {
    	// uhhh...
    	printf("Invalid appState in codecjs_process\n");
	}
	return 1;
}

void codecjs_destroy() {
    if (vorbisHeaders) {
        //ogg_stream_clear(&vorbisStreamState);
        vorbis_info_clear(&vorbisInfo);
        vorbis_dsp_clear(&vorbisDspState);
        vorbis_block_clear(&vorbisBlock);
        vorbis_comment_clear(&vorbisComment);
    }

#ifdef OPUS
    if (opusHeaders) {
        opus_multistream_decoder_destroy(opusDecoder);
    }
#endif

#ifdef SKELETON
    if (skeletonHeaders) {
        ogg_stream_clear(&skeletonStreamState);
        oggskel_destroy(skeleton);
    }
#endif
}

void codecjs_flush_buffers() {
	// First, read out anything left in our input buffer
	
	// Then, dump all packets from the streams

	// And reset sync state for good measure.
	videobufReady = 0;
	audiobufReady = 0;
	keyframeGranulepos = -1;
	keyframeTime = -1;
	audiobufGranulepos = -1;
	audiobufTime = -1;
	
	needData = 1;
}

void codecjs_discard_frame()
{
	if (videobufReady) {
		videobufReady = 0;
	}
}

void codecjs_discard_audio()
{
	if (audiobufReady) {
		if (vorbisHeaders) {
			//ogg_stream_packetout(&vorbisStreamState, &audioPacket);
		}
#ifdef OPUS
		if (opusHeaders) {
			//ogg_stream_packetout(&opusStreamState, &audioPacket);
		}
#endif
		audiobufReady = 0;
	}
}

/**
 * @return segment length in bytes, or -1 if unknown
 */
long codecjs_media_length() {
	// @todo check if this is needed? maybe an ogg-specific thing
	return -1;
}

/**
 * @return segment duration in seconds, or -1 if unknown
 */
float codecjs_media_duration() {
	uint64_t duration_ns;
    if (nestegg_duration(demuxContext, &duration_ns) < 0) {
    	return -1;
    } else {
	    return duration_ns / 1000000000.0;
	}
}

long codecjs_keypoint_offset(long time_ms)
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
