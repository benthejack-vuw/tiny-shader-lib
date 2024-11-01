export default class GLCanvas {
  private _gl;
  private _timeout;

  constructor(canvasElement: HTMLCanvasElement | string) {
    const canvas = typeof(canvasElement) === "string"
      ? document.getElementById(canvasElement) as HTMLCanvasElement
      : canvasElement;

    this._gl = canvas.getContext('webgl2', {
      premultipliedAlpha: false  // Ask for non-premultiplied alpha
    });

    if(!this._gl) {
      throw new Error('webGL is not supported or turned off in this browser');
    }

    const resizeObserver = new ResizeObserver(this.debounceResize.bind(this));
    resizeObserver.observe(this._gl.canvas, {box: 'content-box'});
    this.resizeCanvasToDisplaySize();
  }

  public get gl() {
    return this._gl;
  }

  public resizeCanvasToDisplaySize() {
    var width = this._gl.canvas.clientWidth;
    var height = this._gl.canvas.clientHeight;
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