import { check, color, coordinate, location, piece, piece_name, response } from "./types.js";

class Piece {
    name: piece_name;
    color: color;
    position: location;
    moves: number = 0;

    increment_move() {
        this.moves = this.moves + 1;
    }

    constructor(name: piece_name, color: color, position: location) {
        this.name = name
        this.color = color
        this.position = position
    }
}

export class Board {
    private chess_board: Array<Array<piece | null>>
    private turn: boolean;
    private steps: {
        from: location,
        to: location
    }[];
    private winner: null | color;
    private captured: {
        'w': piece[],
        'b': piece[]
    }
    private check: check | null = null;

    #changeTurn() {
        this.turn = !this.turn;
    }

    #addStep(current_x: coordinate, current_y: coordinate, goal_x: coordinate, goal_y: coordinate) {
        this.steps.push({
            from: {
                x: current_x,
                y: current_y
            },
            to: {
                x: goal_x,
                y: goal_y
            }
        })
    }

    constructor() {

        const knights = get_knights();
        const rooks = get_rooks();
        const bishops = get_bishops();
        const pawns = get_pawns();
        const kings = get_kings();
        const queens = get_queens();

        this.steps = [];
        this.turn = true;
        this.winner = null;
        this.captured = {
            'b': [],
            'w': []
        }

        this.chess_board = [
            [rooks[2], knights[2], bishops[2], queens[0], kings[0], bishops[0], knights[0], rooks[0]],
            [pawns[14], pawns[12], pawns[10], pawns[8], pawns[6], pawns[4], pawns[2], pawns[0]],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [pawns[1], pawns[3], pawns[5], pawns[7], pawns[9], pawns[11], pawns[13], pawns[15]],
            [rooks[1], knights[1], bishops[1], queens[1], kings[1], bishops[3], knights[3], rooks[3]]
        ]
    }

    getBoard() {
        return this.chess_board;
    }

    getTurn(): color {
        return this.turn ? "w" : "b";
    }

    getSteps() {
        return this.steps;
    }

    #setWinner(winner: color) {
        this.winner = winner
    }

    getWinner() {
        return this.winner;
    }

    getCaptured() {
        return this.captured;
    }

    canMoveTo(board: Board, current_x: number, current_y: number): response | null {
        if (!(current_x >= 0 && current_x <= 7)) return null;
        if (!(current_y >= 0 && current_y <= 7)) return null;

        if (board.getTurn() != board.chess_board[current_x][current_y]?.color) {
            return null;
        }

        const piece = board.chess_board[current_x][current_y];
        if (!piece) {
            return null;
        }

        const name = piece.name

        switch (name) {
            case "rook":
                if(this.check){
                    return validRookMoveAfterCheck(this.check, board, current_x as coordinate, current_y as coordinate);
                }
                return validRookMove(board.chess_board, current_x as coordinate, current_y as coordinate);

            case "pawn":
                if(this.check){
                    return validPawnMoveAfterCheck(this.check, board, current_x as coordinate, current_y as coordinate)
                }
                return validPawnMove(board.chess_board, current_x as coordinate, current_y as coordinate);

            case "bishop":
                if(this.check){
                    return validBishopMoveAfterCheck(this.check, board, current_x as coordinate, current_y as coordinate)
                }
                return validBishopMove(board.chess_board, current_x as coordinate, current_y as coordinate);

            case "knight":
                if(this.check){
                    return validKnightMoveAfterCheck(this.check, board, current_x as coordinate, current_y as coordinate)
                }
                return validKnightMove(board.chess_board, current_x as coordinate, current_y as coordinate);

            case "king":
                if(this.check){
                    return validKingMoveAfterCheck(this.check, board, current_x as coordinate, current_y as coordinate)
                }
                return validKingMove(board, current_x as coordinate, current_y as coordinate);

            case "queen":
                if(this.check){
                    return validQueenMoveAfterCheck(this.check, board, current_x as coordinate, current_y as coordinate)
                }
                return validQueenMove(board.chess_board, current_x as coordinate, current_y as coordinate)

            default:
                return null;
        }
    }

    move(board: Board, current_x: coordinate, current_y: coordinate, goal_x: coordinate, goal_y: coordinate) {
        const piece: piece | null = board.chess_board[current_x][current_y];
        if (!piece) {
            return null;
        }
        if (!validPositions(current_x, current_y, goal_x, goal_y)) {
            return null;
        }

        if (!selfPiecePresent(board.chess_board, current_x, current_y, goal_x, goal_y)) {
            return null;
        }

        board.chess_board[current_x][current_y]?.increment_move()
        if (board.chess_board[goal_x][goal_y] != null) {
            const color = board.chess_board[goal_x][goal_y].color
            if (color == 'b') {
                this.captured.b.push(board.chess_board[goal_x][goal_y])
            } else {
                this.captured.w.push(board.chess_board[goal_x][goal_y])
            }
        }
        let checkMate = false;
        if(this.check){
            board.chess_board[goal_x][goal_y] = piece;
            board.chess_board[current_x][current_y] = null;
            board.chess_board[goal_x][goal_y].position = {
                x: goal_x,
                y: goal_y
            }
            const check = isCheck(board, this.check.enemysLocation.x, this.check.enemysLocation.y)
            if(check.check){
                this.#setWinner(board.getBoard()[this.check.enemysLocation.x][this.check.enemysLocation.y]?.color as color);
                return {
                    board,
                    check: check.check,
                    checkMate: true
                };
            }
            this.check = null;
            board.#changeTurn()
            board.#addStep(current_x, current_y, goal_x, goal_y);
            return {
                board,
                check: check.check,
                checkMate
            };

        }
        board.chess_board[goal_x][goal_y] = piece;
        board.chess_board[current_x][current_y] = null;
        board.chess_board[goal_x][goal_y].position = {
            x: goal_x,
            y: goal_y
        }
        const check = isCheck(board, goal_x, goal_y)
        if (check.check && check.king) {
            this.check = {
                color: board.getBoard()[check.king.x][check.king.y]?.color as color,
                enemysLocation: {
                    x: goal_x,
                    y: goal_y
                },
                kingsLocation: check.king
            }
            checkMate = isCheckMate(board, check.king, goal_x, goal_y)
            if (checkMate) {
                this.#setWinner(board.getBoard()[goal_x][goal_y]?.color as color);
            }
        }
        board.#changeTurn()
        board.#addStep(current_x, current_y, goal_x, goal_y);
        return {
            board,
            check: check.check,
            checkMate
        };
    }

}

