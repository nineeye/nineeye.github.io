import Scene from "../core/Scene.js";
import Button from "../ui/Button.js";

export default class MenuScene extends Scene {

    constructor() {

        super();

        this.playButton = new Button(
            100,
            180,
            250,
            70,
            "PLAY",
            () => {
                console.log("Play Button");
            }
        );

    }

    update(dt) {

    }

    updateInput(input) {

        if (
            input.mouse.clicked &&
            this.playButton.contains(
                input.mouse.x,
                input.mouse.y
            )
        ) {

            alert("다음부터 Sliding Puzzle로 이동!");

        }

    }

    render(ctx) {

        ctx.fillStyle = "#202020";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.fillStyle = "#ffffff";
        ctx.font = "52px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        ctx.fillText("Puzzle Studio Ultimate", 100, 100);

        this.playButton.draw(ctx);

    }

}