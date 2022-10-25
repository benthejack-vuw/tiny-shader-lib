const createTexture = (gl: WebGLRenderingContext | WebGL2RenderingContext, width?: number, height?: number, textureType?: number) => {
  const type = typeof(textureType) === 'undefined' ? gl.UNSIGNED_BYTE : textureType;

  const texture = gl.createTexture();
  const TextureWidth = width || gl.drawingBufferWidth;
  const TextureHeight = height || gl.drawingBufferHeight;

  gl.bindTexture(gl.TEXTURE_2D, texture);

  if(textureType === gl.FLOAT) {
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      alert("need EXT_color_buffer_float");
      return;
    }

    const lin = gl.getExtension('OES_texture_float_linear');
    if(!lin) {
      alert("need OES_texture_float_linear");
      return;
    }

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      (gl as WebGL2RenderingContext).RGBA32F,
      TextureWidth,
      TextureHeight,
      0,
      gl.RGBA,
      gl.FLOAT,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  } else {
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  // set the filtering so we don't need mips
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

export default createTexture;