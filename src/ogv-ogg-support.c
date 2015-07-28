#include "ogv-ogg-support.h"

void ogv_ogg_import_packet(ogg_packet *dest, const char *data, size_t data_len)
{
    dest->packet = (unsigned char *)data;
    dest->bytes = data_len;
    dest->b_o_s = 0;
    dest->e_o_s = 0;
    dest->granulepos = 0;
    dest->packetno = 0;
}