function selfPiecePresent(board: Array<Array<null | piece>>, current_x: coordinate, current_y: coordinate, goal_x: coordinate, goal_y: coordinate) {
    if (board[current_x][current_y]?.color == board[goal_x][goal_y]?.color) {
        return false;
    } else {
        return true;
    }
}

function validPositions(current_x: coordinate, current_y: coordinate, goal_x: coordinate, goal_y: coordinate) {
    if (!(current_x >= 0 && current_x <= 7)) return false;
    if (!(current_y >= 0 && current_y <= 7)) return false;
    if (!(goal_x >= 0 && goal_x <= 7)) return false;
    if (!(goal_y >= 0 && goal_y <= 7)) return false;
    if (current_x == goal_x && current_y == goal_y) return false;
    return true;
}

function get_knights() {
    const knights: piece[] = []
    const coords: location[] = [{ x: 0, y: 6 }, { x: 7, y: 1 }, { x: 0, y: 1 }, { x: 7, y: 6 }]

    for (let i = 0; i < 4; i++) {
        if (i % 2 == 0) {
            knights.push(new Piece('knight', 'b', coords[i]))
        } else {
            knights.push(new Piece('knight', 'w', coords[i]))
        }
    }
    return knights;
}

function get_rooks() {
    const rooks: piece[] = []
    const coords: location[] = [{ x: 7, y: 0 }, { x: 0, y: 7 }, { x: 0, y: 0 }, { x: 7, y: 7 }]

    for (let i = 0; i < 4; i++) {
        if (i % 2 == 0) {
            rooks.push(new Piece('rook', 'b', coords[i]))
        } else {
            rooks.push(new Piece('rook', 'w', coords[i]))
        }
    }
    return rooks;
}

function get_bishops() {
    const bishops: piece[] = []
    const coords: location[] = [{ x: 0, y: 5 }, { x: 7, y: 2 }, { x: 0, y: 2 }, { x: 7, y: 5 }]

    for (let i = 0; i < 4; i++) {
        if (i % 2 == 0) {
            bishops.push(new Piece('bishop', 'b', coords[i]))
        } else {
            bishops.push(new Piece('bishop', 'w', coords[i]))
        }
    }
    return bishops;
}

