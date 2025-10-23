export interface Rectangle {
  id: number;
  width: number;
  height: number;
}

export interface PlacedRect extends Rectangle {
  x: number;
  y: number;
  color?: string;
}

export interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PackResult {
  packed: PlacedRect[];
  width: number;
  height: number;
}