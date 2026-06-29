export default class Tile {


constructor(value,x,y,size){


this.value=value;

this.x=x;

this.y=y;

this.size=size;



}



contains(mx,my){


return (

mx >= this.x &&

mx <= this.x + this.size &&

my >= this.y &&

my <= this.y + this.size

);



}



draw(ctx){


ctx.fillStyle =
this.value === 0
? "#000"
: "#333";


ctx.fillRect(

this.x,

this.y,

this.size-5,

this.size-5

);



if(this.value !== 0){


ctx.fillStyle="#fff";


ctx.font="28px Arial";


ctx.textAlign="center";

ctx.textBaseline="middle";


ctx.fillText(

this.value,

this.x+this.size/2,

this.y+this.size/2

);


}



}


}
