// ui/result.js
export class Result {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;

    this.moves = 0;
    this.time = 0;
  }

  show(moves, time) {
    this.moves = moves;
    this.time = time;
    this.visible = true;
  }

  click(x, y) {
    if (!this.visible) return;

    if (x > 120 && x < 320 && y > 400 && y < 460) {
      this.visible = false;
      this.scene.setState("select");
    }
  }

  render(ctx) {
    if (!this.visible) return;

    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    ctx.fillStyle = "#fff";
    ctx.font = "40px sans-serif";
    ctx.fillText("CLEAR!", 120, 150);

    ctx.font = "25px sans-serif";
    ctx.fillText(`Moves: ${this.moves}`, 120, 250);
    ctx.fillText(`Time: ${this.time}`, 120, 300);

    ctx.fillText("BACK", 120, 430);
  }
}