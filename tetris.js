const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

const BLOCK_SIZE = 30;
const COLUMNS = 12;
const ROWS = 22;
canvas.width = BLOCK_SIZE * COLUMNS;
canvas.height = BLOCK_SIZE * ROWS;

// Farben
const COLORS = {
  I: 'lightblue',
  T: 'purple',
  O: 'yellow',
  S: 'green',
  Z: 'red',
  L: 'orange',
  J: 'darkblue',
  NONE: 'black'
};

// Formen (jede Form ist eine 2D-Matrix)
const SHAPES = {
  I: [[1, 1, 1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
  L: [[1, 0, 0], [1, 1, 1]],
  J: [[0, 0, 1], [1, 1, 1]]
};

class Piece {
  constructor(type) {
    this.shape = SHAPES[type];
    this.color = COLORS[type];
    this.x = Math.floor(COLUMNS / 2) - Math.floor(this.shape[0].length / 2);
    this.y = 0;
  }

  draw(offsetX = 0, offsetY = 0) {
    this.shape.forEach((row, i) => {
      row.forEach((value, j) => {
        if (value) {
          context.fillStyle = this.color;
          context.fillRect(
            (this.x + j + offsetX) * BLOCK_SIZE,
            (this.y + i + offsetY) * BLOCK_SIZE,
            BLOCK_SIZE,
            BLOCK_SIZE
          );
        }
      });
    });
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  rotate() {
    this.shape = this.shape[0].map((_, i) => this.shape.map(row => row[i])).reverse();
  }
}

function createGrid() {
  return Array.from({ length: ROWS }, () => Array(COLUMNS).fill(null));
}

function drawGrid(grid) {
  grid.forEach((row, i) => {
    row.forEach((value, j) => {
      context.fillStyle = value ? value : COLORS.NONE;
      context.fillRect(j * BLOCK_SIZE, i * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    });
  });
}

function checkCollision(piece, grid) {
  for (let i = 0; i < piece.shape.length; i++) {
    for (let j = 0; j < piece.shape[i].length; j++) {
      if (
        piece.shape[i][j] &&
        (piece.y + i >= ROWS ||
          piece.x + j < 0 ||
          piece.x + j >= COLUMNS ||
          grid[piece.y + i][piece.x + j])
      ) {
        return true;
      }
    }
  }
  return false;
}

function addPieceToGrid(piece, grid) {
  piece.shape.forEach((row, i) => {
    row.forEach((value, j) => {
      if (value) {
        grid[piece.y + i][piece.x + j] = piece.color;
      }
    });
  });
}

function clearRows(grid) {
  let linesCleared = 0;
  outer: for (let i = grid.length - 1; i >= 0; i--) {
    for (let j = 0; j < grid[i].length; j++) {
      if (!grid[i][j]) {
        continue outer;
      }
    }
    grid.splice(i, 1);
    grid.unshift(Array(COLUMNS).fill(null));
    linesCleared++;
  }
  return linesCleared;
}

let grid = createGrid();
let currentPiece = new Piece('I');
let nextPiece = new Piece('T');
let fallTime = 0;
let fallSpeed = 1000;

function gameLoop(time = 0) {
  const deltaTime = time - fallTime;
  fallTime = time;

  if (deltaTime > fallSpeed) {
    currentPiece.move(0, 1);
    if (checkCollision(currentPiece, grid)) {
      currentPiece.move(0, -1);
      addPieceToGrid(currentPiece, grid);
      currentPiece = nextPiece;
      nextPiece = new Piece(Object.keys(SHAPES)[Math.floor(Math.random() * Object.keys(SHAPES).length)]);
      if (checkCollision(currentPiece, grid)) {
        alert('Game Over');
        grid = createGrid();
        currentPiece = new Piece('I');
      }
    }
    fallTime = 0;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(grid);
  currentPiece.draw();
  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') {
    currentPiece.move(-1, 0);
    if (checkCollision(currentPiece, grid)) currentPiece.move(1, 0);
  } else if (event.key === 'ArrowRight') {
    currentPiece.move(1, 0);
    if (checkCollision(currentPiece, grid)) currentPiece.move(-1, 0);
  } else if (event.key === 'ArrowDown') {
    currentPiece.move(0, 1);
    if (checkCollision(currentPiece, grid)) currentPiece.move(0, -1);
  } else if (event.key === 'ArrowUp') {
    currentPiece.rotate();
    if (checkCollision(currentPiece, grid)) currentPiece.rotate(); // Rückgängig machen bei Kollision
  }
});

gameLoop();
