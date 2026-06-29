import SlidingPuzzle
from "../../games/sliding-puzzle/sliding.js";



export default class SlidingPuzzleScene {



constructor(){


this.game =
new SlidingPuzzle();



}



enter(){



console.log(

"Sliding Puzzle Running"

);



window.addEventListener(

"click",

(e)=>{


this.game.click(

e.clientX,

e.clientY

);


}

);



}



update(){


this.game.update();



}



draw(ctx){



ctx.fillStyle="#000";


ctx.fillRect(

0,

0,

ctx.canvas.width,

ctx.canvas.height

);



this.game.draw(ctx);



}



}
