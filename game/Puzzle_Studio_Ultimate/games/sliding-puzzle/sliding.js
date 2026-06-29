import { Board } from "./board.js";

export class SlidingPuzzle {
  constructor(engine) {
    this.engine = engine;
    this.board = new Board(4);
  }

  update(dt) {
    this.board.update(dt);
  }

  render(renderer) {
    this.board.render(renderer);
  }
}