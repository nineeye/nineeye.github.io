import SlidingPuzzle
from "../../games/sliding-puzzle/sliding.js";



export default class SlidingPuzzleScene {



constructor(
input,
level,
audio
){


this.input=input;

this.level=level;

this.audio=audio;



this.game =
new SlidingPuzzle(

level.size,

audio

);



}



enter(){


this.createUI();



this.input.on(

data=>{


this.game.input(data);



}

);



}



createUI(){


const ui =
document.createElement("div");



ui.style.position="absolute";


ui.style.top="20px";


ui.style.right="20px";


ui.style.zIndex="999";



const makeBtn=(text)=>{


const b=document.createElement("button");


b.innerText=text;


b.style.fontSize="20px";


b.style.margin="5px";


return b;



};



const home =
makeBtn("HOME");


home.onclick=()=>{


location.reload();


};



const restart =
makeBtn("RESTART");


restart.onclick=()=>{


this.game.restart();


};



const quit =
makeBtn("QUIT");


quit.onclick=()=>{


this.game.finished=true;


};



ui.appendChild(home);


ui.appendChild(restart);


ui.appendChild(quit);



document.body.appendChild(ui);



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



ctx.fillStyle="white";


ctx.font="22px Arial";



ctx.fillText(

"LEVEL : "+this.level.id,

40,

40

);



ctx.fillText(

"MOVE : "+this.game.moves,

40,

75

);



if(this.game.finished){



ctx.font="45px Arial";


ctx.fillStyle="#00ff00";


ctx.fillText(

"COMPLETE!",

window.innerWidth/2-120,

120

);



}



}



}
