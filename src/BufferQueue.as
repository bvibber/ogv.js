package {
    import flash.utils.IDataOutput;

    /**
     * Linked list class for queued audio buffers
     */
    internal class BufferQueue implements ILogger {
        public var head:BufferQueueItem = null;
        public var tail:BufferQueueItem = null;
        private var logger:ILogger;

        public function BufferQueue(aLogger:ILogger=null) {
            logger = aLogger;
        }

        public function sampleCount():int {
            var count:int = 0;
            for (var item:BufferQueueItem = head; item; item = item.next) {
                count += item.sampleCount();
            }
            return count;
        }

        public function writeToOutput(out:IDataOutput):void {
            for (var item:BufferQueueItem = head; item; item = item.next) {
                item.writeToOutput(out);
            }
        }

        public function prepend(item:BufferQueueItem):void {
            log('queue.prepend; head ' + (head ? 'y' : 'null') + '; tail ' + (tail ? 'y' : 'null'));
            item.prev = null;
            item.next = head;
            if (head) {
                head.prev = item;
            } else {
                tail = item;
            }
            head = item;
        }

        public function append(item:BufferQueueItem):void {
            log('queue.append; head ' + (head ? 'y' : 'null') + '; tail ' + (tail ? 'y' : 'null'));
            item.prev = tail;
            item.next = null;
            if (tail) {
                tail.next = item;
            } else {
                head = item;
            }
            tail = item;
        }

        public function shift():BufferQueueItem {
            var item:BufferQueueItem = head;
            if (item) {
                head = item.next;
                if (head) {
                    head.prev = null;
                }
                item.next = null;
            }
            return item;
        }

        public function pop():BufferQueueItem {
            var item:BufferQueueItem = tail;
            if (item) {
                tail = item.prev;
                if (tail) {
                    tail.next = null;
                }
                item.prev = null;
            }
            return item;
        }

        // Shift out enough items from the head to fill the given
        // sample count in a new BufferQueue list. May be shorter
        // if we run out of room.
        public function shiftSamples(samples:int):BufferQueue {
            var out:BufferQueue = new BufferQueue(),
                item:BufferQueueItem,
                remaining:int = samples,
                i:int = 0;
            while (remaining > 0) {
                item = shift();
                if (!item) {
                    break;
                } else if (item.sampleCount() > remaining) {
                    item.splitAt(remaining, function(a:BufferQueueItem, b:BufferQueueItem):void {
                        prepend(b);
                        item = a;
                    });
                }
                remaining -= item.sampleCount();
                out.append(item);
            }
            return out;
        }

        // Pop out enough items from the tail to fill the given
        // sample count in a new BufferQueue list. May be shorter
        // if we run out of room.
        public function popSamples(samples:int):BufferQueue {
            var out:BufferQueue = new BufferQueue(),
                item:BufferQueueItem,
                remaining:int = samples,
                i:int = 0;
            while (remaining > 0) {
                item = pop();
                if (!item) {
                    break;
                } else if (item.sampleCount() > remaining) {
                    item.splitAt(item.sampleCount() - remaining, function(a:BufferQueueItem, b:BufferQueueItem):void {
                        append(a);
                        item = b;
                    });
                }
                remaining -= item.sampleCount();
                out.prepend(item);
            }
            return out;
        }

        public function empty():void {
            head = null;
            tail = null;
        }

        public function prependTo(queue:BufferQueue):void {
            for (var item:BufferQueueItem = pop(); item; item = pop()) {
                queue.prepend(item);
            }
        }

        public function appendTo(queue:BufferQueue):void {
            for (var item:BufferQueueItem = shift(); item; item = shift()) {
                queue.append(item);
            }
        }

        public function log(msg:String):void {
            if (logger) {
                logger.log(msg);
            }
        }
    }
}
