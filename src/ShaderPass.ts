import {createFBO, ShaderProgram} from "./glBasics";
import {GeometryRenderFunction, UniformObject, UniformValue} from "./glBasics/types";
import {FBO} from "./glBasics/createFBO";
import {Renderable} from "./types";

interface ShaderPassOpts {
  doubleBuffer?: boolean;
  width?: number;
  height?: number;
}

export default class ShaderPass implements Renderable{
  private _gl: WebGLRenderingContext;
  private _shaderProgram: ShaderProgram;
  private _geomRenderFn: GeometryRenderFunction;
  private _frameBuffers?: FBO[];
  private _currentFrameBuffer: number = 0;
  private _opts: ShaderPassOpts;
  private _updateFunctions: Array<() => void> = [];

  constructor(
    gl: WebGLRenderingContext,
    vertexShader: string,
    fragmentShader: string,
    geomRenderFn: GeometryRenderFunction,
    uniforms: UniformObject = {},
    opts: ShaderPassOpts = { doubleBuffer: false }
  ) {
    this._opts = opts;
    this._gl = gl;

    const uniformsWithResolution: UniformObject = {
      ...uniforms,
      resolution: {
        type: 'float2',
        value: this.size
      }
    }

    this._shaderProgram = new ShaderProgram(gl, vertexShader, fragmentShader, uniformsWithResolution);
    this._geomRenderFn = geomRenderFn;

    this.buildFrameBuffers();

    // if the webGL canvas is resized, update the resolution and recreate the frame buffers if need be
    const resizeObserver = new ResizeObserver(() => {
      if(!this._opts.width || !this._opts.height) {
        this._frameBuffers.forEach((fb) => fb.destroy());
        this.buildFrameBuffers();
      }
      this._shaderProgram.setUniform(
        'resolution',
        [Math.ceil(gl.canvas.clientWidth), Math.ceil(gl.canvas.clientHeight)]
      );
    });

    resizeObserver.observe(gl.canvas);
  }

  public get size() {
    return [
      Math.ceil(this._opts.width || this._gl.canvas.clientWidth),
      Math.ceil(this._opts.height || this._gl.canvas.clientHeight)
    ];
  }

  private buildFrameBuffers() {
    const { width, height, doubleBuffer } = this._opts;

    this._frameBuffers = [];
    this._frameBuffers.push(createFBO(this._gl, width, height))

    if(doubleBuffer) {
      this._frameBuffers.push(createFBO(this._gl, width, height))
    }
  }

  public outputTexture = () => {
    return this._frameBuffers[this._currentFrameBuffer].texture;
  }

  public linkPassToUniform( shaderPass: Renderable, uniformName: string ) {
    this.addUpdateFunction(() => {
      this._shaderProgram.setUniform(uniformName, shaderPass.outputTexture());
    });
  }

  public addUpdateFunction(updateFunction: () => void) {
    this._updateFunctions.push(updateFunction);
  }

  public removeUpdateFunction(updateFunction: () => void) {
    this._updateFunctions = this._updateFunctions.filter((fn) => fn !== updateFunction);
  }

  public getUniform(uniform: string) {
    return this._shaderProgram.getUniform(uniform)
  }

  public setUniform(uniform: string, value: UniformValue) {
    return this._shaderProgram.setUniform(uniform, value);
  }

  private update() {
    this._updateFunctions.forEach((fn) => fn());
  }

  public render(renderToScreen?: boolean) {
    this.update();

    if(this._opts.doubleBuffer) {
      this._currentFrameBuffer = (this._currentFrameBuffer + 1) % 2;
    }

    this._frameBuffers[this._currentFrameBuffer].bind();
    this._shaderProgram.render(this._geomRenderFn);

    if(renderToScreen) {
      this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
      this._gl.viewport(0, 0, this.size[0], this.size[1]);
      this._shaderProgram.render(this._geomRenderFn);
    }
  }

  public dispose() {
    this._shaderProgram.dispose();
    this._frameBuffers.forEach((fb) => fb.destroy());
  }
}