export default class Tile {


constructor(value,x,y,size){


this.value=value;

this.x=x;

this.y=y;

this.size=size;



}



draw(ctx){


ctx.fillStyle="#222";


ctx.fillRect(

this.x,

this.y,

this.size-5,

this.size-5

);



ctx.fillStyle="#fff";


ctx.font="24px Arial";


ctx.textAlign="center";


ctx.textBaseline="middle";


ctx.fillText(

this.value,

this.x+this.size/2,

this.y+this.size/2

);



}



}
