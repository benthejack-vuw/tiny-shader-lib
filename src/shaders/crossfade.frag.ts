const crossfadeFrag = () => `
  uniform float time;
  uniform sampler2D from; 
  uniform sampler2D to;
  uniform vec2 resolution; 
    
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec4 colFrom = texture2D(from, uv);
    vec4 colTo = texture2D(to, uv);
    gl_FragColor = mix(colFrom, colTo, time);
  }
`;

export default crossfadeFrag;