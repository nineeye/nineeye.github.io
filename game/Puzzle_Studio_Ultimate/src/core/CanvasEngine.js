import GameLoop from "./GameLoop.js";
import SceneManager from "./SceneManager.js";
import InputManager from "./InputManager.js";

export default class CanvasEngine {

    constructor(id) {

        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext("2d");

        this.sceneManager = new SceneManager();
        this.input = new InputManager(this.canvas);

        this.resize();

        window.addEventListener("resize", () => this.resize());

        this.loop = new GameLoop(

            (dt) => {

                this.sceneManager.update(dt);

            },

            () => {

                this.clear();

                this.sceneManager.render(this.ctx);

                if (this.sceneManager.current?.updateInput) {
                    this.sceneManager.current.updateInput(this.input);
                }

                this.input.reset();

            }

        );

    }

    resize() {

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

    }

    clear() {

        this.ctx.fillStyle = "#151515";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    }

    start(scene) {

        this.sceneManager.change(scene);

        this.loop.start();

    }

}