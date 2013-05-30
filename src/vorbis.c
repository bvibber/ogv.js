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
} Vorbis;

typedef int AVCallbackId;
extern void AVCallback(AVCallbackId, void *, int);

int VorbisProbe(void *buffer, int buflen) {
    ogg_packet ogg;
    ogg.packet = buffer;
    ogg.bytes = buflen;
    return vorbis_synthesis_idheader(&ogg);
}

Vorbis *VorbisInit() {
    Vorbis *vorbis = calloc(1, sizeof(Vorbis));
    vorbis_info_init(&vorbis->info);
    vorbis_comment_init(&vorbis->comment);
    vorbis_synthesis_init(&vorbis->dsp, &vorbis->info);
    vorbis_block_init(&vorbis->dsp, &vorbis->block);
    vorbis->ogg.b_o_s = 1;
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
    vorbis->ogg.b_o_s = 0;
    vorbis->ogg.packet = buffer;
    vorbis->ogg.bytes = buflen;
    
    // decode
    if (vorbis_synthesis(&vorbis->block, &vorbis->ogg) == 0)
        vorbis_synthesis_blockin(&vorbis->dsp, &vorbis->block);
        
    int samples = 0;
    float **pcm;
    while ((samples = vorbis_synthesis_pcmout(&vorbis->dsp, &pcm)) > 0) {
        vorbis_synthesis_read(&vorbis->dsp, samples);
        AVCallback(callback, pcm, samples);
    }
    
    return 0;
}

void VorbisDestroy(Vorbis *vorbis) {
    // vorbis_info_clear(&vorbis->info);
    vorbis_comment_clear(&vorbis->comment);
    vorbis_dsp_clear(&vorbis->dsp);
    vorbis_block_clear(&vorbis->block);
    free(vorbis);
}