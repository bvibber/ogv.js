// Forward decls for C-side functions

/**
 * Initialize the demuxer module and start parsing data.
 * Once track metadata is fully processed, call ogv_promise_resolve().
 * In case of error, call ogv_promise_reject().
 */
void ogv_demuxer_init();

/**
 * Demux until at least one packet is available.
 * @TODO hrmmmz
 * Once data is available or stream complete, call ogv_promise_resolve().
 * In case of error, call ogv_promise_reject().
 */
void ogv_demuxer_demux();

/**
 * Attempt to seek on the input stream to the nearest keypoint,
 * if possible. If not possible, call ogv_promise_reject().
 *
 * Once packets are ready to read, call ogv_promise_resolve().
 * In case of error, call ogv_promise_reject().
 */
void ogv_demuxer_seek(double seekTime);

/**
 * Clear demuxer internal state.
 */
void ogv_demuxer_flush();

/**
 * Tear down internal state.
 */
void ogv_demuxer_destroy();

/**
 * Does the data stream appear to be seekable?
 */
int ogv_demuxer_seekable();

/**
 * Media duration, in seconds.
 * Return -1 if unknown.
 */
double ogv_demuxer_media_duration();


// Callbacks
extern void ogv_init_audio(const char *codec, int channels, int rate);

extern void ogv_init_video(const char *codec,
                           int frameWidth, int frameHeight,
                           int chromaWidth, int chromaHeight,
                           double fps,
                           int picWidth, int picHeight,
                           int picX, int picY,
                           int displayWidth, int displayHeight);

extern void ogv_init_loaded();
extern void ogv_video_packet(const char *buffer, size_t len, float frameTimestamp, float keyframeTimestamp, int isKeyframe);
extern void ogv_audio_packet(const char *buffer, size_t len, float audioTimestamp);


// Promise callbacks
// Only one async operation is active at a time on the demuxer, so
// don't need to keep track of which one is which on this end.
extern void ogv_promise_resolve();
extern void ogv_promise_reject(const char *err);


// Input stream properties
extern int ogv_input_eof(void);
extern int ogv_input_seekable(void);
extern int64_t ogv_input_offset(void);

// Input stream sync methods
extern size_t ogv_input_bytes_available(size_t max);
extern size_t ogv_input_read_bytes(char *buffer, size_t len);
extern size_t ogv_input_peek_bytes(char *buffer, size_t len);
extern void ogv_input_seek(int64_t offset);

// Input stream async methods
// On success, calls the callback...
// On failure, chains through to reject the current promise.
typedef void (*ogv_input_buffer_callback)(size_t nbytes);
extern void ogv_input_buffer(int nbytes, ogv_input_buffer_callback callback);
