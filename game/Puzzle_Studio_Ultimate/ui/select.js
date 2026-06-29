// ui/select.js
import { Difficulty } from "../game/difficulty.js";

export class Select {
  constructor(scene) {
    this.scene = scene;
    this.diff = new Difficulty();
  }

  click(x, y) {
    // difficulty select
    if (x > 100 && x < 400 && y > 200 && y < 260) this.diff.level = 1;
    if (x > 100 && x < 400 && y > 270 && y < 330) this.diff.level = 2;
    if (x > 100 && x < 400 && y > 340 && y < 400) this.diff.level = 3;

    // start button
    if (x > 100 && x < 400 && y > 450 && y < 520) {
      this.scene.board = new (this.scene.board.constructor)(this.diff.getSize());
      this.scene.state = "game";
    }
  }

  render(ctx) {
    ctx.fillStyle = "#0f0f14";
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    ctx.fillStyle = "#fff";
    ctx.font = "40px sans-serif";
    ctx.fillText("SELECT DIFFICULTY", 80, 120);

    ctx.font = "30px sans-serif";
    ctx.fillText("EASY (3x3)", 120, 230);
    ctx.fillText("NORMAL (4x4)", 120, 300);
    ctx.fillText("HARD (5x5)", 120, 370);

    ctx.fillText("START", 120, 500);
  }
}