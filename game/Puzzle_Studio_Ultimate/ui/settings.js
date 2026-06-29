// ui/settings.js
export class Settings {
  constructor(ui) {
    this.ui = ui;

    this.sound = true;
    this.vibration = true;
    this.hint = true;
  }

  toggleSound() {
    this.sound = !this.sound;
  }

  toggleVibration() {
    this.vibration = !this.vibration;
  }

  toggleHint() {
    this.hint = !this.hint;
  }

  render(ctx) {
    ctx.fillStyle = "#0f0f14";
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    ctx.fillStyle = "#fff";
    ctx.font = "30px sans-serif";

    ctx.fillText("SETTINGS", 100, 150);
    ctx.fillText(`SOUND: ${this.sound}`, 120, 250);
    ctx.fillText(`VIBRATION: ${this.vibration}`, 120, 300);
    ctx.fillText(`HINT: ${this.hint}`, 120, 350);
  }
}