function get_pawns() {
    const pawns: piece[] = []
    const coords: location[] = [{ x: 1, y: 7 }, { x: 6, y: 0 }, { x: 1, y: 6 }, { x: 6, y: 1 }, { x: 1, y: 5 }, { x: 6, y: 2 }, { x: 1, y: 4 }, { x: 6, y: 3 }, { x: 1, y: 3 }, { x: 6, y: 4 }, { x: 1, y: 2 }, { x: 6, y: 5 }, { x: 1, y: 1 }, { x: 6, y: 6 }, { x: 1, y: 0 }, { x: 6, y: 7 }]

    for (let i = 0; i < 16; i++) {
        if (i % 2 == 0) {
            pawns.push(new Piece('pawn', 'b', coords[i]))
        } else {
            pawns.push(new Piece('pawn', 'w', coords[i]))
        }
    }
    return pawns;
}

function get_kings() {
    const kings: piece[] = []
    const coords: location[] = [{ x: 0, y: 4 }, { x: 7, y: 4 }]

    for (let i = 0; i < 4; i++) {
        if (i % 2 == 0) {
            kings.push(new Piece('king', 'b', coords[i]))
        } else {
            kings.push(new Piece('king', 'w', coords[i]))
        }
    }
    return kings;
}

function get_queens() {
    const queens: piece[] = []
    const coords: location[] = [{ x: 0, y: 3 }, { x: 7, y: 3 }]

    for (let i = 0; i < 4; i++) {
        if (i % 2 == 0) {
            queens.push(new Piece('queen', 'b', coords[i]))
        } else {
            queens.push(new Piece('queen', 'w', coords[i]))
        }
    }
    return queens;
}

function validRookMove(board: Array<Array<null | piece>>, current_x: coordinate, current_y: coordinate) {
    const response: response = {
        canMoveto: [],
        canCut: []
    }

    let i = 1;
    while (current_x + i <= 7) {
        if (board[current_x + i][current_y] != null) {
            if (selfPiecePresent(board, current_x + i as coordinate, current_y, current_x, current_y)) {
                response.canCut.push({ x: current_x + i as coordinate, y: current_y })
            }
            break;
        }
        response.canMoveto.push({ x: current_x + i as coordinate, y: current_y });
        i++;
    }

    i = 1;
    while (current_y + i <= 7) {
        if (board[current_x][current_y + i] != null) {
            if (selfPiecePresent(board, current_x, current_y + i as coordinate, current_x, current_y)) {
                response.canCut.push({ x: current_x, y: current_y + i as coordinate })
            }
            break;
        }
        response.canMoveto.push({ x: current_x, y: current_y + i as coordinate });
        i++;
    }

    i = 1;
    while (current_x - i >= 0) {
        if (board[current_x - i][current_y] != null) {
            if (selfPiecePresent(board, current_x - i as coordinate, current_y, current_x, current_y)) {
                response.canCut.push({ x: current_x - i as coordinate, y: current_y })
            }
            break;
        }
        response.canMoveto.push({ x: current_x - i as coordinate, y: current_y });
        i++;
    }

    i = 1;
    while (current_y - i >= 0) {
        if (board[current_x][current_y - i] != null) {
            if (selfPiecePresent(board, current_x, current_y - i as coordinate, current_x, current_y)) {
                response.canCut.push({ x: current_x, y: current_y - i as coordinate })
            }
            break;
        }
        response.canMoveto.push({ x: current_x, y: current_y - i as coordinate });
        i++;
    }

    return response;
}

