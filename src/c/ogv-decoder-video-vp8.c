#include <assert.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <limits.h>

#define VPX_CODEC_DISABLE_COMPAT 1
#include <vpx/vpx_decoder.h>
#include <vpx/vp8dx.h>

#include "ogv-decoder-video.h"

static vpx_codec_ctx_t    vpxContext;
static vpx_codec_iface_t *vpxDecoder;

void ogv_video_decoder_init() {
	vpxDecoder = vpx_codec_vp8_dx();
	vpx_codec_dec_init(&vpxContext, vpxDecoder, NULL, 0);
}

void ogv_video_decoder_destroy() {
	// should tear instance down, but meh
}

int ogv_video_decoder_process_header(const char *data, size_t data_len) {
	// no header packets for VP8
	printf("VP8 process_header should not happen?\n");
	return 0;
}

int ogv_video_decoder_process_frame(const char *data, size_t data_len) {
	vpx_codec_decode(&vpxContext, (const uint8_t *)data, data_len, NULL, 1);
	// @todo check return value
	vpx_codec_decode(&vpxContext, NULL, 0, NULL, 1);

	vpx_codec_iter_t iter = NULL;
	vpx_image_t *image = NULL;
	int foundImage = 0;
	while ((image = vpx_codec_get_frame(&vpxContext, &iter))) {
		// is it possible to get more than one at a time? ugh
		// @fixme can we have multiples really? how does this worky
		if (foundImage) {
			// skip for now
			printf("got multiple frames from VP8 stream unexpectedly?\n");
			continue;
		}
		foundImage = 1;
		ogvjs_callback_frame(image->planes[0], image->stride[0],
							 image->planes[1], image->stride[1],
							 image->planes[2], image->stride[2],
							 image->w, image->d_h,
							 image->w >> 1, image->d_h >> 1); // @todo pixel format
	}
	return foundImage;
}
