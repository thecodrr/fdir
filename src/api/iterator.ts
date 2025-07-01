import { Options, IterableOutput } from "../types";
import { Walker } from "./walker";

class WalkerIterator<TOutput extends IterableOutput> {
  #next: Promise<TOutput | null>;
  #resolver: (value: TOutput[number] | null) => void;
  #walker: Walker<TOutput>;
  #currentGroup?: string[];

  public constructor(root: string, options: Options) {
    this.#resolver = () => {};
    this.#next = this.#createNext();
    const pushPath = options.group ? this.#pushPath : this.#pushResult;
    this.#walker = new Walker<TOutput>(
      root,
      options,
      this.#onComplete,
      pushPath,
      this.#pushResult
    );
  }

  #pushPath = (path: string, arr: string[]) => {
    if (arr !== this.#currentGroup) {
      this.#currentGroup = arr;
    }
    arr.push(path);
  };

  #pushResult = async (result: TOutput[number]) => {
    this.#resolver(result);
    this.#next = this.#createNext(this.#next);
  };

  #onComplete = () => {
    this.#currentGroup = undefined;
    this.#resolver(null);
  };

  async #createNext(prev?: Promise<TOutput | null>): Promise<TOutput | null> {
    const next = new Promise<TOutput[number] | null>((resolve) => {
      this.#resolver = resolve;
    });
    if (prev) {
      const prevResult = await prev;
      const nextResult = await next;
      if (prevResult === null || nextResult === null) {
        return null;
      }
      return [...prevResult, nextResult] as TOutput | null;
    } else {
      const nextResult = await next;
      return nextResult === null ? nextResult : ([nextResult] as TOutput);
    }
  }

  async *[Symbol.asyncIterator]() {
    let promise = this.#next;
    this.#walker.start();

    let finished = false;

    while (!finished) {
      const result = await promise;
      promise = this.#next;
      if (result === null) {
        finished = true;
      } else {
        yield* result;
      }
    }
  }
}

export function iterator<TOutput extends IterableOutput>(
  root: string,
  options: Options
): AsyncIterable<TOutput[number]> {
  const iterator = new WalkerIterator<TOutput>(root, options);
  return iterator;
}
