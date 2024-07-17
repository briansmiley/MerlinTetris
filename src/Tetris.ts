import { CONFIG } from "./TetrisConfig";
//prettier-ignore
import type {Config,Coordinate,TetrisShape,InputCategory} from "./TetrisConfig";
/**
 * Types
 */

export type Game = {
  board: Board;
  fallingBlock: Block | null;
  score: number;
  linesCleared: number;
  blocksSpawned: number;
  tickInterval: number;
  clock: number;
  over: boolean;
  allowedInputs: Record<InputCategory, boolean>;
  groundGracePeriod: {
    protected: boolean;
    counter: number;
  };
  CONFIG: Config;
};
export type Cell = string | null;
export type Board = Cell[][];
type Block = {
  origin: Coordinate;
  body: Coordinate[];
  shape: TetrisShape;
};
export type Direction = "U" | "L" | "R" | "D";
export type RotDirection = "CW" | "CCW";
type ConditionalNull<argType, nonNullArgType, returnType> =
  argType extends nonNullArgType ? returnType : null;
/**
 * Data
 */

/**
 * Functions
 */

/**GAME_FLOW */

/**creates a new blank slate game object; requires a call to spawnNewBlock() to create first falling block */
export const gameInit = (): Game => {
  return {
    board: newBlankBoard(),
    fallingBlock: null,
    score: 0,
    linesCleared: 0,
    blocksSpawned: 0,
    tickInterval: CONFIG.STARTING_TICK_INTERVAL,
    clock: 0,
    over: false,
    allowedInputs: { rotate: true, shift: true, drop: true },
    groundGracePeriod: {
      protected: false,
      counter: 0
    },
    CONFIG: CONFIG
  };
};
const newEmptyRow = (): Cell[] => {
  const row = Array(CONFIG.BOARD_WIDTH).fill(null);
  return CONFIG.WALLS
    ? [CONFIG.WALL_COLOR].concat(row).concat([CONFIG.WALL_COLOR])
    : row;
};
const newBlankBoard = (): Board => {
  const newBoard = [...Array(CONFIG.BOARD_HEIGHT)].map(() => newEmptyRow());
  return CONFIG.WALLS
    ? newBoard.concat([Array(CONFIG.BOARD_WIDTH + 2).fill(CONFIG.WALL_COLOR)])
    : newBoard;
};
export const setTickInterval = (game: Game, newInterval: number): Game => ({
  ...game,
  tickInterval: newInterval
});
export const setAllowedInput = (
  game: Game,
  input: InputCategory,
  state: boolean
): Game => {
  const newGame = { ...game };
  newGame.allowedInputs[input] = state;
  return newGame;
};
//
// const incrementGameSpeed = (game: Game): Game => ({
//   ...game,
//   tickInterval: game.tickInterval * (1 / 1 + CONFIG.SPEED_SCALING)
// });

const endGame = (game: Game): Game => ({ ...game, over: true });
export const startGame = (game: Game): Game =>
  game.blocksSpawned === 0
    ? spawnNewBlock(game)
    : game.over
    ? spawnNewBlock(gameInit())
    : game;
