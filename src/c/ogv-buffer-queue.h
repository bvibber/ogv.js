#include <stdint.h>

typedef struct {
	// Todo: turn this into a linked list
    char *bytes;
    int64_t start;
    size_t len;
} BufferQueueItem;

typedef struct {
    // Currently assumes all items are adjacent and in order
    BufferQueueItem *items;
    size_t len;
    size_t max;
    int64_t pos;
    int64_t lastSeekTarget;
} BufferQueue;

extern BufferQueue *bq_init(void);

extern int64_t bq_start(BufferQueue *queue);
extern int64_t bq_end(BufferQueue *queue);
extern int64_t bq_tell(BufferQueue *queue);
extern int64_t bq_headroom(BufferQueue *queue);
extern int bq_seek(BufferQueue *queue, int64_t pos);
extern void bq_trim(BufferQueue *queue);
extern void bq_flush(BufferQueue *queue);
extern void bq_append(BufferQueue *queue, const char *data, size_t len);
extern int bq_read(BufferQueue *queue, char *data, size_t len);
extern void bq_free(BufferQueue *queue);
