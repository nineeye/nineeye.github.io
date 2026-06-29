import SlidingPuzzle
from "../../games/sliding-puzzle/sliding.js";


import SaveManager
from "../core/SaveManager.js";


import UIManager
from "../../ui/ui.js";


import ResultUI
from "../../ui/result.js";



export default class SlidingPuzzleScene {



constructor(input,size=3){


this.input=input;


this.size=size;



this.game =
new SlidingPuzzle(size);



this.save =
new SaveManager();



this.ui =
new UIManager();



this.result =
new ResultUI();



this.finished=false;



}



enter(){



this.ui.button(

"RESTART",

()=>{


this.game.restart();



}

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



if(

this.game.finished &&

!this.finished

){


this.finished=true;



this.result.show(

"COMPLETE!"

);



this.save.setBest(

this.size,

this.game.moves

);



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



}



}
