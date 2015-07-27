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

#include <theora/theoradec.h>

#ifdef OPUS
#include <opus/opus_multistream.h>
#include "opus_header.h"
#include "opus_helper.h"
#endif

#ifdef SKELETON
#include <skeleton/skeleton.h>
#endif

/* never forget that globals are a one-way ticket to Hell */
/* Ogg and codec state for demux/decode */
ogg_sync_state    oggSyncState;
ogg_page          oggPage;
ogg_packet        oggPacket;
ogg_packet        audioPacket;
ogg_packet        videoPacket;

/* Video decode state */
ogg_stream_state  theoraStreamState;
th_info           theoraInfo;
th_comment        theoraComment;
th_setup_info    *theoraSetupInfo;
th_dec_ctx       *theoraDecoderContext;

int               theoraHeaders = 0;
int               theoraProcessingHeaders;
int               frames = 0;

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
ogg_stream_state  vorbisStreamState;
vorbis_info       vorbisInfo;
vorbis_dsp_state  vorbisDspState;
vorbis_block      vorbisBlock;
vorbis_comment    vorbisComment;

#ifdef OPUS
int               opusHeaders = 0;
ogg_stream_state  opusStreamState;
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

#ifdef SKELETON
OggSkeleton      *skeleton = NULL;
ogg_stream_state  skeletonStreamState;
int               skeletonHeaders = 0;
int               skeletonProcessingHeaders = 0;
int               skeletonDone = 0;
#endif

enum AppState {
    STATE_BEGIN,
    STATE_HEADERS,
    STATE_DECODING
} appState;

/*Write out the planar YUV frame, uncropped.*/
static void video_write(void) {
    th_ycbcr_buffer ycbcr;
    th_decode_ycbcr_out(theoraDecoderContext, ycbcr);

    int hdec = !(theoraInfo.pixel_fmt & 1);
    int vdec = !(theoraInfo.pixel_fmt & 2);

    codecjs_callback_frame(ycbcr[0].data, ycbcr[0].stride,
                           ycbcr[1].data, ycbcr[1].stride,
                           ycbcr[2].data, ycbcr[2].stride,
                           theoraInfo.frame_width, theoraInfo.frame_height,
                           hdec, vdec,
                           videobufTime, keyframeTime);
}

/* helper: push a page into the appropriate steam */
/* this can be done blindly; a stream won't accept a page
                that doesn't belong to it */
static int queue_page(ogg_page *page) {
    if (theoraHeaders) ogg_stream_pagein(&theoraStreamState, page);
    if (vorbisHeaders) ogg_stream_pagein(&vorbisStreamState, page);
#ifdef OPUS
    if (opusHeaders) ogg_stream_pagein(&opusStreamState, page);
#endif
#ifdef SKELETON
    if (skeletonHeaders) ogg_stream_pagein(&skeletonStreamState, page);
#endif
    return 0;
}

void codecjs_init() {
    appState = STATE_BEGIN;

    /* start up Ogg stream synchronization layer */
    ogg_sync_init(&oggSyncState);

    /* init supporting Vorbis structures needed in header parsing */
    vorbis_info_init(&vorbisInfo);
    vorbis_comment_init(&vorbisComment);

    /* init supporting Theora structures needed in header parsing */
    th_comment_init(&theoraComment);
    th_info_init(&theoraInfo);

#ifdef SKELETON
    skeleton = oggskel_new();
#endif
}

static int needData = 1;

