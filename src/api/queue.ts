import { WalkerState } from "../types";

type OnQueueEmptyCallback = (error: Error | null, output: WalkerState) => void;
/**
 * This is a custom stateless queue to track concurrent async fs calls.
 * It increments a counter whenever a call is queued and decrements it
 * as soon as it completes. When the counter hits 0, it calls onQueueEmpty.
 */
export class Queue {
  private count: number = 0;
  constructor(private readonly onQueueEmpty: OnQueueEmptyCallback) {}

  enqueue() {
    this.count++;
  }

  dequeue(error: Error | null, output: WalkerState) {
    if (--this.count <= 0 || error) this.onQueueEmpty(error, output);
  }
}
