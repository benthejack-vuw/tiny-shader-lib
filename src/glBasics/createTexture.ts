const createTexture = (gl: WebGLRenderingContext | WebGL2RenderingContext, width?: number, height?: number, textureType?: number) => {
  const type = typeof(textureType) === 'undefined' ? gl.UNSIGNED_BYTE : textureType;

  const texture = gl.createTexture();
  const TextureWidth = width || gl.drawingBufferWidth;
  const TextureHeight = height || gl.drawingBufferHeight;

  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    TextureWidth,
    TextureHeight,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );

  // set the filtering so we don't need mips
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

export default createTexture;