static void processBegin() {
    if (ogg_page_bos(&oggPage)) {
        int got_packet;

        // Initialize a stream state object...
        ogg_stream_state test;
        ogg_stream_init(&test, ogg_page_serialno(&oggPage));
        ogg_stream_pagein(&test, &oggPage);

        // Peek at the next packet, since th_decode_headerin() will otherwise
        // eat the first Theora video packet...
        got_packet = ogg_stream_packetpeek(&test, &oggPacket);
        if (!got_packet) {
            return;
        }

        /* identify the codec: try theora */
        if (!theoraHeaders && (theoraProcessingHeaders = th_decode_headerin(&theoraInfo, &theoraComment, &theoraSetupInfo, &oggPacket)) >= 0) {
            /* it is theora -- save this stream state */
            memcpy(&theoraStreamState, &test, sizeof (test));
            theoraHeaders = 1;

            if (theoraProcessingHeaders == 0) {
                /// Saving first video packet for later!
            } else {
                ogg_stream_packetout(&theoraStreamState, NULL);
            }
        } else if (!vorbisHeaders && (vorbisProcessingHeaders = vorbis_synthesis_headerin(&vorbisInfo, &vorbisComment, &oggPacket)) == 0) {
            // it's vorbis! save this as our audio stream...
            memcpy(&vorbisStreamState, &test, sizeof (test));
            vorbisHeaders = 1;

            // ditch the processed packet...
            ogg_stream_packetout(&vorbisStreamState, NULL);
#ifdef OPUS
        } else if (!opusHeaders && (opusDecoder = opus_process_header(&oggPacket, &opusMappingFamily, &opusChannels, &opusPreskip, &opusGain, &opusStreams)) != NULL) {
            // found Opus stream! (first of two headers)
            memcpy(&opusStreamState, &test, sizeof (test));
            if (opusGain) {
                opus_multistream_decoder_ctl(opusDecoder, OPUS_SET_GAIN(opusGain));
            }
            opusPrevPacketGranpos = 0;
            opusHeaders = 1;

            // ditch the processed packet...
            ogg_stream_packetout(&opusStreamState, NULL);
#endif
#ifdef SKELETON
        } else if (!skeletonHeaders && (skeletonProcessingHeaders = oggskel_decode_header(skeleton, &oggPacket)) >= 0) {
            memcpy(&skeletonStreamState, &test, sizeof (test));
            skeletonHeaders = 1;
            skeletonDone = 0;

            // ditch the processed packet...
            ogg_stream_packetout(&skeletonStreamState, NULL);
#endif
        } else {
            /* whatever it is, we don't care about it */
            ogg_stream_clear(&test);
        }
    } else {
        // Not a bitstream start -- move on to header decoding...
        appState = STATE_HEADERS;
        //processHeaders();
    }
}

static void processHeaders() {

    if ((theoraHeaders && theoraProcessingHeaders)
        || (vorbisHeaders && vorbisHeaders < 3)
#ifdef OPUS
        || (opusHeaders && opusHeaders < 2)
#endif
#ifdef SKELETON
        || (skeletonHeaders && !skeletonDone)
#endif
    ) {
        int ret;

#ifdef SKELETON
        // Rest of the skeleton comes before everything else, so process it up!
        if (skeletonHeaders && !skeletonDone) {
            ret = ogg_stream_packetout(&skeletonStreamState, &oggPacket);
            if (ret < 0) {
                printf("Error reading skeleton headers: %d.\n", ret);
            }
            if (ret > 0) {
                // Checking another skeleton header packet...
                skeletonProcessingHeaders = oggskel_decode_header(skeleton, &oggPacket);
                if (skeletonProcessingHeaders < 0) {
                    printf("Error processing skeleton header packet: %d\n", skeletonProcessingHeaders);
                }
                if (oggPacket.e_o_s) {
                    skeletonDone = 1;
                }
            }
        }
#endif

        /* look for further theora headers */
        if (theoraHeaders && theoraProcessingHeaders) {
            ret = ogg_stream_packetpeek(&theoraStreamState, &oggPacket);
            if (ret < 0) {
                printf("Error reading theora headers: %d.\n", ret);
                exit(1);
            }
            if (ret > 0) {
                // Checking another theora header packet...
                theoraProcessingHeaders = th_decode_headerin(&theoraInfo, &theoraComment, &theoraSetupInfo, &oggPacket);
                if (theoraProcessingHeaders == 0) {
                    // We've completed the theora header
                    theoraHeaders = 3;
                } else if (theoraProcessingHeaders < 0) {
                	printf("Error parsing theora headers: %d.\n", theoraProcessingHeaders);
            	} else {
					ogg_stream_packetout(&theoraStreamState, NULL);
                }
            }
        }

        if (vorbisHeaders && (vorbisHeaders < 3)) {
            ret = ogg_stream_packetpeek(&vorbisStreamState, &oggPacket);
            if (ret < 0) {
                printf("Error reading vorbis headers: %d.\n", ret);
                exit(1);
            }
            if (ret > 0) {
                // Checking another vorbis header packet...
                vorbisProcessingHeaders = vorbis_synthesis_headerin(&vorbisInfo, &vorbisComment, &oggPacket);
                if (vorbisProcessingHeaders == 0) {
                    // Completed another vorbis header (of 3 total)...
                    vorbisHeaders++;
                } else {
                    printf("Invalid vorbis header?\n");
                    exit(1);
                }
                ogg_stream_packetout(&vorbisStreamState, NULL);
            }
        }
#ifdef OPUS
        if (opusHeaders && (opusHeaders < 2)) {
            ret = ogg_stream_packetpeek(&opusStreamState, &oggPacket);
            if (ret < 0) {
                printf("Error reading Opus headers: %d.\n", ret);
                exit(1);
            }
            // FIXME: perhaps actually *check* if this is a comment packet ;-)
            opusHeaders++;
            // discarding Opus comments...
            ogg_stream_packetout(&opusStreamState, NULL);
        }
#endif

    } else {
        /* and now we have it all.  initialize decoders */
        if (theoraHeaders) {
            theoraDecoderContext = th_decode_alloc(&theoraInfo, theoraSetupInfo);

            int hdec = !(theoraInfo.pixel_fmt & 1);
            int vdec = !(theoraInfo.pixel_fmt & 2);
            
            int display_width = theoraInfo.pic_width;
            int display_height = theoraInfo.pic_height;
            if (theoraInfo.aspect_numerator > 0 && theoraInfo.aspect_denominator > 0) {
            	display_width = display_width * theoraInfo.aspect_numerator / theoraInfo.aspect_denominator;
            }
            codecjs_callback_init_video(theoraInfo.frame_width, theoraInfo.frame_height,
                                        hdec, vdec,
                                        (float) theoraInfo.fps_numerator / theoraInfo.fps_denominator,
                                        theoraInfo.pic_width, theoraInfo.pic_height,
                                        theoraInfo.pic_x, theoraInfo.pic_y,
                                        display_width, display_height);
        }

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

			audioSampleRate = vorbisInfo.rate;
            codecjs_callback_init_audio(vorbisInfo.channels, audioSampleRate);
        }

        appState = STATE_DECODING;
        codecjs_callback_loaded_metadata();
    }
}

