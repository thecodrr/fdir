import { Options } from "../../types";

export type GetArrayFunction = (paths: string[]) => string[];

const getArray: GetArrayFunction = (paths) => {
  return paths;
};

const getArrayGroup: GetArrayFunction = () => {
  return [""].slice(0, 0);
};

export function build(options: Options): GetArrayFunction {
  return options.group ? getArrayGroup : getArray;
}
