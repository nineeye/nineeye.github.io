import Board
from "./board.js";



export default class SlidingPuzzle {


constructor(size=3){


this.board =
new Board(size);


this.board.shuffle();



this.moves=0;


this.finished=false;



}



restart(){


this.board =
new Board(this.board.size);


this.board.shuffle();


this.moves=0;


this.finished=false;



}



input(data){



if(this.finished)
return;



if(data.type==="click"){


this.board.click(

data.x,

data.y

);


}



if(data.type==="key" ||
data.type==="swipe"){


this.board.move(

data.direction

);


}



this.moves++;



}



update(){



if(this.board.isComplete())

this.finished=true;



}



draw(ctx){


this.board.draw(ctx);


ctx.fillStyle="#fff";

ctx.font="20px Arial";


ctx.fillText(

"MOVE : "+this.moves,

20,

400

);



}



}
