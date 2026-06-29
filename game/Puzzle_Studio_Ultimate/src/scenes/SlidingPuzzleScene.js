export default class SlidingPuzzleScene{


constructor(){

    this.time=0;

}



enter(){


console.log(
"Sliding Puzzle Loaded"
);


}



update(){

    this.time++;

}



draw(ctx){



ctx.fillStyle="#111";


ctx.fillRect(
0,
0,
ctx.canvas.width,
ctx.canvas.height
);



ctx.fillStyle="#fff";


ctx.font="32px Arial";


ctx.fillText(

"Puzzle Studio Ultimate",

50,

80

);



ctx.font="20px Arial";


ctx.fillText(

"Sliding Puzzle Engine Ready",

50,

130

);



}



}
