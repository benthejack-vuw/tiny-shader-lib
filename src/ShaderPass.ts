import {clipspaceScreenTri, createFBO, ShaderProgram} from "./glBasics";
import {GeometryRenderFunction, UniformObject, UniformValue} from "./glBasics/types";
import {FBO} from "./glBasics/createFBO";
import {Renderable, RenderOpts} from "./index";
import {passThroughVert, screenTextureFrag} from "./shaders";
import {blendFunctions, BlendMode} from "./glBasics/blending";

interface ShaderPassOpts {
  doubleBuffer?: boolean;
  width?: number;
  height?: number;
}

export default class ShaderPass implements Renderable {
  private static bufferToScreen?: ShaderProgram;
  private static bufferToScreenRect?: GeometryRenderFunction;

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
        this.size,
      );
    });

    resizeObserver.observe(gl.canvas);
  }

  public setBufferTextureParam(parameter: GLenum, value: GLint) {
    this._frameBuffers.forEach((fbo) => {
      this._gl.bindTexture(this._gl.TEXTURE_2D, fbo.texture);
      this._gl.texParameteri(this._gl.TEXTURE_2D, parameter, value);
    });
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

  public render({
    renderToScreen,
    blendPixels,
    blendMode = BlendMode.NORMAL,
    geomRenderFunction,
    clear,
    clearColor,
  }: RenderOpts = { renderToScreen: false }) {
    this.update();

    if(this._opts.doubleBuffer) {
      this._currentFrameBuffer = (this._currentFrameBuffer + 1) % 2;
    }

    // set blend mode
    if(!renderToScreen) {
      blendFunctions[blendMode](this._gl);
    }

    this._frameBuffers[this._currentFrameBuffer].bind();
    this._gl.viewport(0, 0, this.size[0], this.size[1]);

    if(clear) {
      this._gl.clearColor(
        clearColor?.r || 0,
        clearColor?.g || 0,
        clearColor?.b || 0,
        clearColor?.a ?? 1
      );
      this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    }
    this._shaderProgram.render(geomRenderFunction ?? this._geomRenderFn);

    if(renderToScreen) {
      this.renderToScreen({blendPixels, clear, clearColor, blendMode, geomRenderFunction});
    }
  }

  public renderToScreenAtCanvasResolution() {
    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    this._gl.viewport(0, 0, this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);
    this._shaderProgram.setUniformAround(
      'resolution',
      [this._gl.drawingBufferWidth, this._gl.drawingBufferHeight],
      () => this._shaderProgram.render(this._geomRenderFn)
    );
  }

  private renderToScreen({blendPixels = true, clear, clearColor, blendMode}: RenderOpts) {
    const {
      bufferToScreen,
      bufferToScreenRect
    } = ShaderPass.bufferToScreenProgram(this._gl);

    const currentTexture = this.outputTexture();
    this._gl.bindTexture(this._gl.TEXTURE_2D, currentTexture);

    const bufferBlending = this._gl.getTexParameter(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER);
    this._gl.texParameteri(
      this._gl.TEXTURE_2D,
      this._gl.TEXTURE_MAG_FILTER,
      blendPixels ? this._gl.LINEAR : this._gl.NEAREST
    );

    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    this._gl.viewport(0, 0, this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);
    if(clear) {
      this._gl.clearColor(
        clearColor?.r ?? 1,
        clearColor?.g ?? 1,
        clearColor?.b ?? 1,
        clearColor?.a ?? 1
      );
      this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    }

    bufferToScreen.bind();
    bufferToScreen.setUniform('map', currentTexture);
    bufferToScreen.setUniform('resolution', [this._gl.drawingBufferWidth, this._gl.drawingBufferHeight]);
    blendFunctions[blendMode](this._gl);
    bufferToScreen.render(bufferToScreenRect);

    this._gl.texParameteri(
      this._gl.TEXTURE_2D,
      this._gl.TEXTURE_MAG_FILTER,
      bufferBlending
    );
  }

  private static bufferToScreenProgram(gl: WebGLRenderingContext) {
    if(!ShaderPass.bufferToScreen) {
      const uniforms: UniformObject = {
        map: {
          type: 'texture2D',
          value: null,
        },
        resolution: {
          type: 'float2',
          value: [gl.drawingBufferWidth, gl.drawingBufferHeight]
        }
      };

      ShaderPass.bufferToScreen = new ShaderProgram(
        gl,
        passThroughVert(),
        screenTextureFrag(),
        uniforms,
      );

      ShaderPass.bufferToScreenRect = clipspaceScreenTri(gl);
    }

    return {
      bufferToScreen: ShaderPass.bufferToScreen,
      bufferToScreenRect: ShaderPass.bufferToScreenRect,
    }
  }

  public dispose() {
    this._shaderProgram.dispose();
    this._frameBuffers.forEach((fb) => fb.destroy());
  }
}