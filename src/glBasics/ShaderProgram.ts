interface createShaderProgramOpts {
  gl: WebGLRenderingContext,
  vertex: string,
  fragment: string
}

interface UniformObject {
  [uniformName: string]: { value: unknown }
}

export default class ShaderProgram {
  private _gl: WebGLRenderingContext;
  private _shaderProgram: WebGLProgram;
  private _uniformLocations: { [key: string]: number };

  constructor(gl: WebGLRenderingContext, vertex: string, fragment: string, uniforms: UniformObject) {
    this._gl = gl;
    this._shaderProgram = this.buildProgram(vertex, fragment);
    this._uniformLocations = Object.fromEntries(
      Object.keys(uniforms)
        .map(( uniformName ) => (
          [uniformName, this._gl.getAttribLocation(this._shaderProgram, uniformName)]
        ))
    );
  }

  private createShader(type: number, source: string) {
    const shader = this._gl.createShader(type);
    this._gl.shaderSource(shader, source);
    this._gl.compileShader(shader);
    var success = this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }

    console.error(this._gl.getShaderInfoLog(shader));
    this._gl.deleteShader(shader);
  }

  private buildProgram(vertex: string, fragment: string) {
    const vertexShader = this.createShader(this._gl.VERTEX_SHADER, vertex);
    const fragmentShader = this.createShader(this._gl.FRAGMENT_SHADER, fragment);

    const program = this._gl.createProgram();
    this._gl.attachShader(program, vertexShader);
    this._gl.attachShader(program, fragmentShader);
    this._gl.linkProgram(program);

    const success = this._gl.getProgramParameter(program, this._gl.LINK_STATUS);
    if (success) {
      return program;
    }

    console.error(this._gl.getProgramInfoLog(program));
    this._gl.deleteProgram(program);
  }

}
