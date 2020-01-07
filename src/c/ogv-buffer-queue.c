#include <stdlib.h>
#include <string.h>

#include "ogv-buffer-queue.h"

BufferQueue *bq_init(void) {
    BufferQueue *queue = malloc(sizeof(BufferQueue));
    queue->pos = 0;
    queue->len = 0;
    queue->max = 8;
    queue->items = malloc(queue->max * sizeof(BufferQueueItem));
    return queue;
}

int64_t bq_start(BufferQueue *queue) {
    if (queue->len == 0) {
        return queue->pos;
    }
    return queue->items[0].start;
}

int64_t bq_end(BufferQueue *queue) {
    if (queue->len == 0) {
        return queue->pos;
    }
    return queue->items[queue->len - 1].start + queue->items[queue->len - 1].len;
}

int64_t bq_tell(BufferQueue *queue) {
    return queue->pos;
}

int64_t bq_headroom(BufferQueue *queue) {
    return bq_end(queue) - bq_tell(queue);
}

int bq_seek(BufferQueue *queue, int64_t pos) {
    if (bq_start(queue) > pos) {
        queue->lastSeekTarget = pos;
        return -1;
    }
    if (bq_end(queue) < pos) {
        queue->lastSeekTarget = pos;
        return -1;
    }
    //printf("in-buffer seek to %lld\n", pos);
    queue->pos = pos;
    return 0;
}

void bq_trim(BufferQueue *queue) {
    int shift = 0;
    for (int i = 0; i < queue->len; i++) {
        if (queue->items[i].start + queue->items[i].len < queue->pos) {
            free(queue->items[i].bytes);
            queue->items[i].bytes = NULL;
            shift++;
            continue;
        } else {
            break;
        }
    }
    if (shift) {
        queue->len -= shift;
        memmove(queue->items, queue->items + shift, queue->len * sizeof(BufferQueueItem));
    }
}

void bq_flush(BufferQueue *queue) {
    for (int i = 0; i < queue->len; i++) {
        free(queue->items[i].bytes);
        queue->items[i].bytes = NULL;
    }
    queue->len = 0;
    queue->pos = 0;
}

void bq_append(BufferQueue *queue, const char *data, size_t len) {
    if (queue->len == queue->max) {
        bq_trim(queue);
    }
    if (queue->len == queue->max) {
        queue->max += 8;
        queue->items = realloc(queue->items, queue->max * sizeof(BufferQueueItem));
    }
    queue->items[queue->len].start = bq_end(queue);
    queue->items[queue->len].len = len;
    queue->items[queue->len].bytes = malloc(len);
    memcpy(queue->items[queue->len].bytes, data, len);
    queue->len++;
}

int bq_read(BufferQueue *queue, char *data, size_t len) {
    if (bq_headroom(queue) < len) {
        return -1;
    }

    size_t offset = 0;
    size_t remaining = len;
    for (int i = 0; i < queue->len; i++) {
        if (queue->items[i].start + queue->items[i].len < queue->pos) {
            //printf("bq_read skipped item at pos %lld len %d\n", queue->items[i].start, queue->items[i].len);
            continue;
        }
        size_t chunkStart = queue->pos - queue->items[i].start;
        size_t chunkLen = queue->items[i].len - chunkStart;
        if (chunkLen > remaining) {
            chunkLen = remaining;
        }
        memcpy(data + offset, queue->items[i].bytes + chunkStart, chunkLen);
        //printf("bq_read copy chunkStart %d chunkLen %d to offset %d; from item %d start %lld len %d (pos %lld)\n", chunkStart, chunkLen, offset, i, queue->items[i].start, queue->items[i].len, queue->pos);
        queue->pos += chunkLen;
        offset += chunkLen;
        remaining -= chunkLen;
        if (remaining <= 0) {
            return 0;
        }
    }
    return -1;
}

void bq_free(BufferQueue *queue) {
    bq_flush(queue);
    free(queue->items);
    free(queue);
};
