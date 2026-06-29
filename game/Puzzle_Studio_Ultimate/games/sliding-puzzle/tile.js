export default class Tile {


constructor(value,x,y,size){


this.value=value;


this.x=x;


this.y=y;


this.targetX=x;


this.targetY=y;


this.size=size;



}



moveTo(x,y){


this.targetX=x;


this.targetY=y;



}



update(){


this.x +=
(this.targetX-this.x)*0.25;



this.y +=
(this.targetY-this.y)*0.25;



}



contains(mx,my){


return (

mx>=this.x &&

mx<=this.x+this.size &&

my>=this.y &&

my<=this.y+this.size

);



}



draw(ctx){


this.update();



if(this.value===0)
return;



ctx.fillStyle="#333";

ctx.fillRect(

this.x,

this.y,

this.size-5,

this.size-5

);



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
