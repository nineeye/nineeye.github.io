// ui/menu.js (final state switch fix)
export class Menu {
  constructor(scene) {
    this.scene = scene;
  }

  click(x, y) {
    if (x > 120 && x < 320 && y > 280 && y < 330) {
      this.scene.setState("game");
    }

    if (x > 120 && x < 320 && y > 340 && y < 390) {
      this.scene.setState("select");
    }

    if (x > 120 && x < 320 && y > 400 && y < 450) {
      this.scene.setState("settings");
    }
  }

  render(ctx) {
    ctx.fillStyle = "#0f0f14";
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    ctx.fillStyle = "#fff";
    ctx.font = "50px sans-serif";
    ctx.fillText("PUZZLE STUDIO", 100, 150);

    ctx.font = "30px sans-serif";
    ctx.fillText("START", 120, 300);
    ctx.fillText("SELECT", 120, 360);
    ctx.fillText("SETTINGS", 120, 420);
  }
}