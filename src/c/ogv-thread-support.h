#include <stdlib.h>

#ifdef __EMSCRIPTEN_PTHREADS__
#include <emscripten/emscripten.h>
#include <emscripten/threading.h>
#include <pthread.h>

static double cpu_time = 0.0;
static int busy = 0;

static pthread_t decode_thread;
static pthread_mutex_t decode_mutex; // to hold critical section
static pthread_cond_t ping_cond; // to trigger on new input

typedef struct {
	const char *data;
	size_t data_len;
} decode_queue_t;

static const int decode_queue_size = 32;
static decode_queue_t decode_queue[decode_queue_size];
static int decode_queue_start = 0;
static int decode_queue_end = 0;

static void *decode_thread_run(void *arg);
#endif

static void do_init(void);
static void do_destroy(void);
static void process_frame_decode(const char *data, size_t data_len);
static int process_frame_return(void *user_data);

void ogv_video_decoder_init() {
#ifdef __EMSCRIPTEN_PTHREADS__
	int ret = pthread_create(&decode_thread, NULL, decode_thread_run, NULL);
	if (ret) {
		abort();
	}
	pthread_mutex_init(&decode_mutex, NULL);
	pthread_cond_init(&ping_cond, NULL);
#else
  do_init();
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

static void main_thread_return(void *user_data) {
	int ret = process_frame_return(user_data);

	pthread_mutex_lock(&decode_mutex);
	double delta = cpu_time;
	cpu_time = 0;
	//busy = 0;
	//pthread_cond_signal(&ping_cond);
	pthread_mutex_unlock(&decode_mutex);

	ogvjs_callback_async_complete(ret, delta);
}

static void *decode_thread_run(void *arg) {
	do_init();
	while (1) {
		pthread_mutex_lock(&decode_mutex);
		while (/*busy || */ decode_queue_end == decode_queue_start) {
			pthread_cond_wait(&ping_cond, &decode_mutex);
		}
		busy = 1;
		decode_queue_t item;
		item = decode_queue[decode_queue_start];
		decode_queue_start = (decode_queue_start + 1) % decode_queue_size;
		pthread_mutex_unlock(&decode_mutex);

		double start = emscripten_get_now();
		process_frame_decode(item.data, item.data_len);
		double delta = emscripten_get_now() - start;

		pthread_mutex_lock(&decode_mutex);
		cpu_time += delta;
		pthread_mutex_unlock(&decode_mutex);
	}
}

static void call_main_return(void *user_data) {
	emscripten_async_run_in_main_runtime_thread_(EM_FUNC_SIG_VI, main_thread_return, user_data);
}

#else

// Single-threaded
int ogv_video_decoder_process_frame(const char *data, size_t data_len) {
	process_frame_decode(data, data_len);
	return 1;
}

static void call_main_return(void *user_data) {
	process_frame_return(user_data);
}

#endif
