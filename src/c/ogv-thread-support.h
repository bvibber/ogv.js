#include <stdlib.h>

#ifdef __EMSCRIPTEN_PTHREADS__
#include <emscripten/emscripten.h>
#include <emscripten/threading.h>
#include <pthread.h>

static double cpu_time = 0.0;
static double cpu_delta = 0.0;

static pthread_t decode_thread;
static pthread_mutex_t decode_mutex; // to hold critical section
static pthread_cond_t ping_cond; // to trigger on new input

typedef struct {
	const char *data;
	size_t data_len;
} decode_queue_t;

// Leave lots of room since this is a static buffer for now.
// Maybe it should be a linked list.
static const int decode_queue_size = 128;
static decode_queue_t decode_queue[decode_queue_size];
static int decode_queue_start = 0;
static int decode_queue_end = 0;

static void *decode_thread_run(void *arg);
#endif

static void do_init(void);
static void do_destroy(void);
static void process_frame_decode(const char *data, size_t data_len);
static int process_frame_return(void *user_data);

void ogv_video_decoder_init(void) {
#ifdef __EMSCRIPTEN_PTHREADS__
	pthread_mutex_init(&decode_mutex, NULL);
	pthread_cond_init(&ping_cond, NULL);
	int ret = pthread_create(&decode_thread, NULL, decode_thread_run, NULL);
	if (ret) {
		abort();
	}
#else
  do_init();
#endif
}

int ogv_video_decoder_async(void) {
#ifdef __EMSCRIPTEN_PTHREADS__
	return 1;
#else
	return 0;
#endif
}

void ogv_video_decoder_destroy(void) {
	do_destroy();
#ifdef __EMSCRIPTEN_PTHREADS__
	pthread_exit(NULL);
#endif
}


int ogv_video_decoder_process_header(const char *data, size_t data_len) {
	// no header packets for VP8/VP9/AV1
	return 0;
}

#ifdef __EMSCRIPTEN_PTHREADS__

// Send to background worker, then wake main thread on callback
int ogv_video_decoder_process_frame(const char *data, size_t data_len) {
	pthread_mutex_lock(&decode_mutex);

	decode_queue[decode_queue_end].data = data;
	decode_queue[decode_queue_end].data_len = data_len;
	decode_queue_end = (decode_queue_end + 1) % decode_queue_size;

	pthread_cond_signal(&ping_cond);
	pthread_mutex_unlock(&decode_mutex);
	return 1;
}

static void main_thread_return(void *user_data, float delta) {
	int ret = process_frame_return(user_data);

	ogvjs_callback_async_complete(ret, (double)delta);
}

static void *decode_thread_run(void *arg) {
	do_init();
	while (1) {
		pthread_mutex_lock(&decode_mutex);
		while (decode_queue_end == decode_queue_start) {
			pthread_cond_wait(&ping_cond, &decode_mutex);
		}
		decode_queue_t item;
		item = decode_queue[decode_queue_start];
		decode_queue_start = (decode_queue_start + 1) % decode_queue_size;
		pthread_mutex_unlock(&decode_mutex);

		cpu_time = emscripten_get_now() - cpu_delta;
		process_frame_decode(item.data, item.data_len);
		// Capture any CPU time that didn't result in a frame
		cpu_delta = emscripten_get_now() - cpu_time;
	}
}

static void call_main_return(void *user_data, int sync) {
	double right_now = emscripten_get_now();
	double delta = right_now - cpu_time;
	cpu_time = right_now;
	if (sync) {
		emscripten_sync_run_in_main_runtime_thread_(EM_FUNC_SIG_VIF, main_thread_return, user_data, (float)delta);
	} else {
		emscripten_async_run_in_main_runtime_thread_(EM_FUNC_SIG_VIF, main_thread_return, user_data, (float)delta);
	}
}

#else

static int process_frame_status = 0;

// Single-threaded
int ogv_video_decoder_process_frame(const char *data, size_t data_len) {
	process_frame_status = 0;
	process_frame_decode(data, data_len);
	return process_frame_status;
}

static void call_main_return(void *user_data, int sync) {
	(void)sync;
	process_frame_status = process_frame_return(user_data);
}

#endif
