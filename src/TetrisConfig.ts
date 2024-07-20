export type Config = {
  BLOCK_SHAPES: Record<TetrisShape, Coordinate[]>;
  SPAWN_POINT: Coordinate;
  SHAPE_COLORS: Record<TetrisShape, TetrisColor>;
  WALL_COLOR: TetrisColor;
  BOARD_WIDTH: number;
  BOARD_HEIGHT: number;
  STARTING_TICK_INTERVAL: number;
  SPEED_SCALING: number;
  LEVEL_LINES: number;
  POLL_RATES: Record<InputCategory | "base", number>;
  WALLS: boolean;
  MAX_GRACE_COUNT: number;
};
export type TetrisColor = [number, number, number];

export type Coordinate = [number, number];
export type InputCategory = "rotate" | "shift" | "drop";

export type TetrisShape = "I" | "T" | "O" | "S" | "Z" | "L" | "J";
export const CONFIG: Config = {
  BLOCK_SHAPES: {
    I: [
      [0, -1],
      [0, 0],
      [0, 1],
      [0, 2]
    ],
    T: [
      [0, 0],
      [0, 1],
      [0, -1],
      [-1, 0]
    ],
    O: [
      [0, 0],
      [-1, 0],
      [0, -1],
      [-1, -1]
    ],
    S: [
      [0, 0],
      [-1, 0],
      [0, -1],
      [-1, 1]
    ],
    Z: [
      [0, 0],
      [-1, 0],
      [-1, -1],
      [0, 1]
    ],
    L: [
      [0, 0],
      [0, -1],
      [0, 1],
      [-1, 1]
    ],
    J: [
      [0, 0],
      [0, 1],
      [0, -1],
      [-1, -1]
    ]
  },
  SPAWN_POINT: [0, 5] as Coordinate,
  SHAPE_COLORS: {
    I: [0, 255, 255],
    T: [128, 0, 128],
    O: [255, 255, 0],
    S: [255, 0, 0],
    Z: [0, 255, 0],
    L: [255, 127, 0],
    J: [0, 0, 255]
  },
  WALL_COLOR: [113, 113, 113],
  BOARD_WIDTH: 10,
  BOARD_HEIGHT: 20,
  STARTING_TICK_INTERVAL: 500,
  SPEED_SCALING: 1.25, //step multiplier for game speed increase
  LEVEL_LINES: 8, //how many lines between speed scaling
  POLL_RATES: {
    base: 10,
    drop: 250,
    rotate: 250,
    shift: 70
  },
  WALLS: true,
  MAX_GRACE_COUNT: 5 //maximum number of gravity ticks you can skip settling from by moving
};
