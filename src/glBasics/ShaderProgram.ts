import {
  GeometryRenderFunction,
  UniformObject,
  UniformType,
  GLUniformFunc,
  GLListUniformFunc,
  IntegerListUniformType,
  FloatListUniformType, ListUniformType, GLVecUniformFunc, UniformValue
} from "./types";

type UniformFunctions = {
  [key in UniformType]: GLUniformFunc
};

let uniformFunctions: UniformFunctions;

function isIntegerListUniform(type: UniformType){
  return type === 'intv' || type === 'int2v' || type === 'int3v' || type === 'int4v';
}

function isFloatListUniform(type: UniformType){
  return type === 'floatv' || type === 'float2v' || type === 'float3v' || type === 'float4v';
}

function isListUniform(type: UniformType){
  return isIntegerListUniform(type) || isFloatListUniform(type);
}

function convertArrayToData({ value, type }: { value: number[][], type: ListUniformType }){
  return value.flat();
}

function listData({ value, type }: { value: UniformValue, type: UniformType }) {
    if(isListUniform(type)) {
      return (value as number[][]).flat();
    }
}

export default class ShaderProgram {
  private static CURRENT: ShaderProgram;
  private _gl: WebGLRenderingContext;
  private _shaderProgram: WebGLProgram;
  private _uniforms: UniformObject;
  private _attributeLocations: { [key: string]: number };
  private _updateUniforms: boolean;

  constructor(gl: WebGLRenderingContext, vertex: string, fragment: string, uniforms: UniformObject = {}) {
    this._gl = gl;
    this._shaderProgram = this.buildProgram(vertex, fragment);

    this._uniforms = Object.fromEntries(
      Object.entries(uniforms)
        .map(( [uniformName, value] ) => (
          [uniformName, {
            ...value,
            location: this._gl.getUniformLocation(this._shaderProgram, uniformName),
            data: listData(value),
          }]
        ))
    );


    this._updateUniforms = true;

    this._attributeLocations = {
      position: gl.getAttribLocation(this._shaderProgram, 'position'),
      uv:       gl.getAttribLocation(this._shaderProgram, 'uv'),
    }

    if(!uniformFunctions) {
      uniformFunctions = {
        int: gl.uniform1i,
        int2: gl.uniform2i,
        int3: gl.uniform3i,
        int4: gl.uniform4i,
        intv: gl.uniform1iv,
        int2v: gl.uniform2iv,
        int3v: gl.uniform3iv,
        int4v: gl.uniform4iv,
        float: gl.uniform1f,
        float2: gl.uniform2f,
        float3: gl.uniform3f,
        float4: gl.uniform4f,
        floatv: gl.uniform1fv,
        float2v: gl.uniform2fv,
        float3v: gl.uniform3fv,
        float4v: gl.uniform4fv,
        texture2D: gl.uniform1i,
      };
    }

    this.updateUniforms();
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

    //add defines to make webGL1 shaders work in a webGL2 context
    const globalDefines =
    `#version 300 es
    #define attribute in
    #define varying out
    #define texture2D texture`;

    const fragDefines = `
    layout(location = 0) out highp vec4 pc_fragColor;
    #define gl_FragColor pc_fragColor
    `;

    const vertexShader = this.createShader(this._gl.VERTEX_SHADER, globalDefines + vertex);

    // make sure the fragment shader has a default precision
    const fragHasPrecision = !!fragment.match(/precision [a-z]+ float;/);
    const fragWithPrecision = fragHasPrecision ? fragment : 'precision mediump float;\n' + fragment;


    const fragmentShader = this.createShader(
      this._gl.FRAGMENT_SHADER,
      globalDefines + fragDefines + fragWithPrecision
    );

    if(!vertexShader || !fragmentShader) {
      return;
    }

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

  public setUniformAround(uniformName: string, value: UniformValue, around: () => void) {
    const prevValue = this.getUniform(uniformName);

    this.setUniform(
      uniformName,
      value,
    );

    around();

    this.setUniform(
      uniformName,
      prevValue,
    );
  }

  public setUniform(uniformName: string, value: UniformValue) {
    if(typeof(this._uniforms[uniformName]) === 'undefined') {
      throw new Error(`the uniform ${uniformName} was not added when creating the shader program`);
    }

    this._uniforms[uniformName].value = value;
    this._uniforms[uniformName].data = listData(this._uniforms[uniformName]);

    this.updateUniform(uniformName);
  }

  public getUniform(uniformName: string) {
    return this._uniforms[uniformName].value;
  }

  private updateUniform(uniformName: string) {
    if(!this._uniforms[uniformName]) {
      console.warn(`trying to update uniform '${uniformName}' that doesnt exist`);
      return;
    }

    const {type, value, location, data} = this._uniforms[uniformName];
    if(type === 'texture2D') {
      // we update and bind the textures separately in bindTextures();
      return;
    }

    this.bind();

    if(isListUniform(type)) {
      const setUniform =  uniformFunctions[type] as GLListUniformFunc;
      setUniform.call(this._gl, location, data);
      return;
    }

    const args = Array.isArray(value) ? value as number[] : [value] as number[];
    const setUniform =  uniformFunctions[type] as GLVecUniformFunc;
    setUniform.call(this._gl, location, ...args);
  }

  private updateUniforms() {
    Object.keys(this._uniforms).forEach((name) => this.updateUniform(name));
    this._updateUniforms = false;
  }

  public get positionLocation() {
    return this._attributeLocations.position;
  }

  public get uvLocation() {
    return this._attributeLocations.uv;
  }

  private bindTextures() {
    Object.entries(this._uniforms)
      .filter(([key, uniform]) => uniform.type === 'texture2D')
      .forEach(([key, uniform], idx) => {
        this._gl.activeTexture(this._gl.TEXTURE0 + idx);
        this._gl.bindTexture(this._gl.TEXTURE_2D, uniform.value);
        this._gl.uniform1i(uniform.location, idx);
      });
  }

  public bind() {
    if(ShaderProgram.CURRENT !== this) {
      this._gl.useProgram(this._shaderProgram);
      ShaderProgram.CURRENT = this;
    }
  }

  public render(geomRenderFn: GeometryRenderFunction) {
    this.bind();
    this.bindTextures();
    geomRenderFn(this._attributeLocations.position, this._attributeLocations.uv);
  }

  public dispose() {
    this._gl.deleteProgram(this._shaderProgram);
  }
}
