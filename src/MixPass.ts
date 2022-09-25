import {crossfadeFrag, passThroughVert} from "./shaders";
import {Renderable} from "./types";
import ShaderPass from "./ShaderPass";
import {clipspaceScreenTri} from "./glBasics";
import {UniformObject} from "./glBasics/types";
import {InterpolationFunction, linearInterpolation} from "./InterpolationFunctions";

export default class MixPass implements Renderable {
  private _shaderPass: ShaderPass;
  private _fromPass?: Renderable;
  private _toPass?: Renderable;
  private _interpolation: InterpolationFunction;
  private _startTime: number = -1;
  private _endTime: number = -1;
  private _onComplete?: () => void;

  constructor(gl: WebGLRenderingContext, mixFragShader: string = crossfadeFrag()) {
    const renderFunc = clipspaceScreenTri(gl);
    const uniforms: UniformObject = {
      from: { type: 'texture2D', value: null },
      to:   { type: 'texture2D', value: null },
      time: { type: 'float', value: 0 },
    };
    this._shaderPass = new ShaderPass(gl, passThroughVert(), mixFragShader, renderFunc, uniforms);
  }

  public set endFunc(func: () => void) {
    this._onComplete = func;
  }

  public mix(
    shaderPassFrom: Renderable,
    shaderPassTo: Renderable,
    duration: number,
    interpolationFunction: InterpolationFunction = linearInterpolation,
    onComplete?: () => void,
  ) {
    if(this.isRunning() && this._onComplete) {
      this._onComplete();
    }
    this._fromPass = shaderPassFrom;
    this._toPass = shaderPassTo;
    this._shaderPass.linkPassToUniform(shaderPassFrom, 'from');
    this._shaderPass.linkPassToUniform(shaderPassTo, 'to');
    this._startTime = Date.now();
    this._endTime = this._startTime + duration;
    this._interpolation = interpolationFunction;
    this._onComplete = onComplete;
  }

  public isRunning() {
    return this._startTime != -1 && this._endTime != -1;
  }

  public render(renderToScreen?: boolean) {
    if(!this.isRunning() || !this._fromPass || !this._toPass) return;

    let interpolationTime = Math.min(this._interpolation(Date.now(), this._startTime, this._endTime), 1);
    this._shaderPass.setUniform('time', interpolationTime);

    this._fromPass.render(false);
    this._toPass.render(false);
    this._shaderPass.render(renderToScreen);

    if(interpolationTime >= 1) {
      this._startTime = -1;
      this._endTime = -1;
      this._onComplete?.();
    }
  }

  public outputTexture(): WebGLTexture {
    return this._shaderPass.outputTexture();
  }
}