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
extern void AVCallback(AVCallbackId, unsigned char *, int);

Vorbis *VorbisInit() {
    Vorbis *vorbis = calloc(1, sizeof(Vorbis));
    vorbis_info_init(&vorbis->info);
    vorbis_comment_init(&vorbis->comment);
    vorbis_synthesis_init(&vorbis->dsp, &vorbis->info);
    vorbis_block_init(&vorbis->dsp, &vorbis->block);
    return vorbis;
}

int VorbisDecode(Vorbis *vorbis, char *buffer, int buflen, AVCallbackId callback) {
    
}