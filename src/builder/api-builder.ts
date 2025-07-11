import { callback, promise } from "../api/async";
import { sync } from "../api/sync";
import { iterator } from "../api/iterator";
import {
  Options,
  Output,
  ResultCallback,
  IterableOutput,
  OutputIterator,
} from "../types";

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

  withIterator(): TReturnType extends IterableOutput
    ? OutputIterator<TReturnType>
    : never {
    // TODO (43081j): get rid of this awful `never`
    return iterator(this.root, this.options) as never;
  }
}
