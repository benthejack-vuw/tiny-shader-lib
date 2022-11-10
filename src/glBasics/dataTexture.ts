import loadFloatTextureExtensions from './loadFloatTextureExtensions';

type DataItem = number | null | undefined;

const createDataTexture = (gl: WebGLRenderingContext, data: DataItem[][] | DataItem[], width: number, height: number, format?: number) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const gl2 = gl as WebGL2RenderingContext;
  const floatFormats = {
    [gl2.R32F]: gl2.RED,
    [gl2.RG32F]: gl2.RG,
    [gl2.RGB32F]: gl2.RGB,
    [gl2.RGBA32F]: gl2.RGBA,
  }

  if(Object.keys(floatFormats).includes(format.toString())) {
    loadFloatTextureExtensions(gl);
    console.log('Building Float Data Image')

    const dataBuffer = new Float32Array(data.flat().map((num) => num ?? 0));

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      format,
      width,
      height,
      0,
      floatFormats[format],
      gl.FLOAT,
      dataBuffer
    );
  } else {
    const dataBuffer = new Uint8Array(data.flat().map((num) => num ?? 0));

    console.log('Building Uint8 Data Image')

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      dataBuffer
    );
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  // set the filtering so we don't need mips
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

export default createDataTexture;