"use strict";
/// <reference path="../node_modules/@types/p5/global.d.ts" />
//prettier-ignore
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
function pressKey(key) {
    const binding = keyBindings[key];
    if (!game.allowedInputs[binding.type])
        return; //skip input if not allowed
    game = setAllowedInput(binding.callback(game), binding.type, false);
    setTimeout(() => (game = setAllowedInput(game, binding.type, true)), game.CONFIG.POLL_RATES[binding.type]);
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
const keyBindings = {
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
let game;
const gameVersion = "0.0.1";
let tickIntervalId; //reference to clean up the game clock when tick changes
let prevTickInterval; //reference to check when game tick interval changes
const ORIGIN = [4, 10];
const CELL_SIZE = 2;
function setup() {
    createCanvas(44, 66);
    background(0);
    noStroke();
    strokeWeight(1);
    fill(255);
    game = gameInit();
    game = startGame(game);
    tickIntervalId = setInterval(() => (game = tickGravity(game)), game.tickInterval);
    prevTickInterval = game.tickInterval;
}
function draw() {
    background(0);
    drawString(game.score.toString(), ORIGIN[0] - 1, ORIGIN[1] - 3, "white");
    if (game.tickInterval !== prevTickInterval) {
        prevTickInterval = game.tickInterval;
        clearInterval(tickIntervalId);
        tickIntervalId = setInterval(() => (game = tickGravity(game)), game.tickInterval);
    }
    renderGameState(game, ORIGIN, CELL_SIZE);
}
const renderGameState = (game, origin, cellSize) => {
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
    const sidebarOrigin = [
        origin[0] + renderableBoard[0].length * cellSize + 2,
        origin[1]
    ];
    //draw the held shape
    pointRect(sidebarOrigin[0], sidebarOrigin[1], cellSize * 6, cellSize * 6, CONFIG.WALL_COLOR, true, false);
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
const drawShape = (shape, origin, cellSize) => {
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
const pointRect = (x, y, w, h, colr, floor = false, filled = true) => {
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
const postScore = (score, player_initials, game_version, lines_cleared) => {
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
const SHAPE_NAMES = ["I", "T", "O", "S", "Z", "L", "J"];
const CONFIG = {
    BLOCK_SHAPES: {
        I: [
            [0, -2],
            [0, -1],
            [0, 0],
            [0, 1]
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
    SPAWN_POINT: [0, 5],
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
        shift: 70,
        hold: 1000000 //hold allowance is handled by the hold/spawn block functions
    },
    WALLS: true,
    MAX_GRACE_COUNT: 5 //maximum number of gravity ticks you can skip settling from by moving
};
/**
 * Data
 */
/**
 * Functions
 */
/**creates a new blank slate game object; requires a call to spawnNewBlock() to create first falling block */
const gameInit = () => {
    return {
        board: newBlankBoard(),
        fallingBlock: null,
        shapeQueue: [...newShapeBag(), ...newShapeBag()],
        heldShape: null,
        score: 0,
        linesCleared: 0,
        blocksSpawned: 0,
        tickInterval: CONFIG.STARTING_TICK_INTERVAL,
        over: false,
        allowedInputs: { rotate: true, shift: true, drop: true, hold: true },
        groundGracePeriod: {
            protected: false,
            counter: 0
        },
        CONFIG: CONFIG
    };
};
const newEmptyCell = () => ({ color: [0, 0, 0], type: "empty" });
const newWallCell = () => ({
    color: [...CONFIG.WALL_COLOR],
    type: "wall"
});
const newEmptyRow = () => {
    const row = Array(CONFIG.BOARD_WIDTH).fill(newEmptyCell());
    return CONFIG.WALLS ? [newWallCell()].concat(row).concat(newWallCell()) : row;
};
const newBlankBoard = () => {
    const newBoard = [...Array(CONFIG.BOARD_HEIGHT)].map(() => newEmptyRow());
    return CONFIG.WALLS
        ? newBoard.concat([Array(CONFIG.BOARD_WIDTH + 2).fill(newWallCell())])
        : newBoard;
};
const setTickInterval = (game, newInterval) => ({
    ...game,
    tickInterval: newInterval
});
const setAllowedInput = (game, input, state) => ({
    ...game,
    allowedInputs: { ...game.allowedInputs, [input]: state }
});
//
// const incrementGameSpeed = (game: Game): Game => ({
//   ...game,
//   tickInterval: game.tickInterval * (1 / 1 + CONFIG.SPEED_SCALING)
// });
const endGame = (game) => ({ ...game, over: true });
const startGame = (game) => game.blocksSpawned === 0
    ? spawnNewBlock(game)
    : game.over
        ? spawnNewBlock(gameInit())
        : game;
const newBlockFromShape = (shape) => ({
    origin: CONFIG.SPAWN_POINT,
    shape: shape,
    body: CONFIG.BLOCK_SHAPES[shape]
});
/**Does nothing more less than pop a shape off the next queue and start it falling */
const spawnNewBlock = (game) => {
    // pop the next shape off the queue
    const newBlockShape = game.shapeQueue[0];
    const newBlock = newBlockFromShape(newBlockShape);
    const newQueue = game.shapeQueue
        .slice(1)
        .concat(game.shapeQueue.length < 8 ? newShapeBag() : []); //
    if (blockIntersectsSettledOrWalls(game.board, newBlock))
        return endGame(game);
    if (boardCoordIsOccupied(game.board, CONFIG.SPAWN_POINT))
        return endGame(game);
    return {
        ...game,
        fallingBlock: {
            self: newBlock,
            dropLocation: hardDropEndOrigin(game.board, newBlock)
        },
        shapeQueue: newQueue,
        blocksSpawned: game.blocksSpawned + 1,
        tickInterval: CONFIG.STARTING_TICK_INTERVAL /
            CONFIG.SPEED_SCALING **
                Math.floor(game.linesCleared / CONFIG.LEVEL_LINES),
        allowedInputs: { ...game.allowedInputs, hold: true }, //turn on holding once we spawn a new block (hold function manually turns this off after a swap)
        groundGracePeriod: {
            protected: false,
            counter: 0
        }
    };
};
const isNotNull = (arg) => arg !== null;
// const isPartOfShape = (cell: Cell) =>
//   cell === null ? false : Object.values(CONFIG.SHAPE_COLORS).includes(cell);
const coordinateSum = (c1, c2) => {
    return [c1[0] + c2[0], c1[1] + c2[1]];
};
//gets the on-board coordinates of all of a block's cells
const blockOccupiedCells = (block) => {
    return block === null
        ? null
        : block.body.map(cell => coordinateSum(cell, block.origin));
};
/**Checks if a coordinate is off the screen; to allow poking over top of board, check that separately */
const isOffScreen = (coord, board) => {
    return (coord[0] < 0 ||
        coord[0] > board.length - 1 ||
        coord[1] < 0 ||
        coord[1] > board[0].length - 1);
};
//check whether a board location is occupied by a block or wall
const boardCoordIsOccupied = (board, coord) => cellIsOccupied(board[coord[0]][coord[1]]);
const cellIsOccupied = (cell) => ["block", "wall"].includes(cell.type);
//checks whether a proposed block position will be a collision
const blockIntersectsSettledOrWalls = (board, block) => {
    const occupiedCells = blockOccupiedCells(block);
    if (occupiedCells === null)
        return false;
    return occupiedCells.some(boardLocation => boardLocation[0] >= 0 && //if we are above the board we arent checking anything
        (isOffScreen(boardLocation, board) || //(should only happen in walless mode; disallow if goes offscreen)
            boardCoordIsOccupied(board, boardLocation)) //interaction if board is occupied
    );
};
//get the next spawnable block, currently at random
/**Deprecated fully random enxt shape algorithm*/
// const getRandomNewBlockShape = (): TetrisShape => {
//   //just a random block every
//   const keys = Object.keys(CONFIG.BLOCK_SHAPES) as Array<
//     keyof typeof CONFIG.BLOCK_SHAPES
//   >;
//   return keys[(keys.length * Math.random()) << 0];
// };
/**Create/replace the bag of shapes abvailable to pick the next block in the queue from */
const newShapeBag = () => {
    // Create a well-shuffled copy of SHAPE_NAMES
    const shuffledShapes = [...SHAPE_NAMES];
    for (let i = shuffledShapes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledShapes[i], shuffledShapes[j]] = [
            shuffledShapes[j],
            shuffledShapes[i]
        ];
    }
    // Assign the shuffled array to the game's shapeBag
    return shuffledShapes;
};
/** Locks the game's fallingBlock into place as part of the board*/
const settleBlockAndSpawnNew = (game) => {
    const [oldBoard, fallenBlock] = [game.board, game.fallingBlock];
    if (fallenBlock === null)
        return game;
    const fallenBlockEndCoords = blockOccupiedCells(fallenBlock.self);
    const newColor = CONFIG.SHAPE_COLORS[fallenBlock.self.shape];
    const newBoard = structuredClone(oldBoard);
    fallenBlockEndCoords.forEach(coord => !isOffScreen(coord, newBoard) &&
        (newBoard[coord[0]][coord[1]] = { color: newColor, type: "block" }));
    return spawnNewBlock({ ...game, board: newBoard });
};
/**
 * moves the game's falling block down on square, or settles it if doing so would intersect
 */
const tickGravity = (game) => {
    const newGame = clearThenCollapseRows(game);
    if (newGame.fallingBlock === null)
        return newGame;
    const nextBlock = shiftedBlock(newGame.fallingBlock.self, "D");
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
    return clearFullRowsAndScore(collapseGapRows({
        ...newGame,
        fallingBlock: {
            ...newGame.fallingBlock,
            self: nextBlock,
            dropLocation: hardDropEndOrigin(newGame.board, nextBlock)
        }
    }) //NOTE THINK ABOUT THE GAME FLOW HERE?
    );
};
/** SCORING/CLEAR  EVENTS */
/**A row is full if it contains no nulls and is not entirely wall (i.e. the floor)*/
const rowIsFull = (row) => row.every(cellIsOccupied) && !row.every(cell => cell.type === "wall");
const rowIsEmpty = (row) => !rowIncludesBlock(row) && !row.every(cell => cell.type === "wall");
/**Row has at least one cell that matches SHAPE_COLORS */
const rowIncludesBlock = (row) => row.some(cell => cell.type === "block");
/** Gets a list of the indices of full rows on the board */
const fullRows = (board) => {
    return board
        .map((row, rowIndex) => (rowIsFull(row) ? rowIndex : null))
        .filter(isNotNull);
};
/**Clears out filled rows and increments score/lines cleared*/
const clearFullRowsAndScore = (game) => {
    const { board } = game;
    const rowsToClear = fullRows(board);
    return {
        ...game,
        score: game.score + clearedLinesScore(rowsToClear.length),
        linesCleared: game.linesCleared + rowsToClear.length,
        board: board.map((row, r) => rowsToClear.includes(r) ? newEmptyRow() : structuredClone(row))
    };
};
const clearedLinesScore = (lines) => {
    return [0, 40, 100, 300, 1200][lines];
};
/**Settle the board squares above a clear by an amount equal to the clear*/
const collapseGapRows = (game) => {
    const { board } = game;
    const firstNonEmptyRowIndex = board.findIndex(rowIncludesBlock);
    if (firstNonEmptyRowIndex === -1)
        return game;
    //indices of the empty rows below the topmost nonempty row
    const emptyRowIndices = board
        .map((row, rowIndex) => !rowIsEmpty(row) && rowIndex >= firstNonEmptyRowIndex ? null : rowIndex)
        .filter(isNotNull);
    let newBoard = structuredClone(board);
    //for each empty row index, splice out that row in newBoard and then put a new empty row on top; this should let the rest of the indices keep working as expected
    emptyRowIndices.forEach(rowIndex => {
        newBoard.splice(rowIndex, 1);
        newBoard = [newEmptyRow()].concat(newBoard);
    });
    const newFallingBlock = game.fallingBlock
        ? {
            ...game.fallingBlock,
            dropLocation: hardDropEndOrigin(newBoard, game.fallingBlock.self)
        }
        : null;
    return { ...game, board: newBoard, fallingBlock: newFallingBlock };
};
/** Clears any full rows and simultaneously collapses them */
const clearThenCollapseRows = (game) => collapseGapRows(clearFullRowsAndScore(game));
/** INPUT RESPONSES */
const rotatedBlock = (block, direction) => block === null
    ? null
    : {
        ...block,
        body: block.body.map(coord => direction === "CW"
            ? [coord[1], -coord[0]]
            : [-coord[1], coord[0]])
    };
// /**Tells us if a block is on the ground (i.e. one more gravity tick would settle it)*/
const blockOnGround = (game) => game.fallingBlock !== null &&
    blockIntersectsSettledOrWalls(game.board, shiftedBlock(game.fallingBlock.self, "D"));
/**Grants the falling block protection against being settled by gravity because it was just moved (gets removed by one gravity tick)*/
const grantGrace = (game) => ({
    ...game,
    groundGracePeriod: { ...game.groundGracePeriod, protected: true }
});
/** Rotates a block 90° CW | CCW about its origin */
const rotateBlock = (game, direction) => {
    if (game.fallingBlock === null || game.fallingBlock.self.shape === "O")
        return game;
    const newBlock = rotatedBlock(game.fallingBlock.self, direction);
    //if the rotated block intersects the board or walls, try shifting it one or two spaces in every direction and pick the first that works. Otherwise return with no rotation
    if (blockIntersectsSettledOrWalls(game.board, newBlock)) {
        const directions = ["R", "L", "U", "D"];
        for (const shiftDir of directions) {
            for (const distance of [1, 2]) {
                const shiftCandidate = shiftedBlock(newBlock, shiftDir, distance);
                //return as soon as we find a shift that makes the rotation work (and set grace to true)
                if (!blockIntersectsSettledOrWalls(game.board, shiftCandidate))
                    return grantGrace({
                        ...game,
                        fallingBlock: {
                            self: shiftCandidate,
                            dropLocation: hardDropEndOrigin(game.board, shiftCandidate)
                        }
                    });
            }
        }
        //if no shifts worked, return game as is
        return game;
    }
    //if we dont intersect, return the game with a rotated block
    return grantGrace({
        ...game,
        fallingBlock: {
            self: newBlock,
            dropLocation: hardDropEndOrigin(game.board, newBlock)
        }
    });
};
/**Takes in a block and returns one shifted in the argument direction */
const shiftedBlock = (block, direction, distance = 1) => {
    const transforms = {
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
/**Add current falling piece to the heldShape slot; spawns next block popped either from held slot or the queue if it's the first held piece*/
const holdAndPopHeld = (game) => {
    //if there is no falling block, do nothing
    if (game.fallingBlock === null)
        return game;
    //If there is no held shape, we hold the current falling block then spawn a new block as usual
    let newGame;
    if (game.heldShape === null)
        newGame = spawnNewBlock({
            ...game,
            heldShape: game.fallingBlock.self.shape
        });
    //Otherwise:
    //return a game state where we spawn a new block having just shifted the held shape onto the head of the queue
    else
        newGame = spawnNewBlock({
            ...game,
            heldShape: game.fallingBlock.self.shape, //previous falling shape is now held
            shapeQueue: [game.heldShape, ...game.shapeQueue] //previously held shape is now popped off the queue by spawnNewBlock
        });
    return setAllowedInput(newGame, "hold", false); //disable hold until next piece
};
/**Shifts the game's falling block one unit L | R | D */
const shiftBlock = (game, direction) => {
    if (game.fallingBlock === null)
        return game;
    const nextBlock = shiftedBlock(game.fallingBlock.self, direction, 1);
    return blockIntersectsSettledOrWalls(game.board, nextBlock)
        ? game
        : grantGrace({
            ...game,
            fallingBlock: {
                self: nextBlock,
                dropLocation: hardDropEndOrigin(game.board, nextBlock)
            }
        });
};
/**Returns the block that would result from a hypothetical hard drop */
const hardDropEndOrigin = (board, fallingBlock) => {
    if (fallingBlock === null)
        return [0, 0];
    const coords = blockOccupiedCells(fallingBlock);
    //the highest row occupied by the falling block
    const highestRowInBlock = coords.reduce((prev, curr) => Math.min(curr[0], prev), board.length);
    //for a given column, get the index of the row containing a column's highest occupied cell (that is below the top of the block)
    const colFloorIndex = (column) => {
        const floorIndex = board.findIndex((row, idx) => idx > highestRowInBlock && cellIsOccupied(row[column]));
        return floorIndex === -1 ? board.length : floorIndex; //if floorIndex is -1 we didnt find a non-null row so the floor is the board end
    };
    //map the current falling block's cells to their distances from (1 cell above) the floor in their column
    const heights = coords.map(([row, column]) => colFloorIndex(column) - row - 1);
    //drop distance is the minimum of these heights
    const distanceToDrop = Math.min(...heights);
    return [fallingBlock.origin[0] + distanceToDrop, fallingBlock.origin[1]];
};
/**Drops a block all the way to the settled pile settles it into the board*/
const hardDropBlock = (game) => {
    if (game.fallingBlock === null || game.over)
        return game;
    const newBlockOrigin = hardDropEndOrigin(game.board, game.fallingBlock.self); //get the position of a hard drop
    const newBlock = {
        ...game.fallingBlock,
        self: { ...game.fallingBlock.self, origin: newBlockOrigin }
    };
    return settleBlockAndSpawnNew({ ...game, fallingBlock: newBlock }); //move the falling block to that end position, settle, and spawn new
};
/** Returns a board containing the fallingBlock cells filled in for rendering purposes */
const boardWithFallingBlock = (game) => {
    const { fallingBlock, board } = game;
    if (fallingBlock === null)
        return board;
    const fallingBlockOccupiedCells = blockOccupiedCells(fallingBlock.self);
    const shadowOccupiedCells = blockOccupiedCells({
        ...fallingBlock.self,
        origin: fallingBlock.dropLocation
    });
    return board.map((row, r) => row.map((cell, c) => fallingBlockOccupiedCells.some(coord => coord[0] === r && coord[1] === c)
        ? { color: CONFIG.SHAPE_COLORS[fallingBlock.self.shape], type: "block" }
        : shadowOccupiedCells.some(coord => coord[0] === r && coord[1] === c)
            ? {
                color: CONFIG.SHAPE_COLORS[fallingBlock.self.shape],
                type: "shadow"
            }
            : cell));
};
/**Returns a board for displaying upcoming shape(s) */
const miniPreviewBoard = (shapeQueue) => {
    const upcomingShape = shapeQueue[0];
    // Create a small box with walls
    const boxSize = 8; // 6x6 inner area + 1 cell padding on each side
    const miniBoard = Array(boxSize)
        .fill(null)
        .map(() => Array(boxSize).fill({ color: CONFIG.WALL_COLOR, type: "wall" }));
    // Fill the inner area with empty cells
    for (let r = 1; r < boxSize - 1; r++) {
        for (let c = 1; c < boxSize - 1; c++) {
            miniBoard[r][c] = { color: [0, 0, 0], type: "empty" };
        }
    }
    if (upcomingShape === undefined)
        return miniBoard; //if there is no upcoming shape, return the blank board
    // Place the upcoming shape in the center of the box
    const origin = [4, 4];
    const shapeCoords = CONFIG.BLOCK_SHAPES[upcomingShape].map(coord => coordinateSum(coord, origin));
    shapeCoords.forEach(([r, c]) => {
        miniBoard[r][c] = {
            color: CONFIG.SHAPE_COLORS[upcomingShape],
            type: "block"
        };
    });
    return miniBoard;
};
/**Literally does the same thing as miniPreviewBoard but for the held shape for now */
const miniHeldBoard = (heldShape) => heldShape ? miniPreviewBoard([heldShape]) : miniPreviewBoard([]);
let charErrorLogged = {};
function drawCharacter(charPixels, charX, charY, charColor) {
    loadPixels();
    /* charX, charY should be bottom left corner of character
        so pixel position is charX + pixelX (normal)
        and charY - (charHeight - pixelY); i.e. start at bottom corner then move up
        */
    for (let [pixelY, row] of charPixels.entries()) {
        for (let [pixelX, pixel] of row.entries()) {
            if (pixel)
                set(charX + pixelX, charY - (charPixels.length - 1 - pixelY), color(charColor));
        }
    }
    updatePixels();
}
function getFontChar(char) {
    let ret;
    try {
        ret = font.chars[char];
        if (!ret) {
            ret = font.chars["█"];
            if (!charErrorLogged[char]) {
                charErrorLogged[char] = true;
                throw new Error(`${char} is not in the font`);
            }
        }
    }
    catch (e) {
        ret = font.chars["█"];
        console.error(e.message);
    }
    finally {
        return ret;
    }
}
function drawString(inStr, x, y, charColor, toUpper = true) {
    let offsetX = 0;
    let offsetY = 0;
    const str = toUpper ? inStr.toUpperCase() : inStr;
    for (const char of str) {
        const charPix = getFontChar(char);
        if (char == "\n" || x + offsetX + charPix[0].length >= width) {
            offsetY += font.lineHeight;
            offsetX = 0;
            if (char == "\n")
                continue;
        }
        drawCharacter(charPix, x + offsetX, y + offsetY, charColor);
        offsetX += charPix[0].length;
    }
    return { offsetX, offsetY };
}
const font = {
    lineHeight: 6,
    chars: {
        "█": [
            [0, 1, 1, 1],
            [0, 1, 1, 1],
            [0, 1, 1, 1],
            [0, 1, 1, 1],
            [0, 1, 1, 1]
        ],
        A: [
            [0, 0, 1, 1, 0],
            [0, 1, 0, 0, 1],
            [0, 1, 1, 1, 1],
            [0, 1, 0, 0, 1],
            [0, 1, 0, 0, 1]
        ],
        B: [
            [0, 1, 1, 1, 0],
            [0, 1, 0, 0, 1],
            [0, 1, 1, 1, 0],
            [0, 1, 0, 0, 1],
            [0, 1, 1, 1, 0]
        ],
        C: [
            [0, 0, 1, 1],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 1]
        ],
        D: [
            [0, 1, 1, 0],
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 1, 0]
        ],
        E: [
            [0, 1, 1, 1],
            [0, 1, 0, 0],
            [0, 1, 1, 1],
            [0, 1, 0, 0],
            [0, 1, 1, 1]
        ],
        F: [
            [0, 1, 1, 1],
            [0, 1, 0, 0],
            [0, 1, 1, 1],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ],
        G: [
            [0, 0, 1, 1, 1],
            [0, 1, 0, 0, 0],
            [0, 1, 0, 1, 1],
            [0, 1, 0, 0, 1],
            [0, 0, 1, 1, 0]
        ],
        H: [
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 1, 1],
            [0, 1, 0, 1],
            [0, 1, 0, 1]
        ],
        I: [
            [0, 1, 1, 1],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 1, 1, 1]
        ],
        J: [
            [0, 0, 1, 1, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0],
            [0, 1, 0, 1, 0],
            [0, 1, 1, 1, 0]
        ],
        K: [
            [0, 1, 0, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 1, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [0, 1, 0, 0, 1]
        ],
        L: [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 1]
        ],
        M: [
            [0, 1, 0, 0, 0, 1],
            [0, 1, 1, 0, 1, 1],
            [0, 1, 0, 1, 0, 1],
            [0, 1, 0, 0, 0, 1],
            [0, 1, 0, 0, 0, 1]
        ],
        N: [
            [0, 1, 0, 0, 1],
            [0, 1, 1, 0, 1],
            [0, 1, 0, 1, 1],
            [0, 1, 0, 0, 1],
            [0, 1, 0, 0, 1]
        ],
        O: [
            [0, 1, 1, 1],
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 1, 1]
        ],
        P: [
            [0, 1, 1, 1],
            [0, 1, 0, 1],
            [0, 1, 1, 1],
            [0, 1, 0, 0],
            [0, 1, 0, 0]
        ],
        Q: [
            [0, 1, 1, 1, 1],
            [0, 1, 0, 0, 1],
            [0, 1, 0, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 1, 1, 0, 1]
        ],
        R: [
            [0, 1, 1, 1],
            [0, 1, 0, 1],
            [0, 1, 1, 1],
            [0, 1, 1, 0],
            [0, 1, 0, 1]
        ],
        S: [
            [0, 1, 1, 1],
            [0, 1, 0, 0],
            [0, 1, 1, 1],
            [0, 0, 0, 1],
            [0, 1, 1, 1]
        ],
        T: [
            [0, 1, 1, 1],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        U: [
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 1, 1]
        ],
        V: [
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 0, 1, 0]
        ],
        W: [
            [0, 1, 0, 0, 0, 1],
            [0, 1, 0, 0, 0, 1],
            [0, 1, 0, 1, 0, 1],
            [0, 1, 0, 1, 0, 1],
            [0, 0, 1, 0, 1, 0]
        ],
        X: [
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 0, 1, 0],
            [0, 1, 0, 1],
            [0, 1, 0, 1]
        ],
        Y: [
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],
        Z: [
            [0, 1, 1, 1],
            [0, 0, 0, 1],
            [0, 0, 1, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 1]
        ],
        " ": [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        "0": [
            [0, 1, 1, 1],
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 1, 1]
        ],
        "1": [
            [0, 1, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 1, 1, 1]
        ],
        "2": [
            [0, 1, 1, 1],
            [0, 0, 0, 1],
            [0, 1, 1, 1],
            [0, 1, 0, 0],
            [0, 1, 1, 1]
        ],
        "3": [
            [0, 1, 1, 1],
            [0, 0, 0, 1],
            [0, 1, 1, 1],
            [0, 0, 0, 1],
            [0, 1, 1, 1]
        ],
        "4": [
            [0, 1, 0, 1],
            [0, 1, 0, 1],
            [0, 1, 1, 1],
            [0, 0, 0, 1],
            [0, 0, 0, 1]
        ],
        "5": [
            [0, 1, 1, 1],
            [0, 1, 0, 0],
            [0, 1, 1, 1],
            [0, 0, 0, 1],
            [0, 1, 1, 1]
        ],
        "6": [
            [0, 1, 1, 1],
            [0, 1, 0, 0],
            [0, 1, 1, 1],
            [0, 1, 0, 1],
            [0, 1, 1, 1]
        ],
        "7": [
            [0, 1, 1, 1],
            [0, 0, 0, 1],
            [0, 0, 0, 1],
            [0, 0, 0, 1],
            [0, 0, 0, 1]
        ],
        "8": [
            [0, 1, 1, 1],
            [0, 1, 0, 1],
            [0, 1, 1, 1],
            [0, 1, 0, 1],
            [0, 1, 1, 1]
        ],
        "9": [
            [0, 1, 1, 1],
            [0, 1, 0, 1],
            [0, 1, 1, 1],
            [0, 0, 0, 1],
            [0, 0, 0, 1]
        ],
        "`": [
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        "~": [
            [0, 0, 0, 0, 0],
            [0, 0, 1, 0, 1],
            [0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ],
        "!": [
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 1, 0]
        ],
        "@": [
            [0, 0, 1, 1, 1, 0],
            [0, 1, 0, 0, 0, 1],
            [0, 1, 0, 1, 1, 1],
            [0, 1, 0, 1, 0, 1],
            [0, 0, 0, 1, 1, 0]
        ],
        "#": [
            [0, 0, 1, 0, 1, 0],
            [0, 1, 1, 1, 1, 1],
            [0, 0, 1, 0, 1, 0],
            [0, 1, 1, 1, 1, 1],
            [0, 0, 1, 0, 1, 0]
        ],
        $: [
            [0, 0, 1, 1, 1, 1],
            [0, 1, 0, 1, 0, 0],
            [0, 0, 1, 1, 1, 0],
            [0, 0, 0, 1, 0, 1],
            [0, 1, 1, 1, 1, 0]
        ],
        "%": [
            [0, 1, 1, 0, 0, 1],
            [0, 1, 1, 0, 1, 0],
            [0, 0, 0, 1, 0, 0],
            [0, 0, 1, 0, 1, 1],
            [0, 1, 0, 0, 1, 1]
        ],
        "^": [
            [0, 0, 1, 0],
            [0, 1, 0, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        "&": [
            [0, 0, 1, 1, 0],
            [0, 1, 0, 1, 0],
            [0, 0, 1, 0, 0],
            [0, 1, 0, 1, 0],
            [0, 1, 1, 0, 1]
        ],
        "*": [
            [0, 1, 0, 1],
            [0, 0, 1, 0],
            [0, 1, 0, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        "(": [
            [0, 0, 1],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [0, 0, 1]
        ],
        ")": [
            [0, 1, 0],
            [0, 0, 1],
            [0, 0, 1],
            [0, 0, 1],
            [0, 1, 0]
        ],
        "-": [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        "+": [
            [0, 0, 0, 1, 0, 0],
            [0, 0, 0, 1, 0, 0],
            [0, 1, 1, 1, 1, 1],
            [0, 0, 0, 1, 0, 0],
            [0, 0, 0, 1, 0, 0]
        ],
        _: [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 1, 1, 1]
        ],
        "=": [
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1],
            [0, 0, 0, 0, 0]
        ],
        "/": [
            [0, 0, 0, 0, 1],
            [0, 0, 0, 1, 1],
            [0, 0, 1, 1, 0],
            [0, 1, 1, 0, 0],
            [0, 1, 0, 0, 0]
        ],
        "\\": [
            [0, 1, 0, 0, 0],
            [0, 1, 1, 0, 0],
            [0, 0, 1, 1, 0],
            [0, 0, 0, 1, 1],
            [0, 0, 0, 0, 1]
        ],
        "<": [
            [0, 0, 0, 1],
            [0, 0, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]
        ],
        ">": [
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
            [0, 0, 1, 0],
            [0, 1, 0, 0]
        ],
        ".": [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 1]
        ],
        "?": [
            [0, 0, 1, 1, 0],
            [0, 1, 0, 0, 1],
            [0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 1, 0]
        ],
        ",": [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 1],
            [0, 0, 1]
        ],
        ";": [
            [0, 0, 0],
            [0, 0, 1],
            [0, 0, 0],
            [0, 0, 1],
            [0, 0, 1]
        ],
        ":": [
            [0, 0, 0],
            [0, 0, 1],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 1]
        ],
        "'": [
            [0, 1, 0],
            [0, 1, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        '"': [
            [0, 1, 0],
            [0, 1, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ],
        "[": [
            [0, 1, 1],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 1]
        ],
        "]": [
            [0, 1, 1],
            [0, 0, 1],
            [0, 0, 1],
            [0, 0, 1],
            [0, 1, 1]
        ],
        "|": [
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0],
            [0, 1, 0]
        ],
        "{": [
            [0, 0, 1, 1],
            [0, 0, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 1]
        ],
        "}": [
            [0, 1, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
            [0, 0, 1, 0],
            [0, 1, 1, 0]
        ],
        "\n": []
    }
};
