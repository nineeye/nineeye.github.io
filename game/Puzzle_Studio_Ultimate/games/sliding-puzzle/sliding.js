import Board from "./board.js";


export default class SlidingPuzzle {


constructor(size=3){


this.size=size;


this.board =
new Board(size);



this.moveCount=0;


this.finished=false;


}



restart(){


this.board =
new Board(this.size);



this.board.shuffle();



this.moveCount=0;


this.finished=false;



}



update(){


if(
!this.finished &&
this.board.isComplete()
){


this.finished=true;


}



}



click(x,y){



if(this.finished)
return;



const before =
this.moveCount;



this.board.click(
x,
y
);



const after =
this.board.tiles
.map(t=>t.value)
.join(",");



if(before !== after){

this.moveCount++;

}



}



draw(ctx){



this.board.draw(ctx);



ctx.fillStyle="#fff";


ctx.font="20px Arial";


ctx.fillText(

"Moves : "
+
this.moveCount,

20,

350

);



if(this.finished){



ctx.fillStyle="#0f0";


ctx.font="40px Arial";


ctx.fillText(

"COMPLETE!",

60,

450

);



}



}



}
