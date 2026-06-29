import SlidingPuzzle
from "../../games/sliding-puzzle/sliding.js";



export default class SlidingPuzzleScene {



constructor(input,size=3){


this.input=input;


this.size=size;


this.game =
new SlidingPuzzle(size);



this.createUI();



}



createUI(){


const button =
document.createElement("button");



button.innerText =
"RESTART";



button.style.position =
"absolute";


button.style.top =
"20px";


button.style.right =
"20px";



button.onclick =
()=>{


this.game.restart();



};



document.body.appendChild(button);



}



enter(){



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
