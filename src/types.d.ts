export interface RenderOpts {
  renderToScreen: boolean;
  blendPixels?: boolean;
}

export interface Renderable {
  render: (opts?: RenderOpts) => void;
  outputTexture(): WebGLTexture;
}