/// <reference path="../node_modules/@types/p5/global.d.ts" />
//prettier-ignore
import {Game,boardWithFallingBlock,gameInit,hardDropBlock,rotateBlock,setAllowedInput,shiftBlock,startGame,tickGravity} from "./Tetris";
import { Coordinate, InputCategory, TetrisColor } from "./TetrisConfig";
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
  const renderableBoard = boardWithFallingBlock(game);
  renderableBoard.forEach((row, y) => {
    row.forEach((cell, x) => {
      const xPos = x * cellSize + origin[0];
      const yPos = y * cellSize + origin[1];
      const colr = cell.type === "shadow" ? "#202020" : cell.color;
      pointRect(xPos, yPos, cellSize, cellSize, colr, true);
    });
  });
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
  colr: number[] | string,
  floor: boolean = false
) => {
  //floor x and y if specified
  const [xPos, yPos] = floor ? [Math.floor(x), Math.floor(y)] : [x, y];
  const typeStuffColr = Array.isArray(colr) ? color(colr) : color(colr); //handles splitting the union type for p5 overloading
  loadPixels();
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      set(xPos + i, yPos + j, color(typeStuffColr));
    }
  }
  updatePixels();
};
