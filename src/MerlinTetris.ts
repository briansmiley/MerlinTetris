/// <reference path="../node_modules/@types/p5/global.d.ts" />
//prettier-ignore
import {Game,boardWithFallingBlock,coordinateSum,gameInit,hardDropBlock,miniPreviewBoard,rotateBlock,setAllowedInput,shiftBlock,startGame,tickGravity} from "./Tetris";
import { CONFIG, Coordinate, InputCategory, TetrisShape } from "./TetrisConfig";
import { drawString } from "./pixelText";
import { merlinButton } from "./merlinFunctions";

var upButton = merlinButton(pressUp, "", "ArrowUp");
var downButton = merlinButton(pressDown, "", "ArrowDown");
var leftButton = merlinButton(pressLeft, "", "ArrowLeft");
var rightButton = merlinButton(pressRight, "", "ArrowRight");
var spaceButton = merlinButton(pressSpace, "", " ");
var wButton = merlinButton(pressW, "", "w");
var eButton = merlinButton(pressE, "", "e");
var aButton = merlinButton(pressA, "", "a");
var dButton = merlinButton(pressD, "", "d");
var sButton = merlinButton(pressS, "", "s");
var nButton = merlinButton(pressN, "", "n");
var cButton = merlinButton(pressC, "", "c");
function pressKey(key: string) {
  const binding = keyBindings[key];
  if (!game.allowedInputs[binding.type]) return; //skip input if not allowed
  game = setAllowedInput(binding.callback(game), binding.type, false);
  setTimeout(
    () => (game = setAllowedInput(game, binding.type, true)),
    game.CONFIG.POLL_RATES[binding.type]
  );
}
function pressUp() {
  pressKey("ArrowUp");
}
function pressDown() {
  pressKey("ArrowDown");
}
function pressLeft() {
  pressKey("ArrowLeft");
}
function pressRight() {
  pressKey("ArrowRight");
}
function pressSpace() {
  pressKey(" ");
}
function pressW() {
  pressKey("w");
}
function pressE() {
  pressKey("e");
}
function pressA() {
  pressKey("a");
}
function pressD() {
  pressKey("d");
}
function pressS() {
  pressKey("s");
}
function pressN() {
  game = startGame(game);
}
function pressC() {
  pressKey("c");
}

type KeyBinding = {
  type: InputCategory;
  callback: (prev: Game) => Game;
};
const keyBindings: Record<string, KeyBinding> = {
  w: {
    type: "rotate",
    callback: prevGameState => rotateBlock(prevGameState, "CW")
  },
  e: {
    type: "rotate",
    callback: prevGameState => rotateBlock(prevGameState, "CCW")
  },
  a: {
    type: "shift",
    callback: prevGameState => shiftBlock(prevGameState, "L")
  },
  d: {
    type: "shift",
    callback: prevGameState => shiftBlock(prevGameState, "R")
  },
  s: {
    type: "shift",
    callback: prevGameState => shiftBlock(prevGameState, "D")
  },
  " ": {
    type: "drop",
    callback: prevGameState => hardDropBlock(prevGameState)
  },
  ArrowLeft: {
    type: "shift",
    callback: prevGameState => shiftBlock(prevGameState, "L")
  },
  ArrowRight: {
    type: "shift",
    callback: prevGameState => shiftBlock(prevGameState, "R")
  },
  ArrowUp: {
    type: "rotate",
    callback: prevGameState => rotateBlock(prevGameState, "CW")
  },
  ArrowDown: {
    type: "shift",
    callback: prevGameState => shiftBlock(prevGameState, "D")
  },
  c: {
    type: "hold",
    callback: prevGameState => holdAndPopHeld(prevGameState)
  }
};
let game: Game;
const gameVersion = "0.0.1";
let tickIntervalId: number; //reference to clean up the game clock when tick changes
let prevTickInterval: number; //reference to check when game tick interval changes
const ORIGIN: Coordinate = [4, 10];
const CELL_SIZE = 2;
function setup() {
  createCanvas(44, 66);
  background(0);
  noStroke();
  strokeWeight(1);
  fill(255);
  game = gameInit();
  game = startGame(game);
  tickIntervalId = setInterval(
    () => (game = tickGravity(game)),
    game.tickInterval
  );
  prevTickInterval = game.tickInterval;
}

