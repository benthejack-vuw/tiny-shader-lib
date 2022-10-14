import {
  AttributeArrayObject,
  AttributeBufferObject,
  Geometry,
  LocationsObject
} from "./types";

const createGeometry = (gl: WebGLRenderingContext, attributeArrays: AttributeArrayObject): Geometry => {
  const buffers: AttributeBufferObject = Object.fromEntries(
    Object.entries(attributeArrays).map(([attribute, data]) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.flat()), gl.STATIC_DRAW);
      return [
        attribute,
        {
          buffer,
          size: data[0].length,
          indices: data.length,
        }
      ];
    })
  ) as AttributeBufferObject;

  const render = (attribBuffers: AttributeBufferObject, locations: LocationsObject) => {
    let indicesToRender;

    Object.entries(attribBuffers).forEach(([attribName, { buffer, size, indices}]) => {
      const location = locations[attribName];
      if((location || location === 0) && location != -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0 );
        if(attribName === 'position') {
          indicesToRender = indices;
        }
      }
    });

    gl.drawArrays(gl.TRIANGLES, 0, indicesToRender);
  }

  return {
    buffers,
    render,
  }
}

export default createGeometry;