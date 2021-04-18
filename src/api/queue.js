function Queue(onQueueEmpty) {
  this.onQueueEmpty = onQueueEmpty;
  this.queuedCount = 0;
}

Queue.prototype.queue = function () {
  this.queuedCount++;
};

Queue.prototype.dequeue = function (...args) {
  if (--this.queuedCount === 0) this.onQueueEmpty(...args);
};

module.exports = Queue;
