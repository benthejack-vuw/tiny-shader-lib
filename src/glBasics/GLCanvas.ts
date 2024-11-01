type GLCanvasOpts = {
 canvasElement: HTMLCanvasElement | string,
 webGLVersion?: "webgl" | "webgl2",
 webGLOpts?: WebGLContextAttributes 
}

export default class GLCanvas {
  private _gl: WebGLRenderingContext;
  private _timeout: number;

  constructor({canvasElement, webGLVersion = 'webgl2', webGLOpts}: GLCanvasOpts) {
    const canvas = typeof(canvasElement) === "string"
      ? document.getElementById(canvasElement) as HTMLCanvasElement
      : canvasElement;

    this._gl = canvas.getContext(webGLVersion ?? 'webgl2', {
      ...webGLOpts,
    }) as WebGLRenderingContext;

    if(!this._gl) {
      throw new Error('webGL is not supported or turned off in this browser');
    }

    const resizeObserver = new ResizeObserver(this.debounceResize.bind(this));
    resizeObserver.observe(this._gl.canvas as HTMLCanvasElement, {box: 'content-box'});
    this.resizeCanvasToDisplaySize();
  }

  public get gl() {
    return this._gl;
  }

  public resizeCanvasToDisplaySize() {
    var width = (this._gl.canvas as HTMLCanvasElement).clientWidth;
    var height = (this._gl.canvas as HTMLCanvasElement).clientHeight;
    if (this._gl.canvas.width != width ||
      this._gl.canvas.height != height) {
      this._gl.canvas.width = width;
      this._gl.canvas.height = height;
    }
  }

  public debounceResize() {
    if(this._timeout) clearTimeout(this._timeout);
    this._timeout = setTimeout(this.resizeCanvasToDisplaySize.bind(this), 250);
  }
};