function validPawnMove(board: Array<Array<null | piece>>, current_x: coordinate, current_y: coordinate) {
    const color = board[current_x][current_y]?.color as color
    const response: response = {
        canMoveto: [],
        canCut: []
    }
    switch (color) {
        case "b":
            if (current_x + 1 >= 0 && current_x + 1 <= 7 && board[current_x + 1][current_y] == null) {
                response.canMoveto.push({ x: current_x + 1 as coordinate, y: current_y })
            }
            if (current_y + 1 >= 0 && current_y + 1 <= 7 && current_x + 1 >= 0 && current_x + 1 <= 7 && board[current_x + 1][current_y + 1] != null && selfPiecePresent(board, current_x + 1 as coordinate, current_y + 1 as coordinate, current_x, current_y)) {
                response.canCut.push({ x: current_x + 1 as coordinate, y: current_y + 1 as coordinate })
            }
            if (current_y - 1 >= 0 && current_y - 1 <= 7 && current_x + 1 >= 0 && current_x + 1 <= 7 && board[current_x + 1][current_y - 1] != null && selfPiecePresent(board, current_x + 1 as coordinate, current_y - 1 as coordinate, current_x, current_y)) {
                response.canCut.push({ x: current_x + 1 as coordinate, y: current_y - 1 as coordinate })
            }
            if (board[current_x][current_y]?.moves == 0) {
                if (current_x + 2 >= 0 && current_x + 2 <= 7 && board[current_x + 1][current_y] == null && board[current_x + 2][current_y] == null) {
                    response.canMoveto.push({ x: current_x + 2 as coordinate, y: current_y })
                }
            }
            return response;

        case "w":
            if (current_x - 1 >= 0 && current_x - 1 <= 7 && board[current_x - 1][current_y] == null) {
                response.canMoveto.push({ x: current_x - 1 as coordinate, y: current_y })
            }
            if (current_y + 1 >= 0 && current_y + 1 <= 7 && current_x - 1 >= 0 && current_x - 1 <= 7 && board[current_x - 1][current_y + 1] != null && selfPiecePresent(board, current_x - 1 as coordinate, current_y + 1 as coordinate, current_x, current_y)) {
                response.canCut.push({ x: current_x - 1 as coordinate, y: current_y + 1 as coordinate })
            }
            if (current_y - 1 >= 0 && current_y - 1 <= 7 && current_x - 1 >= 0 && current_x - 1 <= 7 && board[current_x - 1][current_y - 1] != null && selfPiecePresent(board, current_x - 1 as coordinate, current_y - 1 as coordinate, current_x, current_y)) {
                response.canCut.push({ x: current_x - 1 as coordinate, y: current_y - 1 as coordinate })
            }
            if (board[current_x][current_y]?.moves == 0) {
                if (current_x - 2 >= 0 && current_x - 2 <= 7 && board[current_x - 1][current_y] == null && board[current_x - 2][current_y] == null) {
                    response.canMoveto.push({ x: current_x - 2 as coordinate, y: current_y })
                }
            }
            return response;
    }

}

function validBishopMove(board: Array<Array<null | piece>>, current_x: coordinate, current_y: coordinate) {
    const response: response = {
        canMoveto: [],
        canCut: []
    }

    let i = 1;
    while (current_x + i <= 7 && current_y + i <= 7) {
        if (board[current_x + i][current_y + i] != null) {
            if (selfPiecePresent(board, current_x + i as coordinate, current_y + i as coordinate, current_x, current_y)) {
                response.canCut.push({ x: current_x + i as coordinate, y: current_y + i as coordinate })
            }
            break;
        }
        response.canMoveto.push({ x: current_x + i as coordinate, y: current_y + i as coordinate })
        i++;
    }

    i = 1;
    while (current_x + i <= 7 && current_y - i >= 0) {
        if (board[current_x + i][current_y - i] != null) {
            if (selfPiecePresent(board, current_x + i as coordinate, current_y - i as coordinate, current_x, current_y)) {
                response.canCut.push({ x: current_x + i as coordinate, y: current_y - i as coordinate })
            }
            break;
        }
        response.canMoveto.push({ x: current_x + i as coordinate, y: current_y - i as coordinate })
        i++;
    }

    i = 1;
    while (current_x - i >= 0 && current_y - i >= 0) {
        if (board[current_x - i][current_y - i] != null) {
            if (selfPiecePresent(board, current_x - i as coordinate, current_y - i as coordinate, current_x, current_y)) {
                response.canCut.push({ x: current_x - i as coordinate, y: current_y - i as coordinate })
            }
            break;
        }
        response.canMoveto.push({ x: current_x - i as coordinate, y: current_y - i as coordinate })
        i++;
    }

    i = 1;
    while (current_x - i >= 0 && current_y + i <= 7) {
        if (board[current_x - i][current_y + i] != null) {
            if (selfPiecePresent(board, current_x - i as coordinate, current_y + i as coordinate, current_x, current_y)) {
                response.canCut.push({ x: current_x - i as coordinate, y: current_y + i as coordinate })
            }
            break;
        }
        response.canMoveto.push({ x: current_x - i as coordinate, y: current_y + i as coordinate })
        i++;
    }

    return response;
}

