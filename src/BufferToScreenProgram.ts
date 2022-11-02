import {clipspaceScreenTri, Geometry, ShaderProgram, UniformObject} from "./glBasics/index.js";
import {passThroughVert, screenTextureFrag} from "./shaders/index.js";

class BufferToScreenProgram {
  private bufferToScreen?: ShaderProgram;
  private bufferToScreenRect?: Geometry;

  constructor(gl: WebGLRenderingContext) {
    const uniforms: UniformObject = {
      map: {
        type: 'texture2D',
        value: null,
      },
      resolution: {
        type: 'float2',
        value: [gl.drawingBufferWidth, gl.drawingBufferHeight]
      },
      glResolution: {
        type: 'float2',
        value: [gl.drawingBufferWidth, gl.drawingBufferHeight]
      }
    };

    this.bufferToScreen = new ShaderProgram(
      gl,
      passThroughVert(),
      screenTextureFrag(),
      uniforms,
    );

    this.bufferToScreenRect = clipspaceScreenTri(gl);
  }

  public get values() {
    return {
      bufferToScreen: this.bufferToScreen,
      bufferToScreenRect: this.bufferToScreenRect,
    }
  }
}

export default BufferToScreenProgram;