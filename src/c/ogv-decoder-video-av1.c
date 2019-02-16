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
    /*if (cores >= 4) {
        settings.n_tile_threads = 2;
        settings.n_frame_threads = cores / 2;
    } else*/ if (cores >= 2) {
        settings.n_frame_threads = cores;
    }
#endif

    dav1d_open(&context, &settings);
}

static void fake_free_callback(const uint8_t *buf, void *user_data) {
    // do nothing
}

typedef struct _DecodeState {
    Dav1dPicture picture;
    int success;
} DecodedFrame;

static void process_frame_decode(const char *buf, size_t buf_len)
{
    if (buf) {
        Dav1dData data;
        dav1d_data_wrap(&data, (const uint8_t*)buf, buf_len, &fake_free_callback, NULL);
        do {
            int ret = dav1d_send_data(context, &data);
            if (!ret) {
                // All right! success.
            } else if (ret == -EAGAIN) {
                // Too many decoded pictures in buffer; drain them.
            } else {
                printf("dav1d_send_data returned %d\n", ret);
                break;
            }

            DecodedFrame *frame = calloc(1, sizeof(DecodedFrame));
            int ret2 = dav1d_get_picture(context, &frame->picture);
            if (!ret2) {
                // yay
                frame->success = 1;
                call_main_return(frame);
                continue;
            } else if (ret2 == -EAGAIN) {
                free(frame);
                // Out of pictures. Go home and wait for more frames.
                continue;
            } else {
                free(frame);
                printf("dav1d_get_picture returned %d\n", ret2);
                break;
            }
        } while (data.sz);
    }

    if (!buf) {

        // Drain any remaining pictures so we have them. (?)
        for (;;) {
            DecodedFrame *frame = calloc(1, sizeof(DecodedFrame));
            int ret = dav1d_get_picture(context, &frame->picture);
            if (!ret) {
                // yay
                frame->success = 1;
                call_main_return(frame);
                continue;
            } else if (ret == -EAGAIN) {
                free(frame);
                // Out of pictures. Go home and wait for more frames.
                break;
            } else {
                free(frame);
                printf("dav1d_get_picture returned %d\n", ret);
                break;
            }
        }

        // Issue a null callback
        call_main_return(NULL);
    }
}

static int process_frame_return(void *user_data)
{
    if (!user_data) {
        // NULL indicated a sync point.
        return 0;
    }
    DecodedFrame *frame = (DecodedFrame *)user_data;    
    if (!frame->success) {
        return 0;
    }

    int width = frame->picture.p.w;
    if (width & 1) {
        // Don't esplode on 213x120
        width++;
    }
    int height = frame->picture.p.h;
    if (height & 1) {
        height++;
    }
    int chromaWidth, chromaHeight;
    switch (frame->picture.p.layout) {
        case DAV1D_PIXEL_LAYOUT_I420:
            chromaWidth = width >> 1;
            chromaHeight = height >> 1;
            break;
        default:
            // not yet supported
            abort();
    }
    ogvjs_callback_frame(frame->picture.data[0], frame->picture.stride[0],
                         frame->picture.data[1], frame->picture.stride[1],
                         frame->picture.data[2], frame->picture.stride[1],
                         width, height,
                         chromaWidth, chromaHeight,
                         frame->picture.p.w, frame->picture.p.h,
                         0, 0,
                         frame->picture.p.w, frame->picture.p.h);
    dav1d_picture_unref(&frame->picture);
    free(frame);

    return 1;
}

static void do_destroy(void) {
    if (context) {
        dav1d_close(&context);
    }
}
