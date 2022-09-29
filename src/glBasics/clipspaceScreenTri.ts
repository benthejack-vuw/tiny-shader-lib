import { AttributeArrayObject } from "./types";
import createGeometry from "./createGeometry";

const clipspaceScreenTri = (gl: WebGLRenderingContext) => {
  const attribs: AttributeArrayObject = {
    position: [
      [-1.0, -1.0, 0.0],
      [3.0, -1.0, 0.0],
      [-1.0, 3.0, 0.0],
    ]};

  return createGeometry(gl, attribs);
};

export default clipspaceScreenTri;