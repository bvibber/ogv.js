#include <assert.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <limits.h>

#include <dav1d/dav1d.h>

#include "ogv-decoder-video.h"

/* Video decode state */

static Dav1dContext *context = NULL;

void ogv_video_decoder_init() {
    Dav1dSettings settings;
    dav1d_default_settings(&settings);
    dav1d_open(&context, &settings);
}

int ogv_video_decoder_async() {
  return 0;
}

int ogv_video_decoder_process_header(const char *data, size_t data_len) {
    return 0;
}

static void fake_free_callback(uint8_t *buf, void *user_data) {
    // do nothing
}

int ogv_video_decoder_process_frame(const char *buf, size_t buf_len)
{
    Dav1dData data;
    dav1d_data_wrap(&data, buf, buf_len, &fake_free_callback, NULL);
    //dav1d_data_create(&data, buf_len);
    //memcpy(data.data, buf, buf_len);

    Dav1dPicture picture = {0};
    dav1d_decode(context, &data, &picture);

    ogvjs_callback_frame(picture.data[0], picture.stride[0],
                         picture.data[1], picture.stride[1],
                         picture.data[2], picture.stride[1],
                         picture.p.w, picture.p.h,
                         picture.p.w >> 1, picture.p.h >> 1, // @FIXME handle correctly
                         picture.p.w, picture.p.h,
                         0, 0,
                         picture.p.w, picture.p.h);
    dav1d_picture_unref(&picture);

    return 1;
}

void ogv_video_decoder_destroy() {
    if (context) {
        dav1d_close(&context);
    }
}