function validKnightMove(board: Array<Array<null | piece>>, current_x: coordinate, current_y: coordinate) {
    const response: response = {
        canMoveto: [],
        canCut: []
    }

    const coords = [
        [-2, -1],
        [-2, 1],
        [-1, 2],
        [1, 2]
    ]

    for (let i = 0; i < 4; i++) {
        if (current_x + coords[i][0] <= 7 && current_x + coords[i][0] >= 0 && current_y + coords[i][1] <= 7 && current_y + coords[i][1] >= 0) {
            if (board[current_x + coords[i][0]][current_y + coords[i][1]] != null) {
                if (selfPiecePresent(board, current_x + coords[i][0] as coordinate, current_y + coords[i][1] as coordinate, current_x, current_y)) {
                    response.canCut.push({ x: current_x + coords[i][0] as coordinate, y: current_y + coords[i][1] as coordinate });
                }
            } else {
                response.canMoveto.push({ x: current_x + coords[i][0] as coordinate, y: current_y + coords[i][1] as coordinate });
            }
        }
    }

    for (let i = 0; i < 4; i++) {
        if (current_x + coords[i][1] <= 7 && current_x + coords[i][1] >= 0 && current_y + coords[i][0] <= 7 && current_y + coords[i][0] >= 0) {
            if (board[current_x + coords[i][1]][current_y + coords[i][0]] != null) {
                if (selfPiecePresent(board, current_x + coords[i][1] as coordinate, current_y + coords[i][0] as coordinate, current_x, current_y)) {
                    response.canCut.push({ x: current_x + coords[i][1] as coordinate, y: current_y + coords[i][0] as coordinate });
                }
            }
            else {
                response.canMoveto.push({ x: current_x + coords[i][1] as coordinate, y: current_y + coords[i][0] as coordinate });
            }
        }
    }
    return response;

}

function validKingMove(board: Board, current_x: coordinate, current_y: coordinate) {
    const response: response = {
        canMoveto: [],
        canCut: []
    }

    let coords = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]]
    for (let i = 0; i < 8; i++) {
        if (current_x + coords[i][0] <= 7 && current_y + coords[i][1] <= 7 && current_x + coords[i][0] >= 0 && current_y + coords[i][1] >= 0) {
            if (board.getBoard()[current_x + coords[i][0]][current_y + coords[i][1]] != null) {
                if (selfPiecePresent(board.getBoard(), current_x + coords[i][0] as coordinate, current_y + coords[i][1] as coordinate, current_x, current_y)) {
                    let kingIsCutting = false;
                    for (let j = 0; j < board.getBoard().length; j++) {
                        for (let k = 0; k < board.getBoard()[j].length; k++) {
                            const piece = board.getBoard()[j][k];
                            if (piece && selfPiecePresent(board.getBoard(), current_x, current_y, j as coordinate, k as coordinate) && piece.name != "king") {
                                const temp = board.getBoard()[current_x + coords[i][0]][current_y + coords[i][1]]
                                board.getBoard()[current_x + coords[i][0]][current_y + coords[i][1]] = board.getBoard()[current_x][current_y];
                                board.getBoard()[current_x][current_y] = null;
                                const move = moveTo(board, j, k);
                                const cut = move?.canCut.some((loc) => loc.x == current_x + coords[i][0] && loc.y == current_y + coords[i][1]);
                                if (cut) {
                                    kingIsCutting = true
                                }
                                board.getBoard()[current_x][current_y] = board.getBoard()[current_x + coords[i][0]][current_y + coords[i][1]];
                                board.getBoard()[current_x + coords[i][0]][current_y + coords[i][1]] = temp;
                            }
                        }
                    }
                    if (!kingIsCutting) {
                        response.canCut.push({ x: current_x + coords[i][0] as coordinate, y: current_y + coords[i][1] as coordinate })
                    }
                }
            } else {
                let kingIsCutting = false;
                for (let j = 0; j < board.getBoard().length; j++) {
                    for (let k = 0; k < board.getBoard()[j].length; k++) {
                        const piece = board.getBoard()[j][k];
                        if (piece && selfPiecePresent(board.getBoard(), current_x, current_y, j as coordinate, k as coordinate) && piece.name != "king") {
                            board.getBoard()[current_x + coords[i][0]][current_y + coords[i][1]] = board.getBoard()[current_x][current_y];
                            board.getBoard()[current_x][current_y] = null;
                            const move = moveTo(board, j, k);
                            const cut = move?.canCut.some((loc) => loc.x == current_x + coords[i][0] && loc.y == current_y + coords[i][1]);
                            if (cut) {
                                kingIsCutting = true;
                                // response.canCut.push({ x: current_x + coords[i][0] as coordinate, y: current_y + coords[i][1] as coordinate })
                            }
                            board.getBoard()[current_x][current_y] = board.getBoard()[current_x + coords[i][0]][current_y + coords[i][1]];
                            board.getBoard()[current_x + coords[i][0]][current_y + coords[i][1]] = null;
                        }
                    }
                }
                if (!kingIsCutting) {
                    response.canMoveto.push({ x: current_x + coords[i][0] as coordinate, y: current_y + coords[i][1] as coordinate })
                }
            }
        }
    }
    return response;
}

