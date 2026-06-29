// game/difficulty.js
export class Difficulty {
  constructor() {
    this.level = 1;
  }

  getSize() {
    if (this.level <= 1) return 3;
    if (this.level === 2) return 4;
    if (this.level === 3) return 5;
    return 6;
  }

  getShuffleMoves() {
    return 50 + this.level * 50;
  }

  next() {
    this.level++;
  }
}