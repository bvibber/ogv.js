// Callbacks
extern void ogvjs_callback_loaded_metadata(const char *videoCodec, const char *audioCodec);
extern void ogvjs_callback_video_packet(const char *buffer, size_t len, float frameTimestamp, float keyframeTimestamp);
extern void ogvjs_callback_audio_packet(const char *buffer, size_t len, float audioTimestamp);
extern int ogvjs_callback_frame_ready(void);
extern int ogvjs_callback_audio_ready(void);
