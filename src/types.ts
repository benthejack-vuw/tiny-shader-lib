import { BlendMode } from "./glBasics/blending";
import {GeometryRenderFunction} from "./glBasics";
import {Color} from "./math";

export interface RenderOpts {
  renderToScreen?: boolean;
  clear?: boolean;
  blendPixels?: boolean;
  blendMode?: BlendMode;
  geomRenderFunction?: GeometryRenderFunction;
  clearColor?: Color;
}

export interface Renderable {
  render: (opts?: RenderOpts) => void;
  outputTexture(): WebGLTexture;
}