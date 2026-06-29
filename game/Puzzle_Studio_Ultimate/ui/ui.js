// ui/ui.js
export class UI {
  constructor(engine) {
    this.engine = engine;
    this.state = "menu"; // menu | game | select
  }

  setState(state) {
    this.state = state;
  }

  update(dt) {}

  render(renderer) {
    if (this.state === "menu") this.drawMenu(renderer);
    if (this.state === "select") this.drawSelect(renderer);
  }

  drawMenu(r) {
    r.ctx.fillStyle = "#0f0f14";
    r.ctx.fillRect(0, 0, innerWidth, innerHeight);

    r.ctx.fillStyle = "#fff";
    r.ctx.font = "50px sans-serif";
    r.ctx.fillText("PUZZLE STUDIO", 100, 150);

    r.ctx.font = "30px sans-serif";
    r.ctx.fillText("START", 120, 300);
    r.ctx.fillText("SELECT", 120, 360);
    r.ctx.fillText("SETTINGS", 120, 420);
  }

  drawSelect(r) {
    r.ctx.fillStyle = "#111";
    r.ctx.fillRect(0, 0, innerWidth, innerHeight);

    r.ctx.fillStyle = "#fff";
    r.ctx.font = "30px sans-serif";
    r.ctx.fillText("SELECT PUZZLE", 100, 150);

    r.ctx.fillText("SLIDING PUZZLE", 120, 250);
  }
}