import {FBO} from "./glBasics/createFBO.js";
import {blendFunctions, BlendMode, createFBO} from "./glBasics/index.js";
import {Renderable, RenderOpts} from "./types";
import BufferToScreenProgram from "./BufferToScreenProgram.js";
import {UpdateFunctions} from "./UpdateFunctions.js";
import {Color} from "./math/index.js";

export default class RenderBuffer extends UpdateFunctions implements Renderable {
  private _gl: WebGLRenderingContext;
  private _buffer: FBO;
  private _bufferToScreen: BufferToScreenProgram;
  private _width: number;
  private _height: number;

  constructor(gl: WebGLRenderingContext, width?: number, height?: number) {
    super();
    this._gl = gl;
    this._buffer = createFBO(gl, width, height);
    this._width = width || gl.drawingBufferWidth;
    this._height = height || gl.drawingBufferHeight;
  }

  public get renderTarget() {
    return this._buffer;
  }

  public clear(clearColor: Color) {
    this._gl.clearColor(
      clearColor?.r || 0,
      clearColor?.g || 0,
      clearColor?.b || 0,
      clearColor?.a ?? 1
    );

    this._buffer.bind();
    this._gl.viewport(0, 0, this._width, this._height);
    this._gl.clear(this._gl.COLOR_BUFFER_BIT);
  }

  public render(opts: RenderOpts = {}) {
    this.renderTo( null, opts);
  }

  public renderTo(target, {linearFilter = true, clear, clearColor, blendMode}: RenderOpts) {
    this.update();

    if(!this._bufferToScreen) this._bufferToScreen = new BufferToScreenProgram(this._gl);

      const {
        bufferToScreen,
        bufferToScreenRect
      } = this._bufferToScreen.values

      this._gl.bindTexture(this._gl.TEXTURE_2D, this._buffer.texture);

      const bufferBlending = this._gl.getTexParameter(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER);
      this._gl.texParameteri(
        this._gl.TEXTURE_2D,
        this._gl.TEXTURE_MAG_FILTER,
        linearFilter ? this._gl.LINEAR : this._gl.NEAREST
      );

      this._gl.bindFramebuffer(this._gl.FRAMEBUFFER, target?.frameBuffer ?? null);
      this._gl.viewport(
        0,
        0,
        target?.size.width || this._gl.drawingBufferWidth,
        target?.size.height || this._gl.drawingBufferHeight
      );

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
      bufferToScreen.setUniform('map', this._buffer.texture);
      bufferToScreen.setUniform('resolution', [this._gl.drawingBufferWidth, this._gl.drawingBufferHeight]);
      blendFunctions[blendMode ?? BlendMode.NORMAL](this._gl);

      bufferToScreen.render(bufferToScreenRect);

      this._gl.texParameteri(
        this._gl.TEXTURE_2D,
        this._gl.TEXTURE_MAG_FILTER,
        bufferBlending
      );
  }

  public outputTexture(): WebGLTexture {
    return this._buffer.texture;
  }

  public dispose() {
    this._buffer.destroy();
  }
}