import createTexture from './createTexture';

type FrameBufferBindFn = () => void;

export interface FBO {
  bind: FrameBufferBindFn,
  frameBuffer: WebGLFramebuffer,
  texture: WebGLTexture,
  destroy(): void,
}

const createFBO = (gl: WebGLRenderingContext, width?: number, height?: number, dataType?: number): FBO => {
  const frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  const actualWidth = width || gl.canvas.clientWidth;
  const actualHeight = height || gl.canvas.clientHeight;

  // attach the texture as the first color attachment
  const texture = createTexture(gl, actualWidth, actualHeight, dataType);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  return {
    bind: () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
      gl.viewport(0, 0, actualWidth, actualHeight);
    },
    frameBuffer,
    texture,
    destroy: () => {
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(frameBuffer);
    }
  };
}

export default createFBO;