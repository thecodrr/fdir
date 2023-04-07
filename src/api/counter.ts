export class Counter {
  private _files: number = 0;
  private _directories: number = 0;

  set files(num: number) {
    this._files = num;
  }

  get files() {
    return this._files;
  }

  set directories(num: number) {
    this._directories = num;
  }

  get directories() {
    return this._directories;
  }

  /**
   * @deprecated use `directories` instead
   */
  /* c8 ignore next 3 */
  get dirs() {
    return this._directories;
  }
}
