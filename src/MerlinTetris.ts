/// <reference path="../node_modules/@types/p5/global.d.ts" />
//prettier-ignore
import {Game,gameInit,hardDropBlock,rotateBlock,setAllowedInput,shiftBlock,startGame,tickGravity} from "./Tetris";
import { Coordinate, InputCategory } from "./TetrisConfig";
import { drawString } from "./pixelText";

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
function pressKey(key: string) {
  const binding = keyBindings[key];
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

type KeyBinding = {
  type: InputCategory;
  callback: (prev: Game) => Game;
  length?: number;
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
  }
};
let game: Game;
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
  game.board.forEach((row, y) => {
    row.forEach((block, x) => {
      const colr = block ? block : "black";
      const xPos = x * cellSize + origin[0];
      const yPos = y * cellSize + origin[1];
      stroke(colr);
      pointRect(xPos, yPos, cellSize, cellSize, colr, true);
    });
  });
  //draw the falling block
  const fallingBlock = game.fallingBlock;
  if (fallingBlock) {
    fallingBlock.body.forEach((coord, i) => {
      const xPos = cellSize * (coord[1] + fallingBlock.origin[1]) + origin[0];
      const yPos = cellSize * (coord[0] + fallingBlock.origin[0]) + origin[1];
      const colr = game.CONFIG.SHAPE_COLORS[fallingBlock.shape];
      stroke(colr);
      pointRect(xPos, yPos, cellSize, cellSize, colr, true);
    });
  }
  pop();
};

/**manually draw a rectangle using points to avoid rounding
 * floor parameter makes it round down to the nearest pixel to avoid anti-aliasing
 */
const pointRect = (
  x: number,
  y: number,
  w: number,
  h: number,
  colr: string,
  floor: boolean = false
) => {
  //floor x and y if specified
  const [xPos, yPos] = floor ? [Math.floor(x), Math.floor(y)] : [x, y];
  loadPixels();
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      set(xPos + i, yPos + j, color(colr));
    }
  }
  updatePixels();
};
