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

static void copy_plane(vpx_image_t *dest, vpx_image_t *src, int plane, int width, int height) {
	int stride_src = src->stride[plane];
	int stride_dest = dest->stride[plane];
	for (int y = 0; y < height; y++) {
		memcpy(&dest->planes[plane][y * stride_dest],
		       &src->planes[plane][y * stride_src],
			   width);
	}
}

static vpx_image_t* copy_image(vpx_image_t *src) {
	// Note the outside edges will be filled by a copy on the JS side.
	// This may change in future.
	int width = ((src->d_w + 1) & ~1);
	int height = ((src->d_h + 1) & ~1);
	int chromaWidth, chromaHeight;
	switch(src->fmt) {
		case VPX_IMG_FMT_I420:
			chromaWidth = width >> 1;
			chromaHeight = height >> 1;
			break;
		case VPX_IMG_FMT_I422:
			chromaWidth = width >> 1;
			chromaHeight = height;
			break;
		case VPX_IMG_FMT_I444:
			chromaWidth = width;
			chromaHeight = height;
			break;
		default:
			return NULL;
	}

	vpx_image_t* dest = vpx_img_alloc(NULL, src->fmt, src->d_w, src->d_h, 16);
	copy_plane(dest, src, 0, width, height);
	copy_plane(dest, src, 1, chromaWidth, chromaHeight);
	copy_plane(dest, src, 2, chromaWidth, chromaHeight);
	return dest;
}

static void process_frame_decode(const char *data, size_t data_len) {
	if (!data) {
		// NULL data signals syncing the decoder state
		call_main_return(NULL, 1);
		return;
	}

	int ret = vpx_codec_decode(&vpxContext, (const uint8_t *)data, data_len, NULL, 1);
	if (ret != VPX_CODEC_OK) {
		call_main_return(NULL, 0);
		return;
	}
	ret = vpx_codec_decode(&vpxContext, NULL, 0, NULL, 1);
	if (ret != VPX_CODEC_OK) {
		call_main_return(NULL, 0);
		return;
	}

	vpx_codec_iter_t iter = NULL;
	vpx_image_t *image = NULL;
	int foundImage = 0;
	while ((image = vpx_codec_get_frame(&vpxContext, &iter))) {
		// send back to the main thread for extraction.
		foundImage = 1;
#ifdef __EMSCRIPTEN_PTHREADS__
		// Copy off main thread and send asynchronously...
		// This allows decoding to continue without waiting
		// for the main thread.
		call_main_return(copy_image(image), 0);
#else
		call_main_return(image, 1);
#endif
	}
	if (!foundImage) {
		call_main_return(NULL, 0);
		return;
	}
}

static int process_frame_return(void *user_data) {
	vpx_image_t *image = (vpx_image_t*)user_data;
	if (image) {
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
#ifdef __EMSCRIPTEN_PTHREADS__
		// We were given a copy, so free it.
		vpx_img_free(image);
#else
		// Image will be freed implicitly by next decode call.
#endif
		return 1;
	} else {
		return 0;
	}
}
