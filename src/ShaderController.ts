import ShaderPass from "./ShaderPass";
import MixPass from "./MixPass";
import {Renderable, RenderOpts} from "./index";
import { InterpolationFunction } from "./InterpolationFunctions";
import {UpdateFunctions} from "./UpdateFunctions";

interface RenderablePasses { [key: string]: Renderable };
interface TransitionPasses { [key: string]: MixPass };

export default class ShaderController extends UpdateFunctions implements Renderable {
  private _gl: WebGLRenderingContext;
  private _passes: RenderablePasses;
  private _transitions: TransitionPasses;
  private _currentPass: Renderable;
  private _nextPass: Renderable;

  constructor(gl: WebGLRenderingContext, renderablePasses?: RenderablePasses) {
    super();
    this._gl = gl;
    this._passes = renderablePasses || {};
    this._transitions = {
      crossfade: new MixPass(gl),
    }
    this._currentPass = Object.values(renderablePasses)[0];
  }

  public addPass(name: string, shaderPass: ShaderPass) {
    this._passes[name] = shaderPass;
  }

  public addTransition(name: string, transitionFragmentShader: string) {
    this._transitions[name] = new MixPass(this._gl, transitionFragmentShader);
  }

  public changeImmediatelyTo(name: string) {
    if(!this._passes[name]) {
      throw new Error(`the pass '${name}' doesn't exist in this shaderController, maybe you forgot to add it`);
      return
    }
    this._currentPass = this._passes[name];
  }

  public transitionTo(name: string, duration: number, transition: string = 'crossfade', interpolationFunction?: InterpolationFunction ) {
    if(!this._transitions[transition]) {
      throw new Error(`transition '${transition}' doesn't exist in this shaderController, maybe you forgot to add it`);
      return;
    }
    if(!this._passes[name]) {
      throw new Error(`the pass '${name}' doesn't exist in this shaderController, maybe you forgot to add it`);
      return
    }

    if(this._transitions[transition].isRunning()) {
      this._currentPass = this._nextPass;
    }

    const endFunc = () => {
      this._currentPass = this._passes[name]
    };
    this._transitions[transition].mix(this._currentPass, this._passes[name], duration, interpolationFunction, endFunc);
    this._nextPass = this._passes[name];
    this._currentPass = this._transitions[transition];
  }

  public render(opts?: RenderOpts) {
    this._currentPass.render(opts);
  }

  public outputTexture(): WebGLTexture {
    return this._currentPass.outputTexture();
  }

  public dispose() {
    Object.values(this._passes).forEach((pass) => pass.dispose());
    Object.values(this._transitions).forEach((transition) => transition.dispose())
  }
}