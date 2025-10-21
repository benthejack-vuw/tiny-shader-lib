import {
  blendFunctions,
  BlendMode,
  createFBO,
  Geometry,
  ShaderProgram,
  UniformValues
} from "./glBasics/index.js";
import {UniformObject, UniformValue} from "./glBasics/types.js";
import {FBO} from "./glBasics/createFBO.js";
import {Renderable, RenderOpts} from "./index.js";
import {Color} from "./math/index.js";
import {UpdateFunctions} from "./UpdateFunctions.js";
import BufferToScreenProgram from "./BufferToScreenProgram.js";

export type ShaderPassOpts = {
  doubleBuffer?: boolean;
  width?: number;
  height?: number;
  dataType?: number;
} & Partial<RenderOpts>;

export default class ShaderPass extends UpdateFunctions implements Renderable {
  private _gl: WebGLRenderingContext;
  private _shaderProgram: ShaderProgram;
  private _geom: Geometry;
  private _frameBuffers?: FBO[];
  private _currentFrameBuffer: number = 0;
  private _opts: ShaderPassOpts;
  private _bufferToScreen?: BufferToScreenProgram;

  constructor(
    gl: WebGLRenderingContext,
    vertexShader: string,
    fragmentShader: string,
    geometry: Geometry,
    uniforms: UniformObject = {},
    opts: ShaderPassOpts = {
      doubleBuffer: false
    }
  ) {
    super();
    this._opts = opts;
    this._gl = gl;

    //this._opts.doubleBuffer = fragmentShader.includes('backBuffer') || this._opts.doubleBuffer;

    const uniformsWithResolution: UniformObject = {
      ...uniforms,
      resolution: {
        type: 'float2',
        value: this.size
      },
      glResolution: {
        type: 'float2',
        value: [gl.drawingBufferWidth, gl.drawingBufferHeight]
      },
      //add backBuffer uniform if the doubleBuffer parameter is set
      ...(
      opts.doubleBuffer
        ? {
            backBuffer: {
              type: 'texture2D',
              value: null,
            }
          }
        : {}
      )
    }

    this._shaderProgram = new ShaderProgram(gl, vertexShader, fragmentShader, uniformsWithResolution);
    this._geom = geometry;

    this.buildFrameBuffers();
  }

  public resize(width: number, height: number) {
    this._opts.width = width;
    this._opts.height = height;
    this._shaderProgram.setUniform(
      'resolution',
      this.size,
    );
    this._frameBuffers.forEach((fb) => fb.destroy());
    this.buildFrameBuffers();
  }

  public setBufferTextureParam(parameter: GLenum, value: GLint) {
    this._frameBuffers.forEach((fbo) => {
      this._gl.bindTexture(this._gl.TEXTURE_2D, fbo.texture);
      this._gl.texParameteri(this._gl.TEXTURE_2D, parameter, value);
    });
  }

  public get size() {
    return [
      Math.ceil(this._opts.width || (this._gl.canvas as HTMLCanvasElement).clientWidth),
      Math.ceil(this._opts.height || (this._gl.canvas as HTMLCanvasElement).clientHeight)
    ];
  }

  public get renderOpts() {
    return this._opts;
  }

  public get currentBuffer() {
    return this._frameBuffers[this._currentFrameBuffer];
  }

  private buildFrameBuffers() {
    const { width, height, doubleBuffer } = this._opts;

    this._frameBuffers = [];
    this._frameBuffers.push(createFBO(this._gl, width, height, this._opts.dataType))

    if(doubleBuffer) {
      this._frameBuffers.push(createFBO(this._gl, width, height, this._opts.dataType))
    }
  }

  public outputTexture = () => {
    // get the last rendered buffer
    return this._frameBuffers[(this._currentFrameBuffer + 1) % this._frameBuffers.length].texture;
  }

  public linkPassToUniform( shaderPass: Renderable, uniformName: string ) {
    this.addUpdateFunction(() => {
      this._shaderProgram.setUniform(uniformName, shaderPass.outputTexture());
    });
  }

  public getUniform(uniform: string) {
    return this._shaderProgram.getUniform(uniform)
  }