function validQueenMove(board: Array<Array<null | piece>>, current_x: coordinate, current_y: coordinate): response {
    const res1 = validRookMove(board, current_x, current_y)
    const res2 = validBishopMove(board, current_x, current_y);

    const canMoveTo = []
    const canCut = []
    for (let i = 0; i < res1.canMoveto.length; i++) {
        canMoveTo.push(res1.canMoveto[i])
    }
    for (let i = 0; i < res2.canMoveto.length; i++) {
        canMoveTo.push(res2.canMoveto[i])
    }
    for (let i = 0; i < res1.canCut.length; i++) {
        canCut.push(res1.canCut[i])
    }
    for (let i = 0; i < res2.canCut.length; i++) {
        canCut.push(res2.canCut[i])
    }

    return {
        canMoveto: canMoveTo,
        canCut
    }
}

function isCheck(board: Board, goal_x: coordinate, goal_y: coordinate) {
    const current_piece = board.getBoard()[goal_x][goal_y]
    if (!current_piece) return {
        check: false,
        king: null
    };

    const res = moveTo(board, goal_x, goal_y)
    if (!res?.canCut.length) return {
        check: false,
        king: null
    };
    for (let i = 0; i < res.canCut.length; i++) {
        const piece = board.getBoard()[res.canCut[i].x][res.canCut[i].y]
        if (piece?.name == "king" && piece.color != current_piece.color) {
            return {
                check: true,
                king: {
                    x: res.canCut[i].x,
                    y: res.canCut[i].y
                }
            };
        }
    }
    return {
        check: false,
        king: null
    };

}

function isCheckMate(board: Board, kingsLocation: location, goal_x: coordinate, goal_y: coordinate) {
    const king = board.getBoard()[kingsLocation.x][kingsLocation.y]
    if (!king) return false;

    const res = moveTo(board, kingsLocation.x, kingsLocation.y);

    // if the king can move to a location where it is safe
    if (res?.canMoveto.length || res?.canCut.length) {
        outerloop:
        for (let i = 0; i < res.canMoveto.length; i++) {
            for (let j = 0; j < board.getBoard().length; j++) {
                for (let k = 0; k < board.getBoard()[j].length; k++) {
                    const piece = board.getBoard()[j][k];
                    if (piece && piece?.color != king.color && piece.name != "king") {
                        board.getBoard()[res.canMoveto[i].x][res.canMoveto[i].y] = board.getBoard()[kingsLocation.x][kingsLocation.y]
                        board.getBoard()[kingsLocation.x][kingsLocation.y] = null;
                        const move = moveTo(board, j as number, k as number)
                        board.getBoard()[kingsLocation.x][kingsLocation.y] = board.getBoard()[res.canMoveto[i].x][res.canMoveto[i].y];
                        board.getBoard()[res.canMoveto[i].x][res.canMoveto[i].y] = null;
                        const cut = move?.canCut.some(coords => coords.x == res.canMoveto[i].x && coords.y == res.canMoveto[i].y)
                        if (cut) {
                            continue outerloop;
                        }
                    }
                }
            }
            return false;
        }

        // if the king can move to a location where it can cut someone and be safe
        outerloop2:
        for (let i = 0; i < res.canCut.length; i++) {
            const cuttedOne = board.getBoard()[res.canCut[i].x][res.canCut[i].y]
            for (let j = 0; j < board.getBoard().length; j++) {
                for (let k = 0; k < board.getBoard()[j].length; k++) {
                    const piece = board.getBoard()[j][k];
                    if (piece && piece != cuttedOne && piece?.color != king.color && piece.name != "king") {
                        board.getBoard()[res.canCut[i].x][res.canCut[i].y] = board.getBoard()[kingsLocation.x][kingsLocation.y]
                        board.getBoard()[kingsLocation.x][kingsLocation.y] = null;
                        const move = moveTo(board, j as number, k as number)
                        board.getBoard()[kingsLocation.x][kingsLocation.y] = board.getBoard()[res.canCut[i].x][res.canCut[i].y];
                        board.getBoard()[res.canCut[i].x][res.canCut[i].y] = cuttedOne;
                        const cut = move?.canCut.some(coords => coords.x == res.canCut[i].x && coords.y == res.canCut[i].y)
                        if (cut) {
                            continue outerloop2;
                        }
                    }
                }
            }
            return false;
        }

    }

    // if our piece can save by coming in between
    for (let i = 0; i < board.getBoard().length; i++) {
        for (let j = 0; j < board.getBoard()[i].length; j++) {
            const piece = board.getBoard()[i][j];
            if (piece && piece?.color == king.color && piece != king) {
                const move = moveTo(board, piece?.position?.x as number, piece?.position?.y as number)
                if (move && (move.canCut.length != 0 || move?.canMoveto.length != 0)) {
                    const cut = move?.canCut.some((coords) => coords.x == goal_x && coords.y == goal_y)
                    if (cut) {
                        return false;
                    }
                    for (let k = 0; k < move?.canMoveto.length; k++) {
                        const pos = move.canMoveto[k];
                        board.getBoard()[pos.x][pos.y] = piece;
                        board.getBoard()[i][j] = null;
                        const move2 = moveTo(board, goal_x, goal_y);
                        const cut = move2?.canCut.some((coords) => coords.x == kingsLocation.x && coords.y == kingsLocation.y)
                        const cut2 = move2?.canCut.some((coords) => coords.x == pos.x && coords.y == pos.y)
                        board.getBoard()[i][j] = piece;
                        board.getBoard()[pos.x][pos.y] = null;
                        if (!cut && cut2) {
                            return false;
                        }
                    }
                }
            }
        }
    }

    // if our piece can cut the piece which gave check
    for (let i = 0; i < board.getBoard().length; i++) {
        for (let j = 0; j < board.getBoard()[i].length; j++) {
            const piece = board.getBoard()[i][j];
            if (piece && piece.color == board.getBoard()[kingsLocation.x][kingsLocation.y]?.color && piece.name != "king") {
                const move = moveTo(board, i, j);
                const cut = move?.canCut.some((coords) => coords.x == goal_x && coords.y == goal_y)
                if (cut) {
                    return false;
                }
            }
        }
    }

    return true;

}

