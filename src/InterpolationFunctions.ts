export type InterpolationFunction = (current: number, start: number, end: number) => number;

export const linearInterpolation: InterpolationFunction = (current: number, start: number, end: number) => (current - start) / (end - start);