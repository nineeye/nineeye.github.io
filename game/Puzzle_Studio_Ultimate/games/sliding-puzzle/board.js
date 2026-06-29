import Tile
from "./tile.js";


export default class Board {


constructor(size=3){


this.size=size;


this.tileSize =
Math.min(
window.innerWidth,
window.innerHeight
)
/
(size+1);



this.offsetX =
(
window.innerWidth -
this.tileSize*this.size
)/2;



this.offsetY =
(
window.innerHeight -
this.tileSize*this.size
)/2;



this.tiles=[];


this.create();



}



create(){


let n=1;


for(
let y=0;
y<this.size;
y++
){


for(
let x=0;
x<this.size;
x++
){



this.tiles.push(

new Tile(

n===this.size*this.size
?
0
:
n,


this.offsetX+x*this.tileSize,


this.offsetY+y*this.tileSize,


this.tileSize


)

);



n++;


}



}



}



shuffle(){


do{


this.tiles.sort(

()=>Math.random()-0.5

);


}

while(!this.isSolvable());


this.updatePosition();



}



isSolvable(){


let arr =
this.tiles
.filter(t=>t.value!==0)
.map(t=>t.value);



let inv=0;



for(
let i=0;
i<arr.length;
i++
){


for(
let j=i+1;
j<arr.length;
j++
){



if(arr[i]>arr[j])
inv++;



}



}



return inv%2===0;



}



updatePosition(){


this.tiles.forEach(

(t,i)=>{


t.moveTo(

this.offsetX+
(i%this.size)
*this.tileSize,


this.offsetY+
Math.floor(i/this.size)
*this.tileSize


);



}

);



}



click(x,y){


const index =
this.tiles.findIndex(

t=>t.contains(x,y)

);



if(index<0)return false;



const empty =
this.tiles.findIndex(

t=>t.value===0

);



const dx=Math.abs(

index%this.size -
empty%this.size

);



const dy=Math.abs(

Math.floor(index/this.size)
-
Math.floor(empty/this.size)

);



if(dx+dy===1){



[
this.tiles[index],
this.tiles[empty]

]=

[
this.tiles[empty],
this.tiles[index]

];



this.updatePosition();



return true;



}



return false;



}



draw(ctx){


this.tiles.forEach(

t=>t.draw(ctx)

);



}



isComplete(){


return this.tiles.every(

(t,i)=>{


if(i===this.tiles.length-1)

return t.value===0;



return t.value===i+1;



}

);



}



}