const spawnNewBlock = (game: Game): Game => {
  const [spawnR, spawnC] = CONFIG.SPAWN_POINT;
  const newBlock = newFallingBlock();
  if (blockIntersectsSettledOrWalls(game.board, newBlock)) return endGame(game);
  if (game.board[spawnR][spawnC]) return endGame(game);
  return {
    ...game,
    fallingBlock: newFallingBlock(),
    blocksSpawned: game.blocksSpawned + 1,
    tickInterval:
      CONFIG.STARTING_TICK_INTERVAL /
      CONFIG.SPEED_SCALING **
        Math.floor(game.linesCleared / CONFIG.LEVEL_LINES),
    groundGracePeriod: {
      protected: false,
      counter: 0
    }
  };
};
const isNotNull = <T>(arg: T | null): arg is T => arg !== null;
// const isPartOfShape = (cell: Cell) =>
//   cell === null ? false : Object.values(CONFIG.SHAPE_COLORS).includes(cell);
const coordinateSum = (c1: Coordinate, c2: Coordinate): Coordinate => {
  return [c1[0] + c2[0], c1[1] + c2[1]];
};
//gets the on-board coordinates of all of a block's cells
const blockOccupiedCells = <T extends Block | null>(
  block: T
): ConditionalNull<T, Block, Coordinate[]> => {
  return block === null
    ? (null as ConditionalNull<T, Block, Coordinate[]>)
    : (block.body.map(cell =>
        coordinateSum(cell, block.origin)
      ) as ConditionalNull<T, Block, Coordinate[]>);
};
/**Checks if a coordinate is off the screen; to allow poking over top of board, check that separately */
const isOffScreen = (coord: Coordinate, board: Board): boolean => {
  return (
    coord[0] < 0 ||
    coord[0] > board.length - 1 ||
    coord[1] < 0 ||
    coord[1] > board[0].length - 1
  );
};
//checks whether a proposed block position will be a collision
const blockIntersectsSettledOrWalls = (board: Board, block: Block | null) => {
  const occupiedCells = blockOccupiedCells(block);
  if (occupiedCells === null) return false;
  return occupiedCells.some(
    boardLocation =>
      boardLocation[0] >= 0 && //if we are above the board we arent checking anything
      (isOffScreen(boardLocation, board) || //(should only happen in walless mode; disallow if goes offscreen)
        board[boardLocation[0]][boardLocation[1]]) //interaction if board is occupied
  );
};
//get the next spawnable block, currently at random

/**For later: The NES Tetris randomizer is super basic. Basically it rolls an 8 sided die, 1-7 being the 7 pieces
 *  and 8 being "reroll". If you get the same piece as the last piece you got, or you hit the reroll number, It'll
 * roll a 2nd 7 sided die. This time you can get the same piece as your previous one and the roll is final. */
const getNewBlockShape = (): TetrisShape => {
  const keys = Object.keys(CONFIG.BLOCK_SHAPES) as Array<
    keyof typeof CONFIG.BLOCK_SHAPES
  >;
  return keys[(keys.length * Math.random()) << 0];
};

/**
 * Creates a falling block at the top of the board (overwrites any current falling block)
 */
const newFallingBlock = (): Block => {
  const shape = getNewBlockShape();
  const body = CONFIG.BLOCK_SHAPES[shape];
  const newBlock: Block = {
    origin: CONFIG.SPAWN_POINT,
    shape,
    body
  };
  return newBlock;
};

/** Locks the game's fallingBlock into place as part of the board*/
const settleBlockAndSpawnNew = (game: Game): Game => {
  const [oldBoard, fallenBlock] = [game.board, game.fallingBlock];
  if (fallenBlock === null) return game;
  const fallenBlockEndCoords = blockOccupiedCells(fallenBlock);
  const newColor = CONFIG.SHAPE_COLORS[fallenBlock.shape];
  const newBoard = structuredClone(oldBoard);
  fallenBlockEndCoords.forEach(
    coord =>
      !isOffScreen(coord, newBoard) && (newBoard[coord[0]][coord[1]] = newColor)
  );
  return spawnNewBlock({ ...game, board: newBoard });
};

/**
 * moves the game's falling block down on square, or settles it if doing so would intersect
 */
export const tickGravity = (game: Game): Game => {
  const newGame = clearThenCollapseRows(game);
  if (newGame.fallingBlock === null) return newGame;
  const nextBlock = shiftedBlock(newGame.fallingBlock, "D");
  //if we are on the ground...)
  if (blockOnGround(game))
    //prevent settling if the grace period bool is true and hasnt been reset more than the MAX COUNT number of times
    return game.groundGracePeriod.protected &&
      game.groundGracePeriod.counter < CONFIG.MAX_GRACE_COUNT
      ? {
          ...game,
          groundGracePeriod: {
            protected: false,
            counter: game.groundGracePeriod.counter + 1
          }
        }
      : //otherwise settle and spawn new
        settleBlockAndSpawnNew(newGame);
  return clearFullRowsAndScore(
    collapseGapRows({ ...newGame, fallingBlock: nextBlock }) //NOTE THINK ABOUT THE GAME FLOW HERE?
  );
};

