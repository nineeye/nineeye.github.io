export class Board {
  constructor(size = 4) {
    this.size = size;

    this.tileSize = 100;
    this.offsetX = 50;
    this.offsetY = 50;

    this.tiles = [];
    this.empty = { x: size - 1, y: size - 1 };

    this.moves = 0;
    this.won = false;

    this.init();
    this.shuffle(120);
  }

  init() {
    let id = 1;

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (x === this.size - 1 && y === this.size - 1) continue;

        this.tiles.push({ x, y, id });
        id++;
      }
    }
  }

  reset() {
    this.tiles = [];
    this.empty = { x: this.size - 1, y: this.size - 1 };
    this.moves = 0;
    this.won = false;

    this.init();
    this.shuffle(120);
  }

  shuffle(n) {
    for (let i = 0; i < n; i++) {
      const movable = this.tiles.filter(t => this.nearEmpty(t));
      const pick = movable[Math.floor(Math.random() * movable.length)];
      if (pick) this.swap(pick);
    }
  }

  swap(t) {
    const ex = this.empty.x;
    const ey = this.empty.y;

    this.empty.x = t.x;
    this.empty.y = t.y;

    t.x = ex;
    t.y = ey;

    this.moves++;
  }

  getTileAt(x, y) {
    return this.tiles.find(t => t.x === x && t.y === y);
  }

  getTileByPixel(px, py) {
    const s = this.tileSize;

    const x = Math.floor((px - this.offsetX) / s);
    const y = Math.floor((py - this.offsetY) / s);

    return this.getTileAt(x, y);
  }

  nearEmpty(t) {
    return Math.abs(t.x - this.empty.x) + Math.abs(t.y - this.empty.y) === 1;
  }

  move(t) {
    this.swap(t);
  }

  render(renderer) {
    const s = this.tileSize;

    for (const t of this.tiles) {
      const x = this.offsetX + t.x * s;
      const y = this.offsetY + t.y * s;

      renderer.drawTile(t, x, y, s);
    }
  }
}