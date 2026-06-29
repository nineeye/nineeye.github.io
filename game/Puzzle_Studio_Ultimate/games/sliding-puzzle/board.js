import Tile
from "./tile.js";



export default class Board {


constructor(size=3){


this.size=size;


this.tiles=[];


this.create();



}



create(){



let num=1;


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



if(num===this.size*this.size){


this.tiles.push(

new Tile(

0,

x*100,

y*100,

100

)

);



}else{


this.tiles.push(

new Tile(

num,

x*100,

y*100,

100

)

);



}



num++;



}



}



}



shuffle(){



do{


this.tiles.sort(

()=>Math.random()-0.5

);



}

while(

!this.isSolvable()

);



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

(tile,i)=>{


let x =
i%this.size;


let y =
Math.floor(
i/this.size
);



tile.moveTo(

x*100,

y*100

);



});



}



click(x,y){



const index =
this.tiles.findIndex(

t=>t.contains(x,y)

);



if(index<0)
return;



const empty =
this.tiles.findIndex(

t=>t.value===0

);



const dx =
Math.abs(

index%this.size -
empty%this.size

);



const dy =
Math.abs(

Math.floor(index/this.size)
-
Math.floor(empty/this.size)

);



if(dx+dy===1){



[
this.tiles[index],
this.tiles[empty]

]=[

this.tiles[empty],
this.tiles[index]

];



this.updatePosition();



}



}



update(){



}



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
