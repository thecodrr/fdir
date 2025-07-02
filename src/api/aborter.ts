/**
 * AbortController is not supported on Node 14 so we use this until we can drop
 * support for Node 14.
 */
export class Aborter {
  aborted = false;
  abort() {
    this.aborted = true;
  }
}
