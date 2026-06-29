// ui/hud.js
export class HUD {
  constructor(scene) {
    this.scene = scene;
    this.moves = 0;
    this.time = 0;
  }

  addMove() {
    this.moves++;
  }

  update(dt) {
    this.time += dt;
  }

  formatTime() {
    const s = Math.floor(this.time / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  }

  render(ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px sans-serif";

    ctx.fillText(`Moves: ${this.moves}`, 20, 30);
    ctx.fillText(`Time: ${this.formatTime()}`, 20, 60);
  }
}