import { ShaderPass } from "./";
import { Renderable } from "./types";

export default class ShaderChain implements Renderable{
  private _outputPass: ShaderPass;
  private _passes: ShaderPass[];

  constructor(outputPass: ShaderPass, ...passes: ShaderPass[]) {
    this._passes = [...passes, outputPass] || [outputPass];
    this.dedupe();
  }

  private dedupe() {
   this._passes = this._passes.reduce(
     (deDuped:ShaderPass[], pass: ShaderPass) => (
       deDuped.includes(pass) ? deDuped: [...deDuped, pass]
     ),
     []);
  }

  public addPasses(...passes: ShaderPass[]) {
    this._passes = [...this._passes, ...passes];
    this.dedupe();
  }

  public removePasses(...passes: ShaderPass[]) {
    this._passes = this._passes.filter((pass) => !passes.includes(pass))
  }

  public render(renderToScreen?: boolean) {
    this._passes.forEach(
      (pass) => pass.render(renderToScreen && pass === this._outputPass)
    );
  }

  public outputTexture() {
    return this._outputPass.outputTexture();
  }

  public dispose() {
    this._passes.forEach((pass) => pass.dispose());
  }
}