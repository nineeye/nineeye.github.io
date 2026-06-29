// games/sliding-puzzle/tile.js
export class Tile {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.id = id;

    this.tx = x;
    this.ty = y;

    this.progress = 0;
  }

  setTarget(x, y) {
    this.tx = x;
    this.ty = y;
    this.progress = 1;
  }

  update(dt) {
    if (this.progress > 0) {
      this.progress -= 0.2;
      if (this.progress < 0) this.progress = 0;
    }
  }
}