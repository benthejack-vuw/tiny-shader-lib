import { BlendMode } from "./glBasics/blending";
import { Geometry } from "./glBasics";
import { Color } from "./math";

export interface RenderOpts {
  renderToScreen?: boolean;
  clear?: boolean;
  blendPixels?: boolean;
  blendMode?: BlendMode;
  geometry?: Geometry;
  clearColor?: Color;
}

export interface Renderable {
  render: (opts?: RenderOpts) => void;
  outputTexture(): WebGLTexture;
  dispose(): void;
}