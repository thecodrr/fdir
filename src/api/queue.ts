import type { WalkerState } from "../types.ts";

type OnQueueEmptyCallback = (error: Error | null, output: WalkerState) => void;
/**
 * This is a custom stateless queue to track concurrent async fs calls.
 * It increments a counter whenever a call is queued and decrements it
 * as soon as it completes. When the counter hits 0, it calls onQueueEmpty.
 */
export class Queue {
  count: number = 0;
  private onQueueEmpty?: OnQueueEmptyCallback;

  constructor(onQueueEmpty?: OnQueueEmptyCallback) {
    this.onQueueEmpty = onQueueEmpty;
  }

  enqueue() {
    this.count++;
    return this.count;
  }

  dequeue(error: Error | null, output: WalkerState) {
    if (this.onQueueEmpty && (--this.count <= 0 || error)) {
      this.onQueueEmpty(error, output);
      if (error) {
        output.controller.abort();
        this.onQueueEmpty = undefined;
      }
    }
  }
}
