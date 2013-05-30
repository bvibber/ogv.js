#include <assert.h>
#include <stdlib.h>
#include <string.h>
#include <ogg/ogg.h>

typedef int AVCallbackId;
extern void AVCallback(AVCallbackId, unsigned char *, int);

typedef struct {
    ogg_sync_state state;
    ogg_page page;
    ogg_stream_state stream;
    ogg_packet packet;
} AVOgg;

AVOgg *AVOggInit() {
    AVOgg *ogg = calloc(1, sizeof(AVOgg));
    assert(!ogg_sync_init(&ogg->state));
    return ogg;
}

int AVOggRead(AVOgg *ogg, char *buffer, int buflen, AVCallbackId callback) {
    // write buffer into ogg stream
    char *oggBuf = ogg_sync_buffer(&ogg->state, buflen);
    memcpy(oggBuf, buffer, buflen);
    assert(!ogg_sync_wrote(&ogg->state, buflen));
    
    // read ogg pages
    while (ogg_sync_pageout(&ogg->state, &ogg->page) == 1) {
        int serial = ogg_page_serialno(&ogg->page);
    
        if (ogg_page_bos(&ogg->page))
            assert(!ogg_stream_init(&ogg->stream, serial));
    
        assert(!ogg_stream_pagein(&ogg->stream, &ogg->page));
    
        // read packets
        while (ogg_stream_packetout(&ogg->stream, &ogg->packet) == 1)
            AVCallback(callback, ogg->packet.packet, ogg->packet.bytes);
    }
        
    return 0;
}

void AVOggDestroy(AVOgg *ogg) {
    ogg_sync_destroy(&ogg->state);
    free(ogg);
}