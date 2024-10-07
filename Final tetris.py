import pygame
import random

# Initialisiere Pygame und den Mixer
pygame.init()
pygame.mixer.init()

# Musik laden und abspielen (falls vorhanden)
try:
    pygame.mixer.music.load('background.mp3')
    pygame.mixer.music.set_volume(0.5)
    pygame.mixer.music.play(-1)
except pygame.error as e:
    print(f"Fehler beim Laden der Hintergrundmusik: {e}")

# Spielgröße
BLOCK_SIZE = 30
COLUMNS = 12
ROWS = 22
WIDTH, HEIGHT = BLOCK_SIZE * COLUMNS, BLOCK_SIZE * ROWS
NEXT_PIECE_BOX_SIZE = 6 * BLOCK_SIZE

WIN = pygame.display.set_mode((WIDTH + NEXT_PIECE_BOX_SIZE, HEIGHT))
pygame.display.set_caption("Tetris mit Vorschau")

# Farben
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
LIGHT_BLUE = (173, 216, 230)
PURPLE = (128, 0, 128)
YELLOW = (255, 255, 0)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
ORANGE = (255, 165, 0)
DARK_BLUE = (0, 0, 139)

SHAPES = [
    ([[1, 1, 1, 1]], LIGHT_BLUE),
    ([[0, 1, 0], [1, 1, 1]], PURPLE),
    ([[1, 1], [1, 1]], YELLOW),
    ([[0, 1, 1], [1, 1, 0]], GREEN),
    ([[1, 1, 0], [0, 1, 1]], RED),
    ([[1, 0, 0], [1, 1, 1]], ORANGE),
    ([[0, 0, 1], [1, 1, 1]], DARK_BLUE)
]

class Piece:
    def __init__(self, shape=None):
        self.shape, self.color = shape if shape else random.choice(SHAPES)
        self.x = COLUMNS // 2 - len(self.shape[0]) // 2
        self.y = 0

    def draw(self, offset_x=0, offset_y=0):
        for i, row in enumerate(self.shape):
            for j, val in enumerate(row):
                if val:
                    pygame.draw.rect(WIN, self.color, 
                                     (self.x * BLOCK_SIZE + j * BLOCK_SIZE + offset_x, 
                                      self.y * BLOCK_SIZE + i * BLOCK_SIZE + offset_y, 
                                      BLOCK_SIZE, BLOCK_SIZE))

    def move(self, dx, dy):
        self.x += dx
        self.y += dy

    def rotate(self):
        self.shape = [list(row) for row in zip(*self.shape[::-1])]

def check_collision(piece, grid):
    for i, row in enumerate(piece.shape):
        for j, val in enumerate(row):
            if val:
                if piece.x + j < 0 or piece.x + j >= COLUMNS or piece.y + i >= ROWS or grid[piece.y + i][piece.x + j]:
                    return True
    return False

def add_piece_to_grid(piece, grid):
    for i, row in enumerate(piece.shape):
        for j, val in enumerate(row):
            if val:
                grid[piece.y + i][piece.x + j] = piece.color

def clear_rows(grid):
    full_rows = [i for i, row in enumerate(grid) if all(row)]
    for row in full_rows:
        del grid[row]
        grid.insert(0, [None for _ in range(COLUMNS)])
    return len(full_rows)

def draw_grid(grid):
    for i, row in enumerate(grid):
        for j, val in enumerate(row):
            if val:
                pygame.draw.rect(WIN, val, (j * BLOCK_SIZE, i * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE))

def draw_next_piece(next_piece):
    offset_x = WIDTH + BLOCK_SIZE
    offset_y = BLOCK_SIZE * 3
    font = pygame.font.SysFont('Arial', 24)
    label = font.render("Next Block:", True, WHITE)
    WIN.blit(label, (WIDTH + 10, 10))
    for i, row in enumerate(next_piece.shape):
        for j, val in enumerate(row):
            if val:
                pygame.draw.rect(WIN, next_piece.color, 
                                 (offset_x + j * BLOCK_SIZE, 
                                  offset_y + i * BLOCK_SIZE, 
                                  BLOCK_SIZE, BLOCK_SIZE))

def draw_hold_piece(hold_piece):
    if hold_piece:
        offset_x = WIDTH + BLOCK_SIZE
        offset_y = BLOCK_SIZE * 6
        font = pygame.font.SysFont('Arial', 24)
        label = font.render("Hold:", True, WHITE)
        WIN.blit(label, (WIDTH + 10, offset_y - BLOCK_SIZE))  # Über den Block zeichnen
        for i, row in enumerate(hold_piece.shape):
            for j, val in enumerate(row):
                if val:
                    pygame.draw.rect(WIN, hold_piece.color, 
                                     (offset_x + j * BLOCK_SIZE, 
                                      offset_y + i * BLOCK_SIZE, 
                                      BLOCK_SIZE, BLOCK_SIZE))

