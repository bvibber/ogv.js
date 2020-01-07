#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <limits.h>

#include <ogg/ogg.h>

#include <vorbis/codec.h>

#include "ogv-decoder-audio.h"
#include "ogv-ogg-support.h"

double            audioSampleRate = 0;

/* Audio decode state */
int               vorbisHeaders = 0;
int               vorbisProcessingHeaders;
ogg_stream_state  vorbisStreamState;
vorbis_info       vorbisInfo;
vorbis_dsp_state  vorbisDspState;
vorbis_block      vorbisBlock;
vorbis_comment    vorbisComment;

void ogv_audio_decoder_init(void) {
    /* init supporting Vorbis structures needed in header parsing */
    vorbis_info_init(&vorbisInfo);
    vorbis_comment_init(&vorbisComment);
}

int ogv_audio_decoder_process_header(const char *data, size_t data_len) {
	ogg_packet oggPacket;
	ogv_ogg_import_packet(&oggPacket, data, data_len);

	if (vorbisHeaders == 0) {
		oggPacket.b_o_s = 1; // hack!
	}

	vorbisProcessingHeaders = vorbis_synthesis_headerin(&vorbisInfo, &vorbisComment, &oggPacket);
	if (vorbisProcessingHeaders == 0) {
		// Completed another vorbis header (of 3 total)...
		vorbisHeaders++;
	} else {
		//printf("Invalid vorbis header?\n");
		return 0;
	}

	if (vorbisHeaders < 3) {
		return 1; // keep reading!
	} else {
		vorbis_synthesis_init(&vorbisDspState, &vorbisInfo);
		vorbis_block_init(&vorbisDspState, &vorbisBlock);

		audioSampleRate = vorbisInfo.rate;
		ogvjs_callback_init_audio(vorbisInfo.channels, audioSampleRate);

		return 1;
	}
}

int ogv_audio_decoder_process_audio(const char *data, size_t data_len) {
	ogg_packet audioPacket;
	ogv_ogg_import_packet(&audioPacket, data, data_len);

    int packetRet = 0;
    int foundSome = 0;


	int ret = vorbis_synthesis(&vorbisBlock, &audioPacket);
	if (ret == 0) {
		foundSome = 1;
		vorbis_synthesis_blockin(&vorbisDspState, &vorbisBlock);

		float **pcm;
		int sampleCount = vorbis_synthesis_pcmout(&vorbisDspState, &pcm);
		ogvjs_callback_audio(pcm, vorbisInfo.channels, sampleCount);

		vorbis_synthesis_read(&vorbisDspState, sampleCount);
	} else {
		//printf("Vorbis decoder failed mysteriously? %d", ret);
	}

	return foundSome;
}

void ogv_audio_decoder_destroy(void) {
    if (vorbisHeaders) {
        vorbis_info_clear(&vorbisInfo);
        vorbis_dsp_clear(&vorbisDspState);
        vorbis_block_clear(&vorbisBlock);
        vorbis_comment_clear(&vorbisComment);
    }
}
