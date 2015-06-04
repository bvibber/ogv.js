// Callbacks
extern void codecjs_callback_loaded_metadata();

extern void codecjs_callback_init_video(int frameWidth, int frameHeight,
                                        int hdec, int vdec,
                                        double fps,
                                        int picWidth, int picHeight,
                                        int picX, int picY,
                                        int aspectNumerator, int aspectDenominator);
extern void codecjs_callback_frame_ready(double timestamp, double keyframeTimestamp);
extern void codecjs_callback_frame(unsigned char *bufferY, int strideY,
                                   unsigned char *bufferCb, int strideCb,
                                   unsigned char *bufferCr, int strideCr,
                                   int width, int height,
                                   int hdec, int vdec,
                                   double timestamp,
                                   double keyframeTimestamp);

extern void codecjs_callback_init_audio(int channels, int rate);
extern void codecjs_callback_audio_ready(double audioTimestamp);
extern void codecjs_callback_audio(float **buffers, int channels, int sampleCount);

