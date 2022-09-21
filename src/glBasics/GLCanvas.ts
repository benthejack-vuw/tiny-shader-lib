export default class OrthoGLCanvas {
  private _gl;

  constructor(canvasElement: HTMLCanvasElement | string) {
    const canvas = typeof(canvasElement) === "string"
      ? document.getElementById(canvasElement) as HTMLCanvasElement
      : canvasElement;

    this._gl = canvas.getContext('webgl');
    if(!this._gl) {
      throw new Error('webGL is not supported or turned off in this browser');
    }
  }
};