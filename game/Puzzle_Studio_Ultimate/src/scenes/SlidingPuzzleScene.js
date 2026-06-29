import SlidingPuzzle
from "../../games/sliding-puzzle/sliding.js";


import ResultUI
from "../../ui/result.js";


import SaveManager
from "../core/SaveManager.js";



export default class SlidingPuzzleScene {



constructor(input,level,audio){



this.input=input;


this.audio=audio;



this.level=level;



this.game =
new SlidingPuzzle(

level,

audio

);



this.save =
new SaveManager();



this.result =
new ResultUI();



this.done=false;



}



enter(){



this.input.on(

data=>{


this.game.input(data);



}

);



}



update(){



this.game.update();



if(

this.game.finished

&&

!this.done

){


this.done=true;



this.save.setBest(

this.level.size,

this.game.moves

);



this.result.show(

this.game.moves

);



this.result.onAgain(()=>{


this.result.hide();


this.game.restart();



this.done=false;



});



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
