import {
  Output,
  PathsOutput,
  OnlyCountsOutput,
  GroupOutput,
  ResultCallback,
  WalkerState,
  Options,
} from "../../types";

export type InvokeCallbackFunction<TOutput extends Output> = (
  state: WalkerState,
  error: Error | null,
  callback?: ResultCallback<TOutput>
) => null | TOutput;

const onlyCountsSync: InvokeCallbackFunction<OnlyCountsOutput> = (state) => {
  return state.counts;
};

const groupsSync: InvokeCallbackFunction<GroupOutput> = (state) => {
  return state.groups;
};

const defaultSync: InvokeCallbackFunction<PathsOutput> = (state) => {
  return state.paths;
};

const limitFilesSync: InvokeCallbackFunction<PathsOutput> = (state) => {
  return state.paths.slice(0, state.options.maxFiles);
};

const onlyCountsAsync: InvokeCallbackFunction<OnlyCountsOutput> = (
  state,
  error,
  callback
) => {
  report(error, callback!, state.counts, state.options.suppressErrors);
  return null;
};

const defaultAsync: InvokeCallbackFunction<PathsOutput> = (
  state,
  error,
  callback
) => {
  report(error, callback!, state.paths, state.options.suppressErrors);
  return null;
};

const limitFilesAsync: InvokeCallbackFunction<PathsOutput> = (
  state,
  error,
  callback
) => {
  report(
    error,
    callback!,
    state.paths.slice(0, state.options.maxFiles),
    state.options.suppressErrors
  );
  return null;
};

const groupsAsync: InvokeCallbackFunction<GroupOutput> = (
  state,
  error,
  callback
) => {
  report(error, callback!, state.groups, state.options.suppressErrors);
  return null;
};

function report<TOutput extends Output>(
  error: Error | null,
  callback: ResultCallback<TOutput>,
  output: TOutput,
  suppressErrors: boolean
) {
  if (error && !suppressErrors) callback(error, output);
  else callback(null, output);
}

export function build<TOutput extends Output>(
  options: Options,
  isSynchronous: boolean
): InvokeCallbackFunction<TOutput> {
  const { onlyCounts, group, maxFiles } = options;

  if (onlyCounts)
    return isSynchronous
      ? (onlyCountsSync as InvokeCallbackFunction<TOutput>)
      : (onlyCountsAsync as InvokeCallbackFunction<TOutput>);
  else if (group)
    return isSynchronous
      ? (groupsSync as InvokeCallbackFunction<TOutput>)
      : (groupsAsync as InvokeCallbackFunction<TOutput>);
  else if (maxFiles)
    return isSynchronous
      ? (limitFilesSync as InvokeCallbackFunction<TOutput>)
      : (limitFilesAsync as InvokeCallbackFunction<TOutput>);
  else
    return isSynchronous
      ? (defaultSync as InvokeCallbackFunction<TOutput>)
      : (defaultAsync as InvokeCallbackFunction<TOutput>);
}