/** SCORING/CLEAR  EVENTS */

/**A row is full if it contains no nulls and is not entirely wall (i.e. the floor)*/
const rowIsFull = (row: Cell[]) =>
  row.every(isNotNull) && !row.every(cell => cell === CONFIG.WALL_COLOR);
const rowIsEmpty = (row: Cell[]) =>
  !rowIncludesBlock(row) && !row.every(cell => cell === CONFIG.WALL_COLOR);
/**Row has at least one cell that matches SHAPE_COLORS */
const rowIncludesBlock = (row: Cell[]) =>
  row.some(cell => cell && Object.values(CONFIG.SHAPE_COLORS).includes(cell));
/** Gets a list of the indices of full rows on the board */
const fullRows = (board: Board): number[] => {
  return board
    .map((row, rowIndex) => (rowIsFull(row) ? rowIndex : null))
    .filter(isNotNull);
};

/**Clears out filled rows and increments score/lines cleared*/
export const clearFullRowsAndScore = (game: Game): Game => {
  const { board } = game;
  const rowsToClear = fullRows(board);
  return {
    ...game,
    score: game.score + clearedLinesScore(rowsToClear.length),
    linesCleared: game.linesCleared + rowsToClear.length,
    board: board.map((row, r) =>
      rowsToClear.includes(r) ? newEmptyRow() : structuredClone(row)
    )
  };
};

const clearedLinesScore = (lines: number): number => {
  return [0, 40, 100, 300, 1200][lines];
};

/**Settle the board squares above a clear by an amount equal to the clear*/
export const collapseGapRows = (game: Game): Game => {
  const { board } = game;
  const firstNonEmptyRowIndex = board.findIndex(rowIncludesBlock);
  if (firstNonEmptyRowIndex === -1) return game;
  //indices of the empty rows below the topmost nonempty row
  const emptyRowIndices = board
    .map((row, rowIndex) =>
      !rowIsEmpty(row) && rowIndex >= firstNonEmptyRowIndex ? null : rowIndex
    )
    .filter(isNotNull);
  let newBoard = structuredClone(board);
  //for each empty row index, splice out that row in newBoard and then put a new empty row on top; this should let the rest of the indices keep working as expected
  emptyRowIndices.forEach(rowIndex => {
    newBoard.splice(rowIndex, 1);
    newBoard = [newEmptyRow()].concat(newBoard);
  });
  return { ...game, board: newBoard };
};
/** Clears any full rows and simultaneously collapses them */
export const clearThenCollapseRows = (game: Game): Game =>
  collapseGapRows(clearFullRowsAndScore(game));
/** INPUT RESPONSES */

const rotatedBlock = <T extends Block | null>(
  block: T,
  direction: RotDirection
): ConditionalNull<T, Block, Block> =>
  block === null
    ? (null as ConditionalNull<T, Block, Block>)
    : ({
        ...block,
        body: block.body.map(coord =>
          direction === "CW"
            ? ([coord[1], -coord[0]] as Coordinate)
            : ([-coord[1], coord[0]] as Coordinate)
        )
      } as ConditionalNull<T, Block, Block>);

// /**Tells us if a block is on the ground (i.e. one more gravity tick would settle it)*/
const blockOnGround = (game: Game): boolean =>
  game.fallingBlock !== null &&
  blockIntersectsSettledOrWalls(
    game.board,
    shiftedBlock(game.fallingBlock, "D")
  );
