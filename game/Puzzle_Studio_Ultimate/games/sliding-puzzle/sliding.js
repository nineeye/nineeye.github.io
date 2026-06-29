import Board from "./board.js";



export default class SlidingPuzzle {



constructor(){


this.board =
new Board(3);



this.board.shuffle();



}



update(){



}



click(x,y){


this.board.click(
x,
y
);



}



draw(ctx){


this.board.draw(ctx);



}



}
