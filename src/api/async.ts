import { Output, Options, ResultCallback } from "../types";
import { Walker } from "./walker";

export function promise<TOutput extends Output>(
  root: string,
  options: Options
) {
  return new Promise<TOutput>((resolve, reject) => {
    callback<TOutput>(root, options, (err, output) => {
      if (err) return reject(err);
      resolve(output);
    });
  });
}

export function callback<TOutput extends Output>(
  root: string,
  options: Options,
  callback: ResultCallback<TOutput>
) {
  let walker = new Walker(root, options, callback);
  walker.start();
}