/**Grants the falling block protection against being settled by gravity because it was just moved (gets removed by one gravity tick)*/
const grantGrace = (game: Game): Game => ({
  ...game,
  groundGracePeriod: { ...game.groundGracePeriod, protected: true }
});
/** Rotates a block 90° CW | CCW about its origin */
export const rotateBlock = (game: Game, direction: RotDirection): Game => {
  if (game.fallingBlock === null || game.fallingBlock.shape === "O")
    return game;
  const newBlock = rotatedBlock(game.fallingBlock, direction);
  //if the rotated block intersects the board or walls, try shifting it one or two spaces in every direction and pick the first that works. Otherwise return with no rotation
  if (blockIntersectsSettledOrWalls(game.board, newBlock)) {
    const directions: Direction[] = ["R", "L", "U", "D"];
    for (const shiftDir of directions) {
      for (const distance of [1, 2]) {
        const shiftCandidate = shiftedBlock(newBlock, shiftDir, distance);
        //return as soon as we find a shift that makes the rotation work (and set grace to true)
        if (!blockIntersectsSettledOrWalls(game.board, shiftCandidate))
          return grantGrace({ ...game, fallingBlock: shiftCandidate });
      }
    }
    //if no shifts worked, return game as is
    return game;
  }
  //if we dont intersect, return the game with a rotated block
  return grantGrace({
    ...game,
    fallingBlock: newBlock
  });
};

/**Takes in a block and returns one shifted in the argument direction */
const shiftedBlock = (
  block: Block,
  direction: Direction,
  distance: number = 1
): Block => {
  const transforms: Record<Direction, Coordinate> = {
    L: [0, -distance],
    R: [0, distance],
    U: [-distance, 0],
    D: [distance, 0]
  };
  return {
    ...block,
    origin: coordinateSum(block.origin, transforms[direction])
  };
};

/**Shifts the game's falling block one unit L | R | D */
export const shiftBlock = (game: Game, direction: Direction): Game => {
  if (game.fallingBlock === null) return game;
  const nextBlock = shiftedBlock(game.fallingBlock, direction, 1);
  return blockIntersectsSettledOrWalls(game.board, nextBlock)
    ? direction === "D"
      ? settleBlockAndSpawnNew(game)
      : game
    : grantGrace({ ...game, fallingBlock: nextBlock });
};
/**Drops a block all the way to the settled pile settles it into the board*/
export const hardDropBlock = (game: Game): Game => {
  if (game.fallingBlock === null || game.over) return game;
  const coords = blockOccupiedCells(game.fallingBlock);
  const highestRowInBlock = coords.reduce(
    (prev, curr) => Math.min(curr[0], prev),
    game.board.length
  );
  //get the index of the row containing a column's highest occupied cell (that is below the top of the block)
  const colFloorIndex = (column: number) => {
    const floorIndex = game.board.findIndex(
      (row, idx) => idx > highestRowInBlock && isNotNull(row[column])
    );

    return floorIndex === -1 ? game.board.length : floorIndex; //if floorIndex is -1 we didnt find a non-null row so the floor is the board end
  };
  //map the current falling block's cells to their distances from (1 cell above) the floor in their column
  const heights = coords!.map(
    ([row, column]) => colFloorIndex(column) - 1 - row
  );
  const distanceToDrop = Math.min(...heights);
  const newBlock = shiftedBlock(game.fallingBlock, "D", distanceToDrop);
  return settleBlockAndSpawnNew({ ...game, fallingBlock: newBlock });
};

/** Returns a board containing the fallingBlock cells filled in for rendering purposes */
export const boardWithFallingBlock = (game: Game): Board => {
  const { fallingBlock, board } = game;
  const occupiedCells = blockOccupiedCells(fallingBlock);
  if (occupiedCells === null) return board;
  return board.map((row, r) =>
    row.map((cell, c) =>
      occupiedCells.some(coord => coord[0] === r && coord[1] === c)
        ? CONFIG.SHAPE_COLORS[fallingBlock!.shape]
        : cell
    )
  );
};
