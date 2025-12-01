export type piece_name = 'rook' | 'knight' | 'bishop' | 'king' | 'queen' | 'pawn'

export type color = 'b' | 'w'

export type coordinate = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface location {
    x: coordinate,
    y: coordinate
}

export interface piece {
    name: piece_name,
    color: color,
    position: location,
    moves: number,
    increment_move(): void
}

export interface response {
    canMoveto: location[],
    canCut: location[]
}

export interface check {
    color: color,
    kingsLocation: location,
    enemysLocation: location
}