import SlidingPuzzle
from "../../games/sliding-puzzle/sliding.js";


import ResultUI
from "../../ui/result.js";



export default class SlidingPuzzleScene {



constructor(
input,
level,
audio
){


this.input=input;

this.level=level;

this.audio=audio;


this.game=
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



const box=document.createElement("div");


box.style.position="absolute";


box.style.top="20px";


box.style.left="20px";


box.style.zIndex=10;



const home=document.createElement("button");


home.innerText="HOME";


home.onclick=()=>{


location.reload();


};



const restart=document.createElement("button");


restart.innerText="RESTART";


restart.onclick=()=>{


this.game.restart();


};



[home,restart].forEach(b=>{


b.style.fontSize="20px";


b.style.margin="5px";


box.appendChild(b);


});



document.body.appendChild(box);



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


ctx.font="25px Arial";


ctx.fillText(

"LEVEL : "+this.level.id,

20,

50

);


ctx.fillText(

"MOVE : "+this.game.moves,

20,

85

);



}



}
