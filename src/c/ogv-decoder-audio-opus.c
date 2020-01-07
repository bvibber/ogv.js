#include <assert.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <limits.h>

#include <ogg/ogg.h>

#include <opus/opus_multistream.h>
#include "opus_header.h"
#include "opus_helper.h"

#include "ogv-decoder-audio.h"
#include "ogv-ogg-support.h"

double            audioSampleRate = 0;

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

void ogv_audio_decoder_init(void) {
}

int ogv_audio_decoder_process_header(const char *data, size_t data_len) {
	ogg_packet oggPacket;
	ogv_ogg_import_packet(&oggPacket, data, data_len);

	if (opusHeaders == 0) {
		opusDecoder = opus_process_header(&oggPacket, &opusMappingFamily, &opusChannels, &opusPreskip, &opusGain, &opusStreams);
		if (opusDecoder) {
			opusHeaders = 1;
			if (opusGain) {
				opus_multistream_decoder_ctl(opusDecoder, OPUS_SET_GAIN(opusGain));
			}
			opusPrevPacketGranpos = 0;
			opusHeaders = 1;
			// process more headers
			return 1;
		} else {
			// fail!
			return 0;
		}
	} else if (opusHeaders == 1) {
		// comment packet -- discard
		opusHeaders++;
		return 1;
	} else {
		// opusDecoder should already be initialized
		// Opus has a fixed internal sampling rate of 48000 Hz
		audioSampleRate = 48000;
		ogvjs_callback_init_audio(opusChannels, audioSampleRate);
		return 1;
	}
}

int ogv_audio_decoder_process_audio(const char *data, size_t data_len) {
	int ret = 0;

	float *output = malloc(sizeof (float)*OPUS_MAX_FRAME_SIZE * opusChannels);
	int sampleCount = opus_multistream_decode_float(opusDecoder, (unsigned char*) data, data_len, output, OPUS_MAX_FRAME_SIZE, 0);
	if (sampleCount < 0) {
		//printf("Opus decoding error, code %d\n", sampleCount);
		ret = 0;
	} else {
		int skip = opusPreskip;
		if (skip >= sampleCount) {
			skip = sampleCount;
		} else {
			// reorder Opus' interleaved samples into two-dimensional [channel][sample] form
			float *pcm = malloc(sizeof (*pcm)*(sampleCount - skip) * opusChannels);
			float **pcmp = malloc(sizeof (*pcmp) * opusChannels);
			for (int c = 0; c < opusChannels; ++c) {
				pcmp[c] = pcm + c * (sampleCount - skip);
				for (int s = skip; s < sampleCount; ++s) {
					pcmp[c][s - skip] = output[s * opusChannels + c];
				}
			}
			ogvjs_callback_audio(pcmp, opusChannels, sampleCount - skip);
			free(pcmp);
			free(pcm);
		}
		opusPreskip -= skip;
		ret = 1;
	}
	free(output);

	return ret;
}

void ogv_audio_decoder_destroy(void) {
}
