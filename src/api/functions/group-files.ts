import { Group, Options } from "../../types";

export type GroupFilesFunction = (
  groups: Group[],
  directory: string,
  files: string[]
) => void;

const groupFiles: GroupFilesFunction = (
  groups: Group[],
  directory: string,
  files: string[]
) => {
  groups.push({ directory, files, dir: directory });
};

const empty: GroupFilesFunction = () => {};

export function build(options: Options): GroupFilesFunction {
  return options.group ? groupFiles : empty;
}
