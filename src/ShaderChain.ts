import {Renderable, RenderOpts} from "./index";

export default class ShaderChain implements Renderable{
  private _outputPass: Renderable;
  private _passes: Renderable[];

  constructor(passes: Renderable[]) {
    this._passes = [...passes];
    this.dedupe();
  }

  set outputPass(pass: Renderable) {
    this._outputPass = pass;
  }

  private dedupe() {
   this._passes = this._passes.reduce(
     (deDuped:Renderable[], pass: Renderable) => (
       deDuped.includes(pass) ? deDuped: [...deDuped, pass]
     ),
     []);
  }

  public addPasses(...passes: Renderable[]) {
    this._passes = [...this._passes, ...passes];
    this.dedupe();
  }

  public removePasses(...passes: Renderable[]) {
    this._passes = this._passes.filter((pass) => !passes.includes(pass))
  }

  public render(opts?: RenderOpts) {
    this._passes.forEach(
      (pass) => pass.render({
        ...opts,
        renderToScreen: opts?.renderToScreen && pass === this._outputPass
      })
    );
  }

  public outputTexture() {
    return this._outputPass.outputTexture();
  }

  public dispose() {
    this._passes.forEach((pass) => pass.dispose());
  }
}