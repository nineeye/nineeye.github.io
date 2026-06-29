// game/session.js
export class Session {
  constructor() {
    this.bestMoves = Infinity;
    this.bestTime = Infinity;
  }

  submit(moves, time) {
    if (moves < this.bestMoves) this.bestMoves = moves;
    if (time < this.bestTime) this.bestTime = time;
  }

  getBest() {
    return {
      moves: this.bestMoves,
      time: this.bestTime
    };
  }
}