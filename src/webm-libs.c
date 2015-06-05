#include "codecjs.h"

#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <limits.h>

#include <ogg/ogg.h>

#include <vorbis/codec.h>

#ifdef OPUS
#include <opus/opus_multistream.h>
#include "opus_header.h"
#include "opus_helper.h"
#endif

/* never forget that globals are a one-way ticket to Hell */
/* Ogg and codec state for demux/decode */
ogg_packet        audioPacket;

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

int               crop = 0;
int               gotSigint = 0;

static void sigint_handler(int signal) {
    gotSigint = 1;
}

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

static void processBegin() {
    if (0) {
        printf("Packet is at start of a bitstream\n");
        /* identify the codec */
        // todo: initialize audioPacket
        if (processAudio && !vorbisHeaders && (vorbisProcessingHeaders = vorbis_synthesis_headerin(&vorbisInfo, &vorbisComment, &audioPacket)) == 0) {
            // it's vorbis! save this as our audio stream...
            vorbisHeaders = 1;

            // ditch the processed packet...
#ifdef OPUS
        } else if (processAudio && !opusHeaders && (opusDecoder = opus_process_header(&audioPacket, &opusMappingFamily, &opusChannels, &opusPreskip, &opusGain, &opusStreams)) != NULL) {
            printf("found Opus stream! (first of two headers)\n");
            if (opusGain) {
                opus_multistream_decoder_ctl(opusDecoder, OPUS_SET_GAIN(opusGain));
            }
            opusPrevPacketGranpos = 0;
            opusHeaders = 1;

            // ditch the processed packet...
#endif
        } else {
            printf("already have stream, or not theora or vorbis or opus packet\n");
            /* whatever it is, we don't care about it */
        }
    } else {
        printf("Moving on to header decoding...\n");
        // Not a bitstream start -- move on to header decoding...
        appState = STATE_HEADERS;
        //processHeaders();
    }
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
    if (!audiobufReady) {
#ifdef OPUS
        if (opusHeaders) {
            if (1) { //ogg_stream_packetpeek(&opusStreamState, &audioPacket) > 0) {
                audiobufReady = 1;
                if (audioPacket.granulepos == -1) {
                	// we can't update the granulepos yet
                } else {
	                audiobufGranulepos = audioPacket.granulepos;
    	            audiobufTime = (double)audiobufGranulepos / audioSampleRate;
    	        }
                codecjs_callback_audio_ready(audiobufTime);
            } else {
                needData = 1;
            }
        } else
#endif
        if (vorbisHeaders) {
            if (1) { //ogg_stream_packetpeek(&vorbisStreamState, &audioPacket) > 0) {
                audiobufReady = 1;
                if (audioPacket.granulepos == -1) {
                	// we can't update the granulepos yet
                } else {
	                audiobufGranulepos = audioPacket.granulepos;
    	            audiobufTime = vorbis_granule_time(&vorbisDspState, audiobufGranulepos);
        	    }
				codecjs_callback_audio_ready(audiobufTime);
            } else {
                needData = 1;
            }
        }
    }
}

int codecjs_decode_frame() {
}

int codecjs_decode_audio() {
    int packetRet = 0;
    audiobufReady = 0;
    int foundSome = 0;

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
		// @todo
    }
}

int codecjs_process() {
	if (!buffersReceived) {
		return 0;
	}
	if (needData) {
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
    if (appState == STATE_BEGIN) {
        processBegin();
    } else if (appState == STATE_HEADERS) {
        processHeaders();
    } else if (appState == STATE_DECODING) {
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
	return -1;
}

/**
 * @return segment duration in seconds, or -1 if unknown
 */
float codecjs_media_duration() {
    return -1;
}

long codecjs_keypoint_offset(long time_ms)
{
	return -1;
}
