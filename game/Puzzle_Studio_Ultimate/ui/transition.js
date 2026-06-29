// ui/transition.js
export class Transition {
  constructor() {
    this.alpha = 0;
    this.state = "idle"; // in | out | idle
    this.speed = 0.05;
  }

  fadeOut(cb) {
    this.state = "out";
    this.cb = cb;
  }

  fadeIn() {
    this.state = "in";
  }

  update() {
    if (this.state === "out") {
      this.alpha += this.speed;
      if (this.alpha >= 1) {
        this.alpha = 1;
        this.state = "idle";
        if (this.cb) this.cb();
      }
    }

    if (this.state === "in") {
      this.alpha -= this.speed;
      if (this.alpha <= 0) {
        this.alpha = 0;
        this.state = "idle";
      }
    }
  }

  render(ctx) {
    if (this.alpha <= 0) return;

    ctx.fillStyle = `rgba(0,0,0,${this.alpha})`;
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }
}