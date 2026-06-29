import Tile
from "./tile.js";


export default class Board {


constructor(size=3){


this.size=size;


this.tileSize=
Math.min(
window.innerWidth,
window.innerHeight
)
/
(size+1);



this.offsetX=
(
window.innerWidth -
this.tileSize*this.size
)
/2;



this.offsetY=
(
window.innerHeight -
this.tileSize*this.size
)
/2;



this.tiles=[];


this.create();



}



create(){


let n=1;


for(let y=0;y<this.size;y++){


for(let x=0;x<this.size;x++){


this.tiles.push(

new Tile(

n===this.size*this.size?0:n,

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


this.tiles.sort(

()=>Math.random()-0.5

);


this.updatePosition();



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



const index=this.tiles.findIndex(

t=>t.contains(x,y)

);



if(index<0)return;



const empty=this.tiles.findIndex(

t=>t.value===0

);



const dx=Math.abs(

index%this.size-empty%this.size

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


}



}



draw(ctx){



this.tiles.forEach(

t=>t.draw(ctx)

);



}



isComplete(){


return false;


}



}
