import Vec from "./Vector";

export default class Color extends Vec {
  constructor(...args: (number | string)[]) {
    if(typeof(args[0]) === 'string') {
      super(0, 0, 0, 1);
      this.setFromHex(args[0]);
    } else {
      if(args.length >= 4) {
        super(...args as number[]);
      } else {
        super(
          args[0] as number || 0,
          args[1] as number || 0,
          args[2] as number || 0,
          1
        );
      }
    }
  }

  public get r() {
    return this.x;
  }

  public set r(r: number) {
    this._data[0] = r;
  }

  public get g() {
    return this.y;
  }

  public set g(g: number) {
    this._data[1] = g;
  }

  public get b() {
    return this.z;
  }

  public set b(b: number) {
    this._data[2] = b;
  }

  public get a() {
    return this.w;
  }

  public set a(a: number) {
    this._data[3] = a;
  }

  public setFromHex(hex: string) {
      // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
      });

      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if(result) {
        this.r = parseInt(result[1], 16)/255;
        this.g = parseInt(result[2], 16)/255;
        this.b = parseInt(result[3], 16)/255;
        this.a = 1;
        return;
      }

      throw new Error(`'${hex}' is not a valid hex string`)
  }

  public toLinear() {
    this.r = SRGBToLinear(this.r);
    this.g = SRGBToLinear(this.g);
    this.b = SRGBToLinear(this.b);
    return this;
  }

  public toSRGB() {
    this.r = LinearToSRGB(this.r);
    this.g = LinearToSRGB(this.g);
    this.b = LinearToSRGB(this.b);
    return this;
  }
}

export function SRGBToLinear( c ) {
  return ( c < 0.04045 ) ? c * 0.0773993808 : Math.pow( c * 0.9478672986 + 0.0521327014, 2.4 );
}

export function LinearToSRGB( c ) {
  return ( c < 0.0031308 ) ? c * 12.92 : 1.055 * ( Math.pow( c, 0.41666 ) ) - 0.055;
}