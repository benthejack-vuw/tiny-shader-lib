import { GeometryRenderFunction } from "./types";

const clipspaceScreenTri = (gl: WebGLRenderingContext): GeometryRenderFunction => {
  const positions = new Float32Array([
    -1.0, -1.0, 0.0,
    3.0, -1.0, 0.0,
    -1.0, 3.0, 0.0,
  ]);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return (positionAttribLocation: number) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionAttribLocation);
    gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, 0, 0 );
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
};

export default clipspaceScreenTri;