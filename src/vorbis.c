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

Vorbis *VorbisInit() {
    Vorbis *vorbis = calloc(1, sizeof(Vorbis));
    vorbis_info_init(&vorbis->info);
    vorbis_comment_init(&vorbis->comment);
    vorbis_synthesis_init(&vorbis->dsp, &vorbis->info);
    vorbis_block_init(&vorbis->dsp, &vorbis->block);
    return vorbis;
}

int VorbisDecode(Vorbis *vorbis, void *buffer, int buflen, AVCallbackId callback) {
    // setup ogg packet
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
}
