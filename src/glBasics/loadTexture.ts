const loadTexture = (gl: WebGLRenderingContext | WebGL2RenderingContext, imageURL: string): Promise<WebGLTexture> => {
  return new Promise((resolve, reject) => {
    const texture = gl.createTexture();

    const image = new Image();
    image.src = imageURL;

    image.addEventListener('load', function() {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      resolve(texture);
    });

    image.addEventListener('error', (e) => reject(`error loading image: ${imageURL}. \n ${e.message}`))
  })
}

export default loadTexture;