import SlidingPuzzle
from "../../games/sliding-puzzle/sliding.js";



export default class SlidingPuzzleScene {



constructor(input){


this.input=input;


this.game =
new SlidingPuzzle(3);



this.createUI();



}



createUI(){



const button =
document.createElement("button");



button.innerText =
"NEW GAME";



button.style.position =
"absolute";


button.style.top =
"20px";


button.style.right =
"20px";


button.style.padding =
"10px";



button.onclick =
()=>{


this.game.restart();



};



document.body.appendChild(button);



}



enter(){



console.log(

"Sliding Puzzle Scene"

);



this.input.on(

(x,y)=>{


this.game.click(

x,

y

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
