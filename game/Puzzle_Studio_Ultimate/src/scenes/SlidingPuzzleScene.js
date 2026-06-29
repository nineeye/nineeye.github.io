import SlidingPuzzle
from "../../games/sliding-puzzle/sliding.js";


import SaveManager
from "../core/SaveManager.js";



export default class SlidingPuzzleScene {



constructor(input,size=3){


this.input=input;


this.size=size;


this.game =
new SlidingPuzzle(size);



this.save =
new SaveManager();



this.best =
this.save.getBest(size);



this.finished=false;



this.createUI();



}



createUI(){



this.button =
document.createElement("button");



this.button.innerText =
"RESTART";



this.button.style.position =
"absolute";


this.button.style.top =
"20px";


this.button.style.right =
"20px";



this.button.onclick=()=>{


this.game.restart();



};



document.body.appendChild(
this.button
);



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



if(
this.game.finished &&
!this.finished

){


this.finished=true;



const saved =
this.save.setBest(

this.size,

this.game.moves

);



if(saved){


alert(

"NEW RECORD!"

);



}



}



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



ctx.fillStyle="#fff";


ctx.font="20px Arial";



ctx.fillText(

"BEST : "
+
(
this.best || "-"

),

20,

430

);



}



}
