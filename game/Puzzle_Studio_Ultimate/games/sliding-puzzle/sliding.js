import Board
from "./board.js";



export default class SlidingPuzzle {


constructor(size=3){


this.size=size;


this.board =
new Board(size);



this.board.shuffle();



this.moves=0;


this.finished=false;



}



restart(){


this.board =
new Board(this.size);



this.board.shuffle();


this.moves=0;


this.finished=false;



}



click(x,y){



if(this.finished)
return;



const before =
this.board.tiles
.map(t=>t.value)
.join();



this.board.click(

x,

y

);



const after =
this.board.tiles
.map(t=>t.value)
.join();



if(before!==after){


this.moves++;



}



}



update(){


this.board.update();



if(this.board.isComplete()){


this.finished=true;



}



}



draw(ctx){


this.board.draw(ctx);



ctx.fillStyle="#fff";


ctx.font="20px Arial";


ctx.fillText(

"MOVE : "
+
this.moves,

20,

400

);



if(this.finished){


ctx.fillStyle="#00ff00";


ctx.font="40px Arial";


ctx.fillText(

"COMPLETE",

80,

480

);



}



}



}
