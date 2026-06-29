import Tile
from "./tile.js";



export default class Board {


constructor(size=3){


this.size=size;


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

x*100,

y*100,

100

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


let arr=this.tiles

.filter(t=>t.value)

.map(t=>t.value);



let inv=0;



for(let i=0;i<arr.length;i++){


for(let j=i+1;j<arr.length;j++){


if(arr[i]>arr[j])
inv++;


}


}



return inv%2===0;



}



move(direction){



const empty =
this.tiles.findIndex(

t=>t.value===0

);



let x =
empty%this.size;


let y =
Math.floor(empty/this.size);



let target=-1;



if(direction==="left")
target=y*this.size+x+1;


if(direction==="right")
target=y*this.size+x-1;


if(direction==="up")
target=(y+1)*this.size+x;


if(direction==="down")
target=(y-1)*this.size+x;



if(target>=0 &&
target<this.tiles.length){



[
this.tiles[target],
this.tiles[empty]

]=

[
this.tiles[empty],
this.tiles[target]

];


this.updatePosition();



}



}



updatePosition(){


this.tiles.forEach(

(t,i)=>{


t.moveTo(

(i%this.size)*100,

Math.floor(i/this.size)*100

);


}

);



}



click(x,y){



const index =
this.tiles.findIndex(

t=>t.contains(x,y)

);



if(index<0)return;



const empty =
this.tiles.findIndex(

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



update(){}



draw(ctx){


this.tiles.forEach(

t=>t.draw(ctx)

);



}



isComplete(){


return this.tiles.every(

(t,i)=>

t.value===0 ||
t.value===i+1

);



}


}
