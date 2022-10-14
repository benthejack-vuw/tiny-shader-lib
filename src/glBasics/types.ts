type RequirePosition<T extends {[key: string]: unknown}> = Omit<T, "position"> & Required<Pick<T, "position">>;

export type AttributeArrayObject = RequirePosition<{
  [key: string]: number[][],
}>

export type Attribute = {
  buffer: WebGLBuffer,
  size: number,
  indices: number,
};

export type AttributeBufferObject = RequirePosition<{
  [key: string]: Attribute,
}>;

export type LocationsObject = RequirePosition<{
  [key: string]: number,
}>;

export type GeometryRenderFunction = (bufferObject: AttributeBufferObject, locations: LocationsObject) => void;
export type Geometry = {
  buffers: AttributeBufferObject,
  render: GeometryRenderFunction,
}

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

export type UniformValue = number | number[] | number[][] | string | string[] | WebGLTexture | null | undefined;

export interface UniformValues {
  [uniformName: string]: UniformValue;
}

export interface UniformObject {
  [uniformName: string]: {
    location?: WebGLUniformLocation,
    type: UniformType,
    value: UniformValue,
    data?: number[];
  }
}


