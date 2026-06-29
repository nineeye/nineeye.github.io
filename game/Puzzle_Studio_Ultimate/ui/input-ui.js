// ui/input-ui.js (UI hit system 정리)
export class UIInput {
  constructor(ui, engine) {
    this.ui = ui;
    this.engine = engine;

    engine.canvas.addEventListener("mousedown", (e) => this.click(e));
  }

  click(e) {
    const x = e.clientX;
    const y = e.clientY;

    if (this.ui.state === "menu") {
      if (this.hit(x, y, 120, 280, 200, 50)) this.ui.setState("game");
      if (this.hit(x, y, 120, 340, 200, 50)) this.ui.setState("select");
      if (this.hit(x, y, 120, 400, 200, 50)) this.ui.setState("settings");
    }
  }

  hit(x, y, rx, ry, rw, rh) {
    return x > rx && x < rx + rw && y > ry && y < ry + rh;
  }
}