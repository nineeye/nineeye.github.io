import Scene from "../core/Scene.js";

export default class SlidingPuzzleScene extends Scene {

    constructor() {

        super();

        this.x = 100;
        this.y = 100;
        this.size = 120;

    }

    update(dt) {

    }

    updateInput(input) {

        if (input.mouse.clicked) {

            this.x += 20;

            if (this.x > 700) {
                this.x = 100;
            }

        }

    }

    render(ctx) {

        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.font = "42px Arial";
        ctx.fillText("Sliding Puzzle", 100, 70);

        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(
            this.x,
            this.y,
            this.size,
            this.size
        );

    }

}