def draw_border():
    pygame.draw.line(WIN, WHITE, (WIDTH, 0), (WIDTH, HEIGHT), 2)

def draw_lines_cleared(lines):
    font = pygame.font.SysFont('Arial', 24)
    color = get_line_color(lines)  # Farbe je nach Linienzahl erhalten
    label = font.render(f"Lines: {lines}", True, color)
    WIN.blit(label, (WIDTH + 10, HEIGHT - 30))

def get_line_color(lines):
    """ Gibt die Farbe basierend auf der Anzahl der gelösten Linien zurück. """
    if lines < 10:
        return WHITE
    elif lines < 20:
        return GREEN
    elif lines < 30:
        return ORANGE
    elif lines < 40:
        return DARK_BLUE
    elif lines < 50:
        return RED
    elif lines < 60:
        return PURPLE
    else:
        return YELLOW

def game_over_screen():
    WIN.fill(BLACK)
    font = pygame.font.SysFont('Arial', 50)
    game_over_label = font.render("GAME OVER", True, WHITE)
    WIN.blit(game_over_label, (WIDTH // 2 - game_over_label.get_width() // 2, HEIGHT // 2 - game_over_label.get_height() // 2))
    pygame.display.update()

    waiting_for_restart = True
    while waiting_for_restart:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                quit()
            if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
                waiting_for_restart = False  # Neustart, wenn Leertaste gedrückt wird

def reset_game():
    return [[None for _ in range(COLUMNS)] for _ in range(ROWS)], Piece(), Piece(), None, 300, 50, 0, 0

def main():
    clock = pygame.time.Clock()
    grid, current_piece, next_piece, hold_piece, fall_speed, fast_fall_speed, fall_time, lines_cleared = reset_game()
    run = True
    fast_fall = False  # Schnellfallen-Flag
    can_hold = True  # Flag, um die Hold-Funktion zu steuern

    while run:
        WIN.fill(BLACK)
        fall_time += clock.get_rawtime()
        clock.tick()

        current_speed = fast_fall_speed if fast_fall else fall_speed

        # Erhöhe die Geschwindigkeit bei Erreichen jedes 10er
        if lines_cleared > 0 and lines_cleared % 10 == 0:
            if lines_cleared == 10:  # Erste Erhöhung
                fall_speed = max(200, fall_speed - 10)  # Geschwindigkeit erhöhen (minimale Geschwindigkeit)
            else:
                fall_speed = max(100, fall_speed - 10)  # Geschwindigkeit erhöhen (minimale Geschwindigkeit)
        
        if fall_time > current_speed:
            current_piece.move(0, 1)
            if check_collision(current_piece, grid):
                current_piece.move(0, -1)
                add_piece_to_grid(current_piece, grid)
                lines_cleared += clear_rows(grid)
                current_piece = next_piece
                next_piece = Piece()  # Neuen Block generieren
                current_piece.y = 0  # Setze den neuen Block zurück zur obersten Zeile
                can_hold = True  # Halten kann wieder verwendet werden
                if check_collision(current_piece, grid):
                    game_over_screen()  # Game Over anzeigen
                    grid, current_piece, next_piece, hold_piece, fall_speed, fast_fall_speed, fall_time, lines_cleared = reset_game()
                    continue  # Zurück zum Hauptspiel und alle Variablen zurücksetzen
            fall_time = 0

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                run = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:
                    current_piece.move(-1, 0)
                    if check_collision(current_piece, grid):
                        current_piece.move(1, 0)
                if event.key == pygame.K_RIGHT:
                    current_piece.move(1, 0)
                    if check_collision(current_piece, grid):
                        current_piece.move(-1, 0)
                if event.key == pygame.K_DOWN:
                    fast_fall = True  # Flag setzen, um schneller zu fallen
                if event.key == pygame.K_UP:
                    current_piece.rotate()
                    if check_collision(current_piece, grid):
                        current_piece.rotate()  # Zurückdrehen, wenn Kollision
                if event.key == pygame.K_c and can_hold:
                    if hold_piece is None:
                        hold_piece = current_piece
                        current_piece = next_piece
                        next_piece = Piece()
                        can_hold = False  # Halten bis der Block gefallen ist nicht wieder verwenden
                        current_piece.y = 0
                    else:
                        current_piece, hold_piece = hold_piece, current_piece
                        current_piece.y = 0  # Setze den neuen Block zurück zur obersten Zeile
                        can_hold = False  # Halten kann nicht erneut verwendet werden, bis der Block gefallen ist

            if event.type == pygame.KEYUP:
                if event.key == pygame.K_DOWN:
                    fast_fall = False

        draw_grid(grid)
        current_piece.draw()
        draw_next_piece(next_piece)
        draw_hold_piece(hold_piece)
        draw_border()
        draw_lines_cleared(lines_cleared)

        pygame.display.update()

    pygame.quit()

if __name__ == "__main__":
    main()
