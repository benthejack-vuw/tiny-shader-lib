import { BlendMode, Geometry } from "./glBasics/index";
import { Color } from "./math/index";
import { FBO } from "./glBasics/createFBO";

export interface RenderOpts {
  renderToScreen?: boolean;
  renderTarget?: FBO;
  clear?: boolean;
  linearFilter?: boolean;
  blendMode?: BlendMode;
  geometry?: Geometry;
  clearColor?: Color;
}

export interface Renderable {
  render: (opts?: RenderOpts) => void;
  renderTo: (target: FBO, opts?: RenderOpts) => void;
  outputTexture(): WebGLTexture;
  dispose(): void;
  addUpdateFunction(fn: () => void): void;
  removeUpdateFunction(fn: () => void): void;
}