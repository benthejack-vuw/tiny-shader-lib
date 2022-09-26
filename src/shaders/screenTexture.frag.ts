const screenTextureFrag = () => `
  uniform vec2 resolution;
  uniform sampler2D map;
  
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    gl_FragColor = texture2D(map, uv);
  }
`;

export default screenTextureFrag;