import { Board } from "../games/sliding-puzzle/board.js";
import { Renderer } from "./render.js";
import { SceneManager } from "./scene.js";
import { Input } from "./input.js";

class Engine {
  constructor() {
    this.canvas = document.getElementById("game");
    this.ctx = this.canvas.getContext("2d");

    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.board = new Board(4);
    this.renderer = new Renderer(this.ctx);
    this.scene = new SceneManager(this);

    this.input = new Input(this.canvas, this.scene, this.board);

    this.loop();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.scene.render(this.renderer);

    requestAnimationFrame(() => this.loop());
  }
}

new Engine();