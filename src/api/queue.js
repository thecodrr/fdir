/**
 * This is a custom stateless queue to track concurrent async fs calls.
 * It increments a counter whenever a call is queued and decrements it
 * as soon as it completes. When the counter hits 0, it calls onQueueEmpty.
 * @param {(error: any, output: any)} onQueueEmpty the callback to call when queue is empty
 */
function Queue(onQueueEmpty) {
  this.onQueueEmpty = onQueueEmpty;
  this.queuedCount = 0;
}

Queue.prototype.queue = function() {
  this.queuedCount++;
};

Queue.prototype.dequeue = function(error, output) {
  if (--this.queuedCount === 0 || error) this.onQueueEmpty(error, output);
};

module.exports = Queue;
