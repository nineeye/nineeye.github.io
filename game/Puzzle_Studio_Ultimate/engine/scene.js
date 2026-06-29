export class SceneManager {
  constructor(engine) {
    this.engine = engine;
    this.board = engine.board;

    this.btnReset = { x: 20, y: 20, w: 100, h: 40 };
    this.btnHome = { x: 130, y: 20, w: 100, h: 40 };
  }

  render(renderer) {
    const ctx = renderer.ctx;

    this.board.render(renderer);

    // Moves
    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.fillText("Moves: " + this.board.moves, 20, 120);

    // buttons
    this.drawButton(ctx, this.btnReset, "RESET");
    this.drawButton(ctx, this.btnHome, "HOME");
  }

  drawButton(ctx, b, text) {
    ctx.fillStyle = "#444";
    ctx.fillRect(b.x, b.y, b.w, b.h);

    ctx.fillStyle = "#fff";
    ctx.fillText(text, b.x + 20, b.y + 25);
  }

  click(x, y) {
    if (this.hit(x, y, this.btnReset)) {
      this.board.reset();
      return;
    }

    if (this.hit(x, y, this.btnHome)) {
      this.board.reset();
      return;
    }

    const tile = this.board.getTileByPixel(x, y);
    if (tile && this.board.nearEmpty(tile)) {
      this.board.move(tile);
    }
  }

  hit(x, y, b) {
    return x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h;
  }
}