  public setUniform(uniform: string, value: UniformValue) {
    return this._shaderProgram.setUniform(uniform, value);
  }

  public setUniforms(uniformValues: UniformValues) {
    return this._shaderProgram.setUniforms(uniformValues);
  }

  public clear(clearColor: Color) {
    this._gl.clearColor(
      clearColor?.r || 0,
      clearColor?.g || 0,
      clearColor?.b || 0,
      clearColor?.a ?? 1
    );

    this._frameBuffers.forEach((fb) => {
      fb.bind();
      this._gl.viewport(0, 0, this.size[0], this.size[1]);
      this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    });
  }

  public render(opts: RenderOpts = {}) {
    // rendering options passed in here override ones set at creation time
    const {
      renderToScreen,
      blendMode,
      clear,
      clearColor,
      geometry,
      linearFilter,
      renderTarget
    }: ShaderPassOpts  = {
      ...this._opts,
      ...opts,
    }

    this.update();

    // set blend mode
    if(!renderToScreen) {
      if(typeof blendMode === 'function') {
        blendMode();
      } else {
        blendFunctions[blendMode ?? BlendMode.NORMAL](this._gl);
      }
    }

    if(clear) {
      this.clear(clearColor);
    }

    const target = renderTarget || this.currentBuffer;
    this._shaderProgram.setUniform('resolution', [target.size.width, target.size.height]);
    this._shaderProgram.setUniform('glResolution', [this._gl.drawingBufferWidth, this._gl.drawingBufferHeight]);

    target.bind();
    this._shaderProgram.render(geometry ?? this._geom);

    // swap buffers if double buffering
    if(this._opts.doubleBuffer) {
      this._shaderProgram.setUniform('backBuffer', this._frameBuffers[this._currentFrameBuffer].texture);
      this._currentFrameBuffer = (this._currentFrameBuffer + 1) % 2;
    }

    if(renderToScreen) {
      this.renderToScreen({linearFilter, clear, clearColor, blendMode, geometry});
    }
  }

  public renderTo(target: FBO, opts?: RenderOpts) {
    this.render({...opts, renderTarget: target});
  }

  public renderToScreenAtCanvasResolution() {
    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    this._gl.viewport(0, 0, this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);
    this._shaderProgram.setUniformAround(
      'resolution',
      [this._gl.drawingBufferWidth, this._gl.drawingBufferHeight],
      () => this._shaderProgram.render(this._geom)
    );
  }

  private renderToScreen({linearFilter = true, clear, clearColor, blendMode}: RenderOpts) {
    if(!this._bufferToScreen) this._bufferToScreen = new BufferToScreenProgram(this._gl);

    const {
      bufferToScreen,
      bufferToScreenRect
    } = this._bufferToScreen.values

    const currentTexture = this.outputTexture();
    this._gl.bindTexture(this._gl.TEXTURE_2D, currentTexture);

    const bufferBlending = this._gl.getTexParameter(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER);
    this._gl.texParameteri(
      this._gl.TEXTURE_2D,
      this._gl.TEXTURE_MAG_FILTER,
      linearFilter ? this._gl.LINEAR : this._gl.NEAREST
    );

    this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, null);
    this._gl.viewport(0, 0, this._gl.drawingBufferWidth, this._gl.drawingBufferHeight);

    if(clear) {
      this._gl.clearColor(
        clearColor?.r || 0,
        clearColor?.g || 0,
        clearColor?.b || 0,
        clearColor?.a ?? 1
      );
      this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    }

    bufferToScreen.bind();
    bufferToScreen.setUniform('map', currentTexture);
    bufferToScreen.setUniform('resolution', [this._gl.drawingBufferWidth, this._gl.drawingBufferHeight]);
    if(typeof blendMode === 'function') {
      blendMode();
    } else {
      blendFunctions[blendMode ?? BlendMode.NORMAL](this._gl);
    }
    bufferToScreen.render(bufferToScreenRect);

    this._gl.texParameteri(
      this._gl.TEXTURE_2D,
      this._gl.TEXTURE_MAG_FILTER,
      bufferBlending
    );
  }

  public dispose() {
    this._shaderProgram.dispose();
    this._frameBuffers.forEach((fb) => fb.destroy());
  }
}
