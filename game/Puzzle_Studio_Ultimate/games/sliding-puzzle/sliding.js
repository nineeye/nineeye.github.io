import Board
from "./board.js";



export default class SlidingPuzzle {



constructor(size=3){


this.size=size;


this.board =
new Board(size);


this.board.shuffle();



this.moves=0;


}



restart(){


this.board =
new Board(this.size);


this.board.shuffle();


this.moves=0;


}



click(x,y){


const old =
this.board.tiles
.map(t=>t.value)
.join();



this.board.click(
x,
y
);



const now =
this.board.tiles
.map(t=>t.value)
.join();



if(old!==now){

this.moves++;

}



}



update(){



}



draw(ctx){


this.board.draw(ctx);



ctx.fillStyle="#fff";


ctx.font="22px Arial";


ctx.fillText(

"SIZE : "
+
this.size
+
"x"
+
this.size,

20,

350

);



ctx.fillText(

"MOVE : "
+
this.moves,

20,

390

);



if(this.board.isComplete()){


ctx.font="40px Arial";


ctx.fillStyle="#00ff00";


ctx.fillText(

"WIN!",

100,

480

);



}



}



}
