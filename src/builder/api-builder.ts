import { callback, promise } from "../api/async";
import { sync } from "../api/sync";
import { Options, Output, ResultCallback } from "../types";

export class APIBuilder<TReturnType extends Output> {
  constructor(
    private readonly root: string,
    private readonly options: Options
  ) {}

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
