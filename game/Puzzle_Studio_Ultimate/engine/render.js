export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  drawTile(t, x, y, s) {
    this.ctx.fillStyle = "#444";
    this.ctx.fillRect(x, y, s - 4, s - 4);

    this.ctx.fillStyle = "#fff";
    this.ctx.font = "20px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    this.ctx.fillText(t.id, x + s / 2, y + s / 2);
  }

  drawWin() {
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "40px Arial";
    this.ctx.fillText("CLEAR", 200, 200);
  }
}