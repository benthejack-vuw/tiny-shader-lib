const loadFloatTextureExtensions = (gl: WebGLRenderingContext) => {
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
}