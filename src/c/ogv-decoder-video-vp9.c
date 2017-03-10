#ifdef __EMSCRIPTEN_PTHREADS__
#include <emscripten/emscripten.h>
#include <emscripten/threading.h>
#include <pthread.h>
#endif

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

#ifdef __EMSCRIPTEN_PTHREADS__

static enum {
	STATE_IDLE,
	STATE_BUSY
} main_thread_state = STATE_IDLE;

static double cpu_time = 0.0;

static pthread_t decode_thread;
static pthread_mutex_t decode_mutex; // to hold critical section
static pthread_mutex_t decode_cond_mutex; // to hold for the below
static pthread_cond_t decode_cond; // to trigger on new input

typedef struct {
	const char *data;
	size_t data_len;
} decode_queue_t;

static const int decode_queue_size = 16;
static decode_queue_t decode_queue[decode_queue_size];
static int decode_queue_start = 0;
static int decode_queue_end = 0;

static void *decode_thread_run(void *arg);

#endif

void ogv_video_decoder_init() {
	vpxDecoder = vpx_codec_vp9_dx();
	vpx_codec_dec_cfg_t cfg;
#ifdef __EMSCRIPTEN_PTHREADS__
	int cores = emscripten_num_logical_cores();
	printf("libvpx will use up to %d cores\n", cores);
	cfg.threads = cores;
#else
	cfg.threads = 0;
#endif
	cfg.w = 0; // ???
	cfg.h = 0;
	vpx_codec_dec_init(&vpxContext, vpxDecoder, &cfg, 0);

#ifdef __EMSCRIPTEN_PTHREADS__
	int ret = pthread_create(&decode_thread, NULL, decode_thread_run, NULL);
	if (ret) {
		printf("Error launching decode thread: %d\n", ret);
	}
	pthread_mutex_init(&decode_mutex, NULL);
	pthread_mutex_init(&decode_cond_mutex, NULL);
	pthread_cond_init(&decode_cond, NULL);
#endif
}

int ogv_video_decoder_async() {
#ifdef __EMSCRIPTEN_PTHREADS__
	return 1;
#else
  return 0;
#endif
}

void ogv_video_decoder_destroy() {
	// should tear instance down, but meh
#ifdef __EMSCRIPTEN_PTHREADS__
	pthread_exit(NULL);
#endif
}

int ogv_video_decoder_process_header(const char *data, size_t data_len) {
	// no header packets for VP8
	printf("VP9 process_header should not happen?\n");
	return 0;
}

static void process_frame_decode(const char *data, size_t data_len) {
	vpx_codec_decode(&vpxContext, (const uint8_t *)data, data_len, NULL, 1);
	// @todo check return value
	vpx_codec_decode(&vpxContext, NULL, 0, NULL, 1);
}

static int process_frame_return() {
	vpx_codec_iter_t iter = NULL;
	vpx_image_t *image = NULL;
	int foundImage = 0;
	while ((image = vpx_codec_get_frame(&vpxContext, &iter))) {
		// is it possible to get more than one at a time? ugh
		// @fixme can we have multiples really? how does this worky
		if (foundImage) {
			// skip for now
			printf("got multiple frames from VP9 stream unexpectedly?\n");
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

#ifdef __EMSCRIPTEN_PTHREADS__

// Send to background worker, then wake main thread on callback
int ogv_video_decoder_process_frame(const char *data, size_t data_len) {
	pthread_mutex_lock(&decode_mutex);

	decode_queue[decode_queue_end].data = data;
	decode_queue[decode_queue_end].data_len = data_len;
	decode_queue_end = (decode_queue_end + 1) % decode_queue_size;

	pthread_cond_signal(&decode_cond);
	pthread_mutex_unlock(&decode_mutex);
	return 1;
}

static void decode_thread_return() {
	pthread_mutex_lock(&decode_mutex);
	int ret = process_frame_return();
	main_thread_state = STATE_IDLE;
	double delta = cpu_time;
	cpu_time = 0;
	pthread_mutex_unlock(&decode_mutex);

	ogvjs_callback_async_complete(ret, delta);
}

static void *decode_thread_run(void *arg) {
	while (1) {
		int work_to_do = 0;
		decode_queue_t item;
		pthread_mutex_lock(&decode_mutex);
		if (main_thread_state == STATE_IDLE && decode_queue_end != decode_queue_start) {
			item = decode_queue[decode_queue_start];
			work_to_do = 1;
			decode_queue_start = (decode_queue_start + 1) % decode_queue_size;
		}
		pthread_mutex_unlock(&decode_mutex);

		if (work_to_do) {
			double start = emscripten_get_now();
			process_frame_decode(item.data, item.data_len);
			double delta = emscripten_get_now() - start;

			pthread_mutex_lock(&decode_mutex);
			main_thread_state = STATE_BUSY;
			cpu_time += delta;
			pthread_mutex_unlock(&decode_mutex);

			emscripten_sync_run_in_main_runtime_thread_(EM_FUNC_SIG_V, decode_thread_return);
		} else {
			pthread_mutex_lock(&decode_mutex);
			pthread_cond_wait(&decode_cond, &decode_mutex);
			pthread_mutex_unlock(&decode_mutex);
		}
	}
}

#else

// Single-threaded
int ogv_video_decoder_process_frame(const char *data, size_t data_len) {
	process_frame_decode(data, data_len);
	return process_frame_return();
}

#endif