function moveTo(board: Board, current_x: number, current_y: number): response | null {
    if (!(current_x >= 0 && current_x <= 7)) return null;
    if (!(current_y >= 0 && current_y <= 7)) return null;

    const piece = board.getBoard()[current_x][current_y];
    if (!piece) {
        return null;
    }

    const name = piece.name

    switch (name) {
        case "rook":
            return validRookMove(board.getBoard(), current_x as coordinate, current_y as coordinate);

        case "pawn":
            return validPawnMove(board.getBoard(), current_x as coordinate, current_y as coordinate);

        case "bishop":
            return validBishopMove(board.getBoard(), current_x as coordinate, current_y as coordinate);

        case "knight":
            return validKnightMove(board.getBoard(), current_x as coordinate, current_y as coordinate);

        case "king":
            return validKingMove(board, current_x as coordinate, current_y as coordinate);

        case "queen":
            return validQueenMove(board.getBoard(), current_x as coordinate, current_y as coordinate)
    }
}

function validRookMoveAfterCheck(Check: check, board: Board, current_x: coordinate, current_y: coordinate){
    const response = validRookMove(board.getBoard(), current_x, current_y);

    const cut = response.canCut.some((coords) => coords.x == Check.enemysLocation.x && coords.y == Check.enemysLocation.y)
    if(cut){
        return response
    }

    for(let i=0;i<response.canMoveto.length;i++){
        const loc = response.canMoveto[i];
        board.getBoard()[loc.x][loc.y] = board.getBoard()[current_x][current_y];
        board.getBoard()[current_x][current_y] = null;
        const check = isCheck(board,Check.enemysLocation.x, Check.enemysLocation.y)
        board.getBoard()[current_x][current_y] = board.getBoard()[loc.x][loc.y]
        board.getBoard()[loc.x][loc.y] = null; 
        if(!check.check){
            return response
        }
    }
    return {
        canMoveto: [],
        canCut: []
    }

}

