import Scene from "../core/Scene.js";

export default class BootScene extends Scene{

    render(ctx){

        ctx.fillStyle="#222";

        ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);

        ctx.fillStyle="#fff";

        ctx.font="40px Arial";

        ctx.fillText("Puzzle Studio Ultimate",50,80);

        ctx.font="22px Arial";

        ctx.fillText("Engine Boot Success",50,130);

    }

}