export class Input {
  constructor(canvas, scene, board) {
    this.scene = scene;
    this.board = board;

    canvas.addEventListener("mousedown", (e) => {
      const rect = canvas.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.scene.click(x, y);
    });
  }
}