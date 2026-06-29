// ui/button.js
export class Button {
  constructor(text, x, y, w, h, onClick) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.onClick = onClick;

    this.hover = false;
  }

  check(x, y) {
    this.hover =
      x > this.x &&
      x < this.x + this.w &&
      y > this.y &&
      y < this.y + this.h;
  }

  click(x, y) {
    if (this.hover && this.onClick) this.onClick();
  }

  render(ctx) {
    ctx.fillStyle = this.hover ? "#3a3f55" : "#222533";
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = "#fff";
    ctx.font = "20px sans-serif";
    ctx.fillText(this.text, this.x + 20, this.y + 30);
  }
}