function validPawnMoveAfterCheck(Check: check, board: Board, current_x: coordinate, current_y: coordinate){
    const response = validPawnMove(board.getBoard(), current_x, current_y);
    const cut = response.canCut.some((coords) => coords.x == Check.enemysLocation.x && coords.y == Check.enemysLocation.y)
    if(cut){
        return response
    }
    for(let i=0;i<response.canMoveto.length;i++){
        const loc = response.canMoveto[i];
        board.getBoard()[loc.x][loc.y] = board.getBoard()[current_x][current_y];
        board.getBoard()[current_x][current_y] = null;
        const check = isCheck(board,Check.enemysLocation.x, Check.enemysLocation.y)
        board.getBoard()[current_x][current_y] = board.getBoard()[loc.x][loc.y]
        board.getBoard()[loc.x][loc.y] = null; 
        if(!check.check){
            return response
        }
    }
    return {
        canMoveto: [],
        canCut: []
    }

}

function validBishopMoveAfterCheck(Check: check, board: Board, current_x: coordinate, current_y: coordinate){
    const response = validBishopMove(board.getBoard(), current_x, current_y);
    const cut = response.canCut.some((coords) => coords.x == Check.enemysLocation.x && coords.y == Check.enemysLocation.y)
    if(cut){
        return response
    }
    for(let i=0;i<response.canMoveto.length;i++){
        const loc = response.canMoveto[i];
        board.getBoard()[loc.x][loc.y] = board.getBoard()[current_x][current_y];
        board.getBoard()[current_x][current_y] = null;
        const check = isCheck(board,Check.enemysLocation.x, Check.enemysLocation.y)
        board.getBoard()[current_x][current_y] = board.getBoard()[loc.x][loc.y]
        board.getBoard()[loc.x][loc.y] = null; 
        if(!check.check){
            return response
        }
    }
    return {
        canMoveto: [],
        canCut: []
    }

}

function validKnightMoveAfterCheck(Check: check, board: Board, current_x: coordinate, current_y: coordinate){
    const response = validKnightMove(board.getBoard(), current_x, current_y);
    const cut = response.canCut.some((coords) => coords.x == Check.enemysLocation.x && coords.y == Check.enemysLocation.y)
    if(cut){
        return response
    }
    for(let i=0;i<response.canMoveto.length;i++){
        const loc = response.canMoveto[i];
        board.getBoard()[loc.x][loc.y] = board.getBoard()[current_x][current_y];
        board.getBoard()[current_x][current_y] = null;
        const check = isCheck(board,Check.enemysLocation.x, Check.enemysLocation.y)
        board.getBoard()[current_x][current_y] = board.getBoard()[loc.x][loc.y]
        board.getBoard()[loc.x][loc.y] = null; 
        if(!check.check){
            return response
        }
    }
    return {
        canMoveto: [],
        canCut: []
    }

}

function validKingMoveAfterCheck(Check: check, board: Board, current_x: coordinate, current_y: coordinate){
    const response = validKingMove(board, current_x, current_y);
    const cut = response.canCut.some((coords) => coords.x == Check.enemysLocation.x && coords.y == Check.enemysLocation.y)
    if(cut){
        return response
    }
    for(let i=0;i<response.canMoveto.length;i++){
        const loc = response.canMoveto[i];
        board.getBoard()[loc.x][loc.y] = board.getBoard()[current_x][current_y];
        board.getBoard()[current_x][current_y] = null;
        const check = isCheck(board,Check.enemysLocation.x, Check.enemysLocation.y)
        board.getBoard()[current_x][current_y] = board.getBoard()[loc.x][loc.y]
        board.getBoard()[loc.x][loc.y] = null; 
        if(!check.check){
            return response
        }
    }
    return {
        canMoveto: [],
        canCut: []
    }

}

function validQueenMoveAfterCheck(Check: check, board: Board, current_x: coordinate, current_y: coordinate){
    const response = validQueenMove(board.getBoard(), current_x, current_y);
    const cut = response.canCut.some((coords) => coords.x == Check.enemysLocation.x && coords.y == Check.enemysLocation.y)
    if(cut){
        return response
    }
    for(let i=0;i<response.canMoveto.length;i++){
        const loc = response.canMoveto[i];
        board.getBoard()[loc.x][loc.y] = board.getBoard()[current_x][current_y];
        board.getBoard()[current_x][current_y] = null;
        const check = isCheck(board,Check.enemysLocation.x, Check.enemysLocation.y)
        board.getBoard()[current_x][current_y] = board.getBoard()[loc.x][loc.y]
        board.getBoard()[loc.x][loc.y] = null; 
        if(!check.check){
            return response
        }
    }
    return {
        canMoveto: [],
        canCut: []
    }

}