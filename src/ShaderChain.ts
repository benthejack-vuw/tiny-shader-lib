import {Renderable, RenderOpts} from "./index.js";
import {UpdateFunctions} from "./UpdateFunctions.js";
import {FBO} from "./glBasics/createFBO";
import ShaderPass from "./ShaderPass";

export default class ShaderChain extends UpdateFunctions implements Renderable {
  private _outputPass: Renderable;
  private _passes: Renderable[];

  constructor(passes: Renderable[]) {
    super();
    this._passes = [...passes];
    if(passes.length > 0) {
      this._outputPass = this._passes[this._passes.length - 1];
    }
  }

  set outputPass(pass: Renderable) {
    this._outputPass = pass;
  }

  public addPasses(...passes: Renderable[]) {
    this._passes = [...this._passes, ...passes];
  }

  public removePasses(...passes: Renderable[]) {
    this._passes = this._passes.filter((pass) => !passes.includes(pass))
  }

  public render(opts?: RenderOpts) {
    this.update();
    this._passes.forEach(
      (pass) => pass.render({
        ...opts,
        renderToScreen: (opts?.renderToScreen && pass === this._outputPass) || ((pass as ShaderPass).renderOpts?.renderToScreen)
      })
    );
  }

  public renderTo(target: FBO, opts: RenderOpts = {}) {
    this.update();

    this.render({
      ...opts,
      renderToScreen: false,
    });

    this._outputPass.render({
      ...opts,
      renderTarget: target,
      renderToScreen: false,
    });
  }

  public outputTexture() {
    return this._outputPass.outputTexture();
  }

  public dispose() {
    this._passes.forEach((pass) => pass.dispose());
  }
}