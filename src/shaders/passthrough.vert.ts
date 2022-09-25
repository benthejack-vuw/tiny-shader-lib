const passthroughVert = () => `  
    attribute vec3 position;
    attribute vec2 uv;
    
    varying vec2 vUv; 
    
    void main() {
      gl_Position = vec4(position, 1.0);
      vUv = uv;
    }
`;

export default passthroughVert;