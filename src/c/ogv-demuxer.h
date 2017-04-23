// Callbacks
extern void ogvjs_callback_init_audio(int channels, int rate);

extern void ogvjs_callback_init_video(int frameWidth, int frameHeight,
                                      int chromaWidth, int chromaHeight,
                                      double fps,
                                      int picWidth, int picHeight,
                                      int picX, int picY,
                                      int displayWidth, int displayHeight);

extern void ogvjs_callback_loaded_metadata(const char *videoCodec, const char *audioCodec);
extern void ogvjs_callback_video_packet(const char *buffer, size_t len, float frameTimestamp, float keyframeTimestamp, int isKeyframe);
extern void ogvjs_callback_audio_packet(const char *buffer, size_t len, float audioTimestamp);
extern int ogvjs_callback_frame_ready(void);
extern int ogvjs_callback_audio_ready(void);

extern int ogv_input_eof();
extern int ogv_input_seekable();
extern int64_t ogv_input_offset();
extern int ogv_input_bytes_available(int max);
extern int ogv_input_read_bytes(char *buffer, size_t len);
typedef void (*ogv_input_buffer_callback)(int nbytes);
extern void ogv_input_buffer(int nbytes, ogv_input_buffer_callback callback);
extern void ogv_input_seek(int64_t offset);
