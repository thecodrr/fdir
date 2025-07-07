import { callback, promise } from "../api/async.ts";
import { sync } from "../api/sync.ts";
import type { Options, Output, ResultCallback } from "../types.ts";

export class APIBuilder<TReturnType extends Output> {
  private readonly root: string;
  private readonly options: Options;

  constructor(root: string, options: Options) {
    this.root = root;
    this.options = options;
  }

  withPromise(): Promise<TReturnType> {
    return promise(this.root, this.options);
  }

  withCallback(cb: ResultCallback<TReturnType>) {
    callback(this.root, this.options, cb);
  }

  sync(): TReturnType {
    return sync(this.root, this.options);
  }
}
