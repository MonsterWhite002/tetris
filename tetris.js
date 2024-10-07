<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tetris mit Vorschau</title>
    <style>
        body { background-color: black; }
        canvas { border: 1px solid white; }
        #score { color: white; font-family: Arial; }
    </style>
</head>
<body>
    <canvas id="tetris" width="360" height="660"></canvas>
    <div id="score">Lines: 0</div>

    <script>
        const canvas = document.getElementById('tetris');
        const context = canvas.getContext('2d');

        const BLOCK_SIZE = 30;
        const COLUMNS = 12;
        const ROWS = 22;

        const LIGHT_BLUE = '#ADD8E6';
        const PURPLE = '#800080';
        const YELLOW = '#FFFF00';
        const GREEN = '#00FF00';
        const RED = '#FF0000';
        const ORANGE = '#FFA500';
        const DARK_BLUE = '#00008B';

        const SHAPES = [
            { shape: [[1, 1, 1, 1]], color: LIGHT_BLUE },
            { shape: [[0, 1, 0], [1, 1, 1]], color: PURPLE },
            { shape: [[1, 1], [1, 1]], color: YELLOW },
            { shape: [[0, 1, 1], [1, 1, 0]], color: GREEN },
            { shape: [[1, 1, 0], [0, 1, 1]], color: RED },
            { shape: [[1, 0, 0], [1, 1, 1]], color: ORANGE },
            { shape: [[0, 0, 1], [1, 1, 1]], color: DARK_BLUE }
        ];

        let grid = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(null));
        let currentPiece, nextPiece, linesCleared = 0;

        function Piece() {
            const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            this.shape = randomShape.shape;
            this.color = randomShape.color;
            this.x = Math.floor(COLUMNS / 2) - Math.floor(this.shape[0].length / 2);
            this.y = 0;
        }

        function drawSquare(x, y, color) {
            context.fillStyle = color;
            context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            context.strokeStyle = 'white';
            context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }

        function drawGrid() {
            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLUMNS; col++) {
                    if (grid[row][col]) {
                        drawSquare(col, row, grid[row][col]);
                    }
                }
            }
        }

        function drawPiece(piece) {
            for (let row = 0; row < piece.shape.length; row++) {
                for (let col = 0; col < piece.shape[row].length; col++) {
                    if (piece.shape[row][col]) {
                        drawSquare(piece.x + col, piece.y + row, piece.color);
                    }
                }
            }
        }

        function collision(piece) {
            for (let row = 0; row < piece.shape.length; row++) {
                for (let col = 0; col < piece.shape[row].length; col++) {
                    if (piece.shape[row][col]) {
                        if (piece.x + col < 0 || piece.x + col >= COLUMNS || piece.y + row >= ROWS ||
                            (piece.y + row >= 0 && grid[piece.y + row][piece.x + col])) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        function merge(piece) {
            for (let row = 0; row < piece.shape.length; row++) {
                for (let col = 0; col < piece.shape[row].length; col++) {
                    if (piece.shape[row][col]) {
                        grid[piece.y + row][piece.x + col] = piece.color;
                    }
                }
            }
        }

        function clearRows() {
            let fullRows = [];
            for (let row = 0; row < ROWS; row++) {
                if (grid[row].every(cell => cell)) {
                    fullRows.push(row);
                }
            }
            fullRows.forEach(row => {
                grid.splice(row, 1);
                grid.unshift(Array(COLUMNS).fill(null));
            });
            linesCleared += fullRows.length;
            document.getElementById('score').innerText = 'Lines: ' + linesCleared;
        }

        function gameOver() {
            context.fillStyle = 'black';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'white';
            context.font = '50px Arial';
            context.fillText('GAME OVER', 50, canvas.height / 2);
        }

        function update() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            drawGrid();
            drawPiece(currentPiece);
            if (currentPiece.y < 0) {
                gameOver();
                return;
            }
            currentPiece.y++;
            if (collision(currentPiece)) {
                currentPiece.y--;
                merge(currentPiece);
                clearRows();
                currentPiece = nextPiece;
                nextPiece = new Piece();
                if (collision(currentPiece)) {
                    gameOver();
                }
            }
            requestAnimationFrame(update);
        }

        function init() {
            currentPiece = new Piece();
            nextPiece = new Piece();
            update();
        }

        window.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                currentPiece.x--;
                if (collision(currentPiece)) currentPiece.x++;
            }
            if (event.key === 'ArrowRight') {
                currentPiece.x++;
                if (collision(currentPiece)) currentPiece.x--;
            }
            if (event.key === 'ArrowDown') {
                currentPiece.y++;
                if (collision(currentPiece)) {
                    currentPiece.y--;
                    merge(currentPiece);
                    clearRows();
                    currentPiece = nextPiece;
                    nextPiece = new Piece();
                    if (collision(currentPiece)) {
                        gameOver();
                    }
                }
            }
            if (event.key === 'ArrowUp') {
                const tempShape = currentPiece.shape;
                currentPiece.shape = currentPiece.shape[0].map((_, index) => currentPiece.shape.map(row => row[index])).reverse();
                if (collision(currentPiece)) currentPiece.shape = tempShape; // Zurückdrehen, wenn Kollision
            }
        });

        init();
    </script>
</body>
</html>
