#include <assert.h>
#include <stdlib.h>
#include <string.h>
#include <vorbis/codec.h>

typedef struct {
    vorbis_info info;
    vorbis_comment comment;
    vorbis_dsp_state dsp;
    vorbis_block block;
    ogg_packet ogg;
    int headers;
    float *outbuf;
    int outlen;
} Vorbis;

typedef int AVCallbackId;
extern void AVCallback(AVCallbackId, int);

int VorbisProbe(void *buffer, int buflen) {
    ogg_packet ogg;
    ogg.packet = buffer;
    ogg.bytes = buflen;
    return vorbis_synthesis_idheader(&ogg);
}

Vorbis *VorbisInit(float *outbuf, int outlen) {
    Vorbis *vorbis = calloc(1, sizeof(Vorbis));
    vorbis_info_init(&vorbis->info);
    vorbis_comment_init(&vorbis->comment);
    vorbis->ogg.b_o_s = 1;
    vorbis->outbuf = outbuf;
    vorbis->outlen = outlen;
    return vorbis;
}

int VorbisHeaderDecode(Vorbis *vorbis, void *buffer, int buflen) {
    // setup ogg packet
    vorbis->ogg.packet = buffer;
    vorbis->ogg.bytes = buflen;
    
    // decode header
    int ret = vorbis_synthesis_headerin(&vorbis->info, &vorbis->comment, &vorbis->ogg);
    if (vorbis->ogg.b_o_s)
        vorbis->ogg.b_o_s = 0;
    
    return ret;
}

// getters for various pieces of info
int VorbisGetChannels(Vorbis *vorbis) {
    return vorbis->info.channels;
}

long VorbisGetSampleRate(Vorbis *vorbis) {
    return vorbis->info.rate;
}

int VorbisGetNumComments(Vorbis *vorbis) {
    return vorbis->comment.comments;
}

char *VorbisGetComment(Vorbis *vorbis, int index) {
    if (index >= vorbis->comment.comments)
        return NULL;
    
    return vorbis->comment.user_comments[index];
}

int VorbisDecode(Vorbis *vorbis, void *buffer, int buflen, AVCallbackId callback) {
    // setup ogg packet
    vorbis->ogg.packet = buffer;
    vorbis->ogg.bytes = buflen;
    
    int status = 0;
    if (vorbis->headers < 3) {
        status = vorbis_synthesis_headerin(&vorbis->info, &vorbis->comment, &vorbis->ogg);
        
        vorbis->headers++;
        if (status == 0 && vorbis->headers == 3) {
            vorbis->outlen /= vorbis->info.channels;
            
            status = vorbis_synthesis_init(&vorbis->dsp, &vorbis->info);
            if (status == 0)
                status = vorbis_block_init(&vorbis->dsp, &vorbis->block);
        }
    } else {
        // decode
        status = vorbis_synthesis(&vorbis->block, &vorbis->ogg);
        if (status == 0)
            status = vorbis_synthesis_blockin(&vorbis->dsp, &vorbis->block);
        
        int samples = 0;
        float **pcm;
        while ((samples = vorbis_synthesis_pcmout(&vorbis->dsp, &pcm)) > 0) {            
            // interleave
            int channels = vorbis->info.channels;
            int len = samples < vorbis->outlen ? samples : vorbis->outlen;
            
            for (int i = 0; i < channels; i++) {
                float *buf = &vorbis->outbuf[i];
                
                for (int j = 0; j < len; j++) {
                    *buf = pcm[i][j];
                    buf += channels;
                }
            }
            
            status = vorbis_synthesis_read(&vorbis->dsp, len);
            AVCallback(callback, len * channels);
        }
    }
    
    if (vorbis->ogg.b_o_s)
        vorbis->ogg.b_o_s = 0;
    
    return status;
}

void VorbisDestroy(Vorbis *vorbis) {
    vorbis_dsp_clear(&vorbis->dsp);
    vorbis_block_clear(&vorbis->block);
    vorbis_info_clear(&vorbis->info);
    vorbis_comment_clear(&vorbis->comment);
    free(vorbis);
}