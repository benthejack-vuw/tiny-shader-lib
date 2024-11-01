import {
  UniformObject,
  UniformType,
  GLListUniformFunc,
  GLVecUniformFunc,
  UniformValue,
  Geometry,
  AttributeBufferObject,
  LocationsObject, UniformValues
} from "./types";

type UniformFunctions = {
  [key in UniformType]: string
};

let uniformFunctions: UniformFunctions = {
    int: 'uniform1i',
    int2: 'uniform2i',
    int3: 'uniform3i',
    int4: 'uniform4i',
    intv: 'uniform1iv',
    int2v: 'uniform2iv',
    int3v: 'uniform3iv',
    int4v: 'uniform4iv',
    float: 'uniform1f',
    float2: 'uniform2f',
    float3: 'uniform3f',
    float4: 'uniform4f',
    floatv: 'uniform1fv',
    float2v: 'uniform2fv',
    float3v: 'uniform3fv',
    float4v: 'uniform4fv',
    texture2D: 'uniform1i',
};

function isIntegerListUniform(type: UniformType){
  return type === 'intv' || type === 'int2v' || type === 'int3v' || type === 'int4v';
}

function isFloatListUniform(type: UniformType){
  return type === 'floatv' || type === 'float2v' || type === 'float3v' || type === 'float4v';
}

function isListUniform(type: UniformType) {
  return isIntegerListUniform(type) || isFloatListUniform(type);
}

export function getUniformType(value?: UniformValue): UniformType {
  if(typeof value === 'undefined') return 'float';

  if(value instanceof WebGLTexture) return 'texture2D';

  const nonTexValue = value as (number | number[] | number[][]);

  if(typeof nonTexValue === 'number') return 'float';

  if (typeof nonTexValue[0] === 'number') {
    return 'floatv';
  }

  return `float${nonTexValue[0].length}v` as UniformType;
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
  private _deleted: boolean = false;

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

    this._attributeLocations = {};

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

    console.error(
      this._gl.getShaderInfoLog(shader),
      source.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n')
    );

    this._gl.deleteShader(shader);
  }

  private buildProgram(vertex: string, fragment: string) {
    const isWebGL2 = this._gl instanceof WebGL2RenderingContext;

    //add defines to make webGL1 shaders work in a webGL2 context
    const globalDefines =
    `#version 300 es
    #define texture2D texture
    `;

    const vertexDefines =
    `#define attribute in
     #define varying out
     `;

    const fragDefines =
    `#define varying in
    layout(location = 0) out highp vec4 pc_fragColor;
    #define gl_FragColor pc_fragColor
    `;

    const vertWebGL2Defines = isWebGL2 ? globalDefines + vertexDefines : ""; 
    const vert = vertWebGL2Defines + vertex;
    const vertexShader = this.createShader(this._gl.VERTEX_SHADER, vert);

    // make sure the fragment shader has a default precision
    const fragHasPrecision = !!fragment.match(/precision [a-z]+ float;/);
    const fragPrecision = fragHasPrecision ? '' : 'precision mediump float;\n';
    const fragWebGL2Defines = isWebGL2 ? globalDefines + fragPrecision + fragDefines : fragPrecision;

    const fragmentShader = this.createShader(
      this._gl.FRAGMENT_SHADER,
      fragWebGL2Defines + fragment
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

  public setUniforms(uniforms: UniformValues) {
    Object.entries(uniforms).forEach(([name, value]) => this.setUniform(name, value));
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

    const uniformType = type || getUniformType(value);

    if(uniformType === 'texture2D') {
      // we update and bind the textures separately in bindTextures();
      return;
    }

    this.bind();

    if(isListUniform(uniformType)) {
      const setUniform =  this._gl[uniformFunctions[uniformType]] as GLListUniformFunc;
      setUniform.call(this._gl, location, data);
      return;
    }

    const args = Array.isArray(value) ? value as number[] : [value] as number[];
    const setUniform =  this._gl[uniformFunctions[uniformType]] as GLVecUniformFunc;
    setUniform.call(this._gl, location, ...args);
  }

  private updateUniforms() {
    Object.keys(this._uniforms).forEach((name) => this.updateUniform(name));
  }

  public get positionLocation() {
    return this._attributeLocations.position;
  }

  public get uvLocation() {
    return this._attributeLocations.uv;
  }

  private bindTextures() {
    Object.values(this._uniforms)
      .filter((uniform) => uniform.type === 'texture2D')
      .forEach((uniform, idx) => {
        this._gl.activeTexture(this._gl.TEXTURE0 + idx);
        this._gl.bindTexture(this._gl.TEXTURE_2D, uniform.value);
        this._gl.uniform1i(uniform.location, idx);
      });
  }

  public bind() {
   if(ShaderProgram.CURRENT !== this && !this._deleted) {
      this._gl.useProgram(this._shaderProgram);
      ShaderProgram.CURRENT = this;
   }
  }

  private updateAttributes(buffers: AttributeBufferObject) {
    Object.entries(buffers).forEach(([attribName]) => {
      if(typeof(this._attributeLocations[attribName]) === 'undefined') {
        this._attributeLocations[attribName] = this._gl.getAttribLocation(this._shaderProgram, attribName);
      }
    })
  }

  public render(geom: Geometry, ) {
    this.bind();
    this.bindTextures();
    this.updateAttributes(geom.buffers);
    geom.render(geom.buffers, this._attributeLocations as LocationsObject);
  }

  public dispose() {
    this._gl.deleteProgram(this._shaderProgram);
    this._deleted = true;
  }
}
