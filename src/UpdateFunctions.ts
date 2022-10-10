export class UpdateFunctions {
  private _updateFunctions: Array<() => void> = [];

  public addUpdateFunction(updateFunction: () => void) {
    this._updateFunctions.push(updateFunction);
  }

  public removeUpdateFunction(updateFunction: () => void) {
    this._updateFunctions = this._updateFunctions.filter((fn) => fn !== updateFunction);
  }

  protected update() {
    this._updateFunctions.forEach((fn) => fn());
  }
}