import {
  blendFunctions,
  BlendMode,
  clipspaceScreenTri,
  createFBO,
  Geometry,
  ShaderProgram,
  UniformValues
} from "./glBasics/index.js";
import {UniformObject, UniformValue} from "./glBasics/types.js";
import {FBO} from "./glBasics/createFBO.js";
import {Renderable, RenderOpts} from "./index.js";
import {passThroughVert, screenTextureFrag} from "./shaders/index.js";
import {Color} from "./math/index.js";
import {UpdateFunctions} from "./UpdateFunctions.js";

type ShaderPassOpts = {
  doubleBuffer?: boolean;
  width?: number;
  height?: number;
  dataType?: number;
} & Partial<RenderOpts>;

export default class ShaderPass extends UpdateFunctions implements Renderable {
  private bufferToScreen?: ShaderProgram;
  private bufferToScreenRect?: Geometry;

  private _gl: WebGLRenderingContext;
  private _shaderProgram: ShaderProgram;
  private _geom: Geometry;
  private _frameBuffers?: FBO[];
  private _currentFrameBuffer: number = 0;
  private _opts: ShaderPassOpts;

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
    return this._frameBuffers[this._currentFrameBuffer].texture;
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
      blendPixels,
      renderBuffer
    }: ShaderPassOpts  = {
      ...this._opts,
      ...opts,
    }

    this.update();

    if(this._opts.doubleBuffer) {
      this._shaderProgram.setUniform('backBuffer', this._frameBuffers[this._currentFrameBuffer].texture);
      this._currentFrameBuffer = (this._currentFrameBuffer + 1) % 2;
    }

    // set blend mode
    if(!renderToScreen) {
      blendFunctions[blendMode ?? BlendMode.NORMAL](this._gl);
    }

    if(clear) {
      this.clear(clearColor);
    }

    (renderBuffer ?? this._frameBuffers[this._currentFrameBuffer]).bind();
    this._shaderProgram.render(geometry ?? this._geom);

    if(renderToScreen) {
      this.renderToScreen({blendPixels, clear, clearColor, blendMode, geometry});
    }
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

  private renderToScreen({blendPixels = true, clear, clearColor, blendMode, geometry}: RenderOpts) {
    const {
      bufferToScreen,
      bufferToScreenRect
    } = this.bufferToScreenProgram(this._gl);

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
    blendFunctions[blendMode ?? BlendMode.NORMAL](this._gl);
    bufferToScreen.render(bufferToScreenRect);

    this._gl.texParameteri(
      this._gl.TEXTURE_2D,
      this._gl.TEXTURE_MAG_FILTER,
      bufferBlending
    );
  }

  private bufferToScreenProgram(gl: WebGLRenderingContext) {
    if(!this.bufferToScreen) {
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

      this.bufferToScreen = new ShaderProgram(
        gl,
        passThroughVert(),
        screenTextureFrag(),
        uniforms,
      );

      this.bufferToScreenRect = clipspaceScreenTri(gl);
    }

    return {
      bufferToScreen: this.bufferToScreen,
      bufferToScreenRect: this.bufferToScreenRect,
    }
  }

  public dispose() {
    this._shaderProgram.dispose();
    this._frameBuffers.forEach((fb) => fb.destroy());
  }
}