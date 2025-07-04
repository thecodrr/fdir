import { Options, IterableOutput } from "../types";
import { Walker } from "./walker";

class WalkerIterator<TOutput extends IterableOutput> {
  #resolver?: () => void;
  #walker: Walker<TOutput>;
  #currentGroup?: string[];
  #queue: TOutput[number][] = [];
  #error?: unknown;

  public constructor(root: string, options: Options) {
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
    this.#queue.push(result);
    if (this.#resolver) {
      const resolver = this.#resolver;
      this.#resolver = undefined;
      resolver();
    }
  };

  #onComplete = (err: unknown) => {
    this.#currentGroup = undefined;
    this.#complete = true;
    if (err) {
      this.#error = err;
    }
    if (this.#resolver) {
      const resolver = this.#resolver;
      this.#resolver = undefined;
      resolver();
    }
  };

  async *[Symbol.asyncIterator]() {
    this.#walker.start();

    while (true) {
      yield* this.#queue;
      this.#queue = [];

      if (this.#error) {
        throw this.#error;
      }

      if (this.#complete) {
        return;
      }

      await new Promise<void>((resolve) => {
        this.#resolver = resolve;
      });
    }
  }

  #complete: boolean = false;
}

export function iterator<TOutput extends IterableOutput>(
  root: string,
  options: Options
): AsyncIterable<TOutput[number]> {
  const iterator = new WalkerIterator<TOutput>(root, options);
  return iterator;
}
