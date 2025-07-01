import { Group, Options } from "../../types";

export type GroupFilesFunction = (
  groups: Group[],
  directory: string,
  files: string[],
  pushGroup: (group: Group, arr: Group[]) => void
) => void;

const groupFiles: GroupFilesFunction = (
  groups: Group[],
  directory: string,
  files: string[],
  pushGroup
) => {
  pushGroup({ directory, files, dir: directory }, groups);
};

const empty: GroupFilesFunction = () => {};

export function build(options: Options): GroupFilesFunction {
  return options.group ? groupFiles : empty;
}
