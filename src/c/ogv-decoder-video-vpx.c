#include <assert.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <limits.h>

#define VPX_CODEC_DISABLE_COMPAT 1
#include <vpx/vpx_decoder.h>
#include <vpx/vp8dx.h>

#include "ogv-decoder-video.h"
#include "ogv-thread-support.h"

static vpx_codec_ctx_t    vpxContext;
static vpx_codec_iface_t *vpxDecoder;

static void do_init(void) {

#ifdef OGV_VP9
	vpxDecoder = vpx_codec_vp9_dx();
#else
	vpxDecoder = vpx_codec_vp8_dx();
#endif

	vpx_codec_dec_cfg_t cfg;
#ifdef __EMSCRIPTEN_PTHREADS__
	const int max_cores = 8; // max threads for UHD tiled decoding
	int cores = emscripten_num_logical_cores();
	if (cores > max_cores) {
		cores = max_cores;
	}
	cfg.threads = cores;
#else
	cfg.threads = 0;
#endif
	cfg.w = 0; // ???
	cfg.h = 0;
	vpx_codec_dec_init(&vpxContext, vpxDecoder, &cfg, 0);
}

void do_destroy(void)
{
	// should tear instance down, but meh
}

static void process_frame_decode(const char *data, size_t data_len) {
	if (!data) {
		// NULL data signals syncing the decoder state
		call_main_return(NULL);
		return;
	}

	vpx_codec_decode(&vpxContext, (const uint8_t *)data, data_len, NULL, 1);
	// @todo check return value
	vpx_codec_decode(&vpxContext, NULL, 0, NULL, 1);

	// one-in, one-out. send back to the main thread for extraction.
	call_main_return(NULL);
}

static int process_frame_return(void *user_data) {
	vpx_codec_iter_t iter = NULL;
	vpx_image_t *image = NULL;
	int foundImage = 0;
	while ((image = vpx_codec_get_frame(&vpxContext, &iter))) {
		// is it possible to get more than one at a time? ugh
		// @fixme can we have multiples really? how does this worky
		if (foundImage) {
			// skip for now
			continue;
		}
		foundImage = 1;

		// image->h is inexplicably large for small sizes.
		// don't both copying the extra, but make sure it's chroma-safe.
		int height = image->d_h;
		if ((height & 1) == 1) {
			// copy one extra row if need be
			// not sure this is even possible
			// but defend in depth
			height++;
		}

		int chromaWidth, chromaHeight;
		switch(image->fmt) {
			case VPX_IMG_FMT_I420:
				chromaWidth = image->w >> 1;
				chromaHeight = height >> 1;
				break;
			case VPX_IMG_FMT_I422:
				chromaWidth = image->w >> 1;
				chromaHeight = height;
				break;
			case VPX_IMG_FMT_I444:
				chromaWidth = image->w;
				chromaHeight = height;
				break;
			default:
				//printf("Skipping frame with unknown picture type %d\n", (int)image->fmt);
				return 0;
		}
		ogvjs_callback_frame(image->planes[0], image->stride[0],
							 image->planes[1], image->stride[1],
							 image->planes[2], image->stride[2],
							 image->w, height,
							 chromaWidth, chromaHeight,
							 image->d_w, image->d_h, // crop size
							 0, 0, // crop pos
							 image->r_w, image->r_h); // render size
	}
	return foundImage;
}
