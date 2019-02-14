#include <assert.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <limits.h>

#include <stdio.h>

#include <dav1d/dav1d.h>

#include "ogv-decoder-video.h"
#include "ogv-thread-support.h"

/* Video decode state */

static Dav1dContext *context = NULL;

static void do_init(void) {
    Dav1dSettings settings;
    dav1d_default_settings(&settings);

#ifdef __EMSCRIPTEN_PTHREADS__
	const int max_cores = 4; // max threads for HD tiled decoding
	int cores = emscripten_num_logical_cores();
	if (cores > max_cores) {
		cores = max_cores;
	}
	settings.n_tile_threads = cores;
#endif

    dav1d_open(&context, &settings);
}

static void fake_free_callback(const uint8_t *buf, void *user_data) {
    // do nothing
}

static Dav1dPicture picture = {0};
static int decode_success = 0;

static void process_frame_decode(const char *buf, size_t buf_len)
{
    Dav1dData data;
    dav1d_data_wrap(&data, (const uint8_t*)buf, buf_len, &fake_free_callback, NULL);
    //dav1d_data_create(&data, buf_len);
    //memcpy(data.data, buf, buf_len);

    int ret = dav1d_send_data(context, &data);
    decode_success = !ret;
    if (decode_success) {
        memset(&picture, 0, sizeof(Dav1dPicture));
        ret = dav1d_get_picture(context, &picture);
        decode_success = !ret;
        if (decode_success) {
            // yay
        } else {
            printf("dav1d_get_picture returned %d\n", ret);
        }
    } else {
        printf("dav1d_send_data returned %d\n", ret);
    }
}

static int process_frame_return(void)
{
    if (!decode_success) {
        return 0;
    }

    int width = picture.p.w;
    if (width & 1) {
        // Don't esplode on 213x120
        width++;
    }
    int height = picture.p.h;
    if (height & 1) {
        height++;
    }
    int chromaWidth, chromaHeight;
    switch (picture.p.layout) {
        case DAV1D_PIXEL_LAYOUT_I420:
            chromaWidth = width >> 1;
            chromaHeight = height >> 1;
            break;
        default:
            // not yet supported
            abort();
    }
    ogvjs_callback_frame(picture.data[0], picture.stride[0],
                         picture.data[1], picture.stride[1],
                         picture.data[2], picture.stride[1],
                         width, height,
                         chromaWidth, chromaHeight,
                         picture.p.w, picture.p.h,
                         0, 0,
                         picture.p.w, picture.p.h);
    dav1d_picture_unref(&picture);

    return 1;
}

static void do_destroy(void) {
    if (context) {
        dav1d_close(&context);
    }
}
