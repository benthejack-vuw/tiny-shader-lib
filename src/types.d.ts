export interface Renderable {
  render: (renderToScreen?: boolean) => void;
  outputTexture(): WebGLTexture;
}