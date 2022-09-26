export type GeometryRenderFunction = (positionAttributeLocation: number, uvAttributeLocation?: number) => void;

export type IntegerListUniformType =
  'intv' | 'int2v' | 'int3v' | 'int4v';

export type FloatListUniformType =
  'floatv' | 'float2v' | 'float3v' | 'float4v';

export type ListUniformType = IntegerListUniformType | FloatListUniformType;

export type UniformType =
  'int' | 'int2' | 'int3' | 'int4' |
  'float' | 'float2' | 'float3' | 'float4' |
  ListUniformType |
  'texture2D';

export type GLListUniformFunc = ((loc: WebGLUniformLocation, items: number[]) => void);
export type GLVecUniformFunc = ((loc: WebGLUniformLocation, ...rest: number[]) => void)

export type GLUniformFunc =
  GLVecUniformFunc |
  GLListUniformFunc;

export type UniformValue = number | number[] | number[][] | WebGLTexture;

export interface UniformObject {
  [uniformName: string]: {
    location?: WebGLUniformLocation,
    type: UniformType,
    value: UniformValue,
    data?: number[];
  }
}