static void processDecoding() {
	needData = 0;
    if (theoraHeaders && !videobufReady) {
        /* theora is one in, one out... */
        if (ogg_stream_packetpeek(&theoraStreamState, &videoPacket) > 0) {
            videobufReady = 1;

			if (videoPacket.granulepos < 0) {
				// granulepos is actually listed per-page, not per-packet,
				// so not every packet lists a granulepos.
				// Scary, huh?
				if (videobufGranulepos < 0) {
					// don't know our position yet
				} else {
					videobufGranulepos++;
				}
			} else {
				videobufGranulepos = videoPacket.granulepos;
				th_decode_ctl(theoraDecoderContext, TH_DECCTL_SET_GRANPOS, &videobufGranulepos, sizeof(videobufGranulepos));
			}

			double videoPacketTime = -1;
			double packetKeyframeTime = -1;
			if (videobufGranulepos < 0) {
				// Extract the previous-keyframe info from the granule pos. It might be handy.
				keyframeGranulepos = (videobufGranulepos >> theoraInfo.keyframe_granule_shift) << theoraInfo.keyframe_granule_shift;

				// Convert to precious, precious seconds. Yay linear units!
				videobufTime = th_granule_time(theoraDecoderContext, videobufGranulepos);
				keyframeTime = th_granule_time(theoraDecoderContext, keyframeGranulepos);
				
				// Also, if we've just resynced a stream we need to feed this down to the decoder
	        }

            codecjs_callback_frame_ready(videobufTime, keyframeTime);
        } else {
            needData = 1;
        }
    }

    if (!audiobufReady) {
#ifdef OPUS
        if (opusHeaders) {
            if (ogg_stream_packetpeek(&opusStreamState, &audioPacket) > 0) {
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
            if (ogg_stream_packetpeek(&vorbisStreamState, &audioPacket) > 0) {
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
    if (ogg_stream_packetout(&theoraStreamState, &videoPacket) <= 0) {
        printf("Theora packet didn't come out of stream\n");
        return 0;
    }
    videobufReady = 0;
    int ret = th_decode_packetin(theoraDecoderContext, &videoPacket, NULL);
    if (ret == 0) {
        double t = th_granule_time(theoraDecoderContext, videobufGranulepos);
        if (t > 0) {
            videobufTime = t;
        } else {
            // For some reason sometimes we get a bunch of 0s out of th_granule_time
            videobufTime += 1.0 / ((double) theoraInfo.fps_numerator / theoraInfo.fps_denominator);
        }
        
        frames++;
        video_write();
        return 1;
    } else if (ret == TH_DUPFRAME) {
        // Duplicated frame, advance time
        videobufTime += 1.0 / ((double) theoraInfo.fps_numerator / theoraInfo.fps_denominator);
        frames++;
        video_write();
        return 1;
    } else {
        printf("Theora decoder failed mysteriously? %d\n", ret);
        return 0;
    }
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
        if (ogg_stream_packetout(&vorbisStreamState, &audioPacket) > 0) {
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
		if (appState == STATE_DECODING) {
			// queue ALL the pages!
			while (ogg_sync_pageout(&oggSyncState, &oggPage) > 0) {
				queue_page(&oggPage);
			}
		}
		char *dest = ogg_sync_buffer(&oggSyncState, bufsize);
		memcpy(dest, buffer, bufsize);
		if (ogg_sync_wrote(&oggSyncState, bufsize) < 0) {
			printf("Horrible error in ogg_sync_wrote\n");
		}
    }
}

int codecjs_process() {
	if (!buffersReceived) {
		return 0;
	}
	if (needData) {
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
    if (theoraHeaders) {
        ogg_stream_clear(&theoraStreamState);
        th_decode_free(theoraDecoderContext);
        th_comment_clear(&theoraComment);
        th_info_clear(&theoraInfo);
    }

    if (vorbisHeaders) {
        ogg_stream_clear(&vorbisStreamState);
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

    ogg_sync_clear(&oggSyncState);
}

void codecjs_flush_buffers() {
	// First, read out anything left in our input buffer
	while (ogg_sync_pageout(&oggSyncState, &oggPage) > 0) {
		queue_page(&oggPage);
	}
	
	// Then, dump all packets from the streams
	if (theoraHeaders) {
		while (ogg_stream_packetout(&theoraStreamState, &videoPacket)) {
			// flush!
		}
	}

	if (vorbisHeaders) {
		while (ogg_stream_packetout(&vorbisStreamState, &audioPacket)) {
			// flush!
		}
	}

#ifdef OPUS
	if (opusHeaders) {
		while (ogg_stream_packetout(&opusStreamState, &audioPacket)) {
			// flush!
		}
	}
#endif

	// And reset sync state for good measure.
	ogg_sync_reset(&oggSyncState);
	videobufReady = 0;
	audiobufReady = 0;
	videobufGranulepos = -1;
	videobufTime = -1;
	keyframeGranulepos = -1;
	keyframeTime = -1;
	audiobufGranulepos = -1;
	audiobufTime = -1;
	
	needData = 1;
}

void codecjs_discard_frame()
{
	if (videobufReady) {
		if (theoraHeaders) {
			ogg_stream_packetout(&theoraStreamState, &videoPacket);
		}
		videobufReady = 0;
	}
}

void codecjs_discard_audio()
{
	if (audiobufReady) {
		if (vorbisHeaders) {
			ogg_stream_packetout(&vorbisStreamState, &audioPacket);
		}
#ifdef OPUS
		if (opusHeaders) {
			ogg_stream_packetout(&opusStreamState, &audioPacket);
		}
#endif
		audiobufReady = 0;
	}
}

#ifdef SKELETON

/**
 * @return segment length in bytes, or -1 if unknown
 */
long codecjs_media_length() {
    ogg_int64_t segment_len = -1;
    if (skeletonHeaders) {
        oggskel_get_segment_len(skeleton, &segment_len);
    }
    return (long)segment_len;
}

/**
 * @return segment duration in seconds, or -1 if unknown
 */
float codecjs_media_duration() {
    if (skeletonHeaders) {
        ogg_uint16_t ver_maj = -1, ver_min = -1;
        oggskel_get_ver_maj(skeleton, &ver_maj);
        oggskel_get_ver_min(skeleton, &ver_min);
    
        ogg_int32_t serial_nos[4];
        size_t nstreams = 0;
        if (theoraHeaders) {
            serial_nos[nstreams++] = theoraStreamState.serialno;
        }
#ifdef OPUS
        if (opusHeaders) {
            serial_nos[nstreams++] = opusStreamState.serialno;
        }
#endif
        if (vorbisHeaders) {
            serial_nos[nstreams++] = vorbisStreamState.serialno;
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

long codecjs_keypoint_offset(long time_ms)
{
    ogg_int64_t offset = -1;
    if (skeletonHeaders) {
        ogg_int32_t serial_nos[4];
        size_t nstreams = 0;
        if (theoraHeaders) {
            serial_nos[nstreams++] = theoraStreamState.serialno;
        } else {
#ifdef OPUS
            if (opusHeaders) {
                serial_nos[nstreams++] = opusStreamState.serialno;
            }
#endif
            if (vorbisHeaders) {
                serial_nos[nstreams++] = vorbisStreamState.serialno;
            }
        }
        oggskel_get_keypoint_offset(skeleton, serial_nos, nstreams, time_ms, &offset);
    }
    return (long)offset;
}
        
#endif
