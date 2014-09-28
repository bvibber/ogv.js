#ifndef OPUS_HELPER_H
#define OPUS_HELPER_H

OpusMSDecoder *opus_process_header(ogg_packet *op, int *mapping_family, int *channels, int *preskip, float *gain, int *streams);

#endif
