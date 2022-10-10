export default class Vector {
  protected _data: number[];

  constructor(...args: number[]) {
    this._data = args;
  }

  public get x() {
    return this._data[0] || 0;
  }

  public set x(x: number) {
    this._data[0] = x
  }

  public get y() {
    return this._data[1] || 0;
  }

  public set y(y: number) {
    this._data[1] = y
  }

  public get z() {
    return this._data[2] || 0;
  }

  public set z(z: number) {
    this._data[2] = z
  }

  public get w() {
    return this._data[3] || 0;
  }

  public set w(w: number) {
    this._data[3] = w;
  }

  public set(...args: number[]) {
    args?.forEach((val, idx) => this._data[idx] = val);
    return this;
  }

  public copy(other: Vector) {
    const longest = Vector.mostComponents(this, other);
    longest.data.forEach((_, idx) => this._data[idx] = other.data[idx] || 0);
    return this;
  }

  public add(other: Vector) {
    this._data.forEach((itm, idx) => this._data[idx] = itm + (other.data[idx] || 0));
    return this;
  }

  public static add(one: Vector, two: Vector) {
    const longest = Vector.mostComponents(one, two);
    return longest.data.map((_, idx) => (one[idx] || 0) + (two[idx] || 0));
  }

  public sub(other: Vector) {
    this._data.forEach((itm, idx) => this._data[idx] = itm - (other.data[idx] || 0));
    return this;
  }

  public static sub(one: Vector, two: Vector) {
    const longest = Vector.mostComponents(one, two);
    return longest.data.map((_, idx) => (one[idx] || 0) - (two[idx] || 0));
  }

  public mult(other: Vector) {
    this._data.forEach((itm, idx) => this._data[idx] = itm * (other.data[idx] || 0));
    return this;
  }

  public static mult(one: Vector, two: Vector) {
    const longest = Vector.mostComponents(one, two);
    return longest.data.map((_, idx) => (one[idx] || 0) * (two[idx] || 0));
  }

  public divide(other: Vector) {
    this._data.forEach((itm, idx) => this._data[idx] = itm / (other.data[idx] || 0));
    return this;
  }

  public static divide(one: Vector, two: Vector) {
    const longest = Vector.mostComponents(one, two);
    return longest.data.map((_, idx) => (one[idx] || 0) / (two[idx] || 0));
  }

  public dot(other: Vector) {
    return this._data.reduce(
      (total, itm, idx) => total + itm * (other.data[idx] || 0),
    0);
  }

  public static cross(one: Vector, two: Vector) {
    return new Vector(
      one.y * two.z - one.z * two.y,
      one.z * two.x - one.x * two.z,
      one.x * two.y - one.y * two.x,
    );
  }

  public dist(other: Vector) {
    return Math.sqrt(
      this._data.reduce((sum, _, idx) => {
        const val = this._data[idx] - (other[idx] || 0);
        return sum + val * val
      }, 0)
    );
  }

  public normalize() {
    const mag = this.magnitude();
    this._data.forEach((itm, idx) => this._data[idx] = itm / mag);
  }

  public magnitude() {
    return Math.sqrt(
      this._data.reduce((sum, curr) => sum + curr * curr , 0)
    )
  }

  public get data() {
    return this._data;
  }

  public get components() {
    return this._data.length;
  }

  public static mostComponents(one: Vector, two: Vector) {
    return one.components >= two.components ? one : two;
  }
}