export enum BlendMode {
  NORMAL,
  TRANSPARENT,
  ADD,
  MULTIPLY,
}

export type BlendFunctions = {
  [key in BlendMode]: (gl: WebGLRenderingContext) => void;
}

export const blendFunctions: BlendFunctions = {
  [BlendMode.NORMAL]: (gl: WebGLRenderingContext) => {
    gl.disable(gl.BLEND);
  },
  [BlendMode.TRANSPARENT]: (gl: WebGLRenderingContext) => {
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  },
  [BlendMode.ADD]: (gl: WebGLRenderingContext) => {
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.ONE, gl.ONE);
  },
  [BlendMode.MULTIPLY]: (gl: WebGLRenderingContext) => {
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
  },
}