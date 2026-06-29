import Board
from "./board.js";



export default class SlidingPuzzle {



constructor(config,audio){



this.config=config;


this.audio=audio;



this.board =
new Board(

config.size

);



this.board.shuffle();



this.moves=0;


this.finished=false;



}



restart(){



this.board =
new Board(

this.config.size

);



this.board.shuffle();


this.moves=0;


this.finished=false;



}



input(data){



if(this.finished)
return;



let moved=false;



if(data.type==="click"){



this.board.click(

data.x,

data.y

);



moved=true;



}



if(

data.type==="key"

||

data.type==="swipe"

){


this.board.move(

data.direction

);



moved=true;



}



if(moved){


this.moves++;


if(this.audio)

this.audio.play(
"move"
);



}



}



update(){



if(

this.board.isComplete()

&&

!this.finished

){


this.finished=true;



if(this.audio)

this.audio.play(
"win"
);



}



}



draw(ctx){



this.board.draw(ctx);



ctx.fillStyle="#fff";


ctx.font="20px Arial";



ctx.fillText(

"LEVEL : "

+

this.config.id,

20,

360

);



ctx.fillText(

"MOVE : "

+

this.moves,

20,

400

);



}



}