function draw() {
  background(0);
  drawString(game.score.toString(), ORIGIN[0] - 1, ORIGIN[1] - 3, "white");
  if (game.tickInterval !== prevTickInterval) {
    prevTickInterval = game.tickInterval;
    clearInterval(tickIntervalId);
    tickIntervalId = setInterval(
      () => (game = tickGravity(game)),
      game.tickInterval
    );
  }
  renderGameState(game, ORIGIN, CELL_SIZE);
}

const renderGameState = (game: Game, origin: Coordinate, cellSize: number) => {
  push();
  //draw the board
  const renderableBoard = boardWithFallingBlock(game);
  renderableBoard.forEach((row, y) => {
    row.forEach((cell, x) => {
      const xPos = x * cellSize + origin[0];
      const yPos = y * cellSize + origin[1];
      const colr = cell.type === "shadow" ? "#202020" : cell.color;
      pointRect(xPos, yPos, cellSize, cellSize, colr, true);
    });
  });
  const sidebarOrigin: Coordinate = [
    origin[0] + renderableBoard[0].length * cellSize + 2,
    origin[1]
  ];
  //draw the held shape
  pointRect(
    sidebarOrigin[0],
    sidebarOrigin[1],
    cellSize * 6,
    cellSize * 6,
    CONFIG.WALL_COLOR,
    true,
    false
  );
  const heldShapeOrigin = coordinateSum(sidebarOrigin, [
    cellSize * 3,
    cellSize * 3
  ]);
  if (game.heldShape !== null)
    drawShape(game.heldShape, heldShapeOrigin, cellSize);
  //draw the preview upcoming shapes
  const upcomingOrigin = coordinateSum(sidebarOrigin, [
    cellSize * 3,
    cellSize * 8
  ]);
  const upcomingShapes = game.shapeQueue.slice(0, 3);
  upcomingShapes.forEach((upcomingShapeName, i) => {
    const shapeOrigin = coordinateSum(upcomingOrigin, [0, i * cellSize * 4]);
    drawShape(upcomingShapeName, shapeOrigin, cellSize);
  });
  pop();
};

const drawShape = (
  shape: TetrisShape,
  origin: Coordinate,
  cellSize: number
) => {
  const shapeCoords = CONFIG.BLOCK_SHAPES[shape];
  shapeCoords.forEach(([y, x]) => {
    const xPos = x * cellSize + origin[0];
    const yPos = y * cellSize + origin[1];
    const colr = CONFIG.SHAPE_COLORS[shape];
    pointRect(xPos, yPos, cellSize, cellSize, colr, true);
  });
};
/**manually draw a rectangle using points to avoid rounding
 * floor parameter makes it round down to the nearest pixel to avoid anti-aliasing
 */
const pointRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  colr: number[] | string,
  floor: boolean = false,
  filled: boolean = true
) => {
  //floor x and y if specified
  const [xPos, yPos] = floor ? [Math.floor(x), Math.floor(y)] : [x, y];
  const typeStuffColr = Array.isArray(colr) ? color(colr) : color(colr); //handles splitting the union type for p5 overloading
  loadPixels();
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      if (filled || i === 0 || j === 0 || i === w - 1 || j === h - 1) {
        set(xPos + i, yPos + j, color(typeStuffColr));
      }
    }
  }
  updatePixels();
};

//draft; not sure if this will work yet
const postScore = (
  score: number,
  player_initials: string,
  game_version: string,
  lines_cleared: number
) => {
  fetch("http://merlins.place/api/tetris-score", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      score: score,
      player_initials: player_initials,
      game_version: game_version,
      lines_cleared: lines_cleared
    })
  });
};
