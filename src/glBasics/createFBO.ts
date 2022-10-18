import createTexture from './createTexture.js';

type FrameBufferBindFn = () => void;

export interface FBO {
  bind: FrameBufferBindFn,
  frameBuffer: WebGLFramebuffer,
  texture: WebGLTexture,
  destroy(): void,
  size: { width: number, height: number },
}

const createFBO = (gl: WebGLRenderingContext, width?: number, height?: number, dataType?: number): FBO => {
  const frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
  const actualWidth = width || gl.drawingBufferWidth;
  const actualHeight = height || gl.drawingBufferHeight;

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
    },
    size: {
      width: actualWidth,
      height: actualHeight,
    }
  };
}

export default